# Google Workspace / Sheets → BOM

**Status:** draft — not agreed yet
**Ticket:** Workspace connection + subtask “Open a Sheet as a BOM”
**Repos:** `prokuroBackend` (gateway), `prokuroWeb` (settings + upload flow), `prokuroInfrastructureCDK` (secret + env)

SCRUM-19 leftover UI still sits on unmerged web #6 / backend #10. This story does not touch those files.

## What it is

A Prokuro account owner or admin connects Google once. After that, anyone who can already upload a BOM can pick a spreadsheet + tab inside Prokuro, run the **same** column mapping and analyze path as a file, and save a living BOM. No second parser.

## How today actually works (do not invent a shortcut)

**Google login ≠ Sheets access.** Cognito `UserPoolIdentityProviderGoogle` in `lib/constructs/auth.ts` maps email/name. It does not issue a refreshable Google API token and does not request Drive/Sheets scopes. A second OAuth client is required (`access_type=offline`, `prompt=consent`).

**Parse is bytes in, BOM lines out.** `prokuroParser` `parse_file` accepts `.csv` / `.xlsx` / `.txt` only. Multi-sheet xlsx auto-picks a tab via `select_sheet`; there is **no sheet-name override** on the parse API. Analyze then enrichment cache-only is unchanged.

**Who may change account integrations.** `TeamRole::can_manage_team` is owner | admin (`auth.rs`). `can_write` is everyone except `read_only` (same gate as BOM upload). Hiding a button is not enough; connect/disconnect must use `require_manage_team` on the gateway.

## Proposed shape

1. **Connect (owner/admin).** Browser → gateway `GET /v1/integrations/google/start` with CSRF `state` bound to `account_id`. Google consent. Callback hits the **gateway**, not Cognito. Gateway stores a refresh token **per Prokuro account** (not per user).
2. **List.** `GET /v1/integrations/google/spreadsheets` — Drive list, `mimeType = application/vnd.google-apps.spreadsheet`. 403 if not connected or if the caller is `read_only` for connect/disconnect; listing for import can be `require_write` so an editor can pick a sheet after the owner connected.
3. **Import.** Client sends spreadsheet id + tab name. Gateway uses Sheets `values.get`, serializes that grid to CSV bytes, calls the **existing** parse → analyze → `saveBom` path with a filename like `{title}.csv`. Mapping UI is `BomColumnMappingStep` reused. Parser never learns Google.
4. **Disconnect.** Deletes the stored refresh token. Later list/import fail closed.

Scopes (minimum that still lets us list + read):

- `https://www.googleapis.com/auth/spreadsheets.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

Not `drive.readonly`, not Gmail, not Workspace admin.

## Token storage

Dynamo `prokuro-members` (or a new item on that table) keyed by `account_id`. Encrypt the refresh token at rest (KMS data key or a dedicated Secrets Manager blob per account — pick one in implementation; do not put tokens in Cognito attributes, Amplify env, or logs). Access token is short-lived and only in gateway memory.

Failure modes: user revokes in Google account settings → next API call 401 → mark connection `revoked`, do not retry-storm. Expired refresh → same. Missing scopes → connect is incomplete; do not store.

## Redirect URI (the real blocker)

`oauthCallbackUrls()` today is localhost + the current Amplify origin. Amplify’s `*.amplifyapp.com` host **changes every stack recreate**. Google Cloud Console redirect URIs are manual. `app.prokuro.ai` does not resolve.

Until we have a stable HTTPS origin:

- Local: `http://localhost:3000/v1/integrations/google/callback` (gateway) plus the web origin only if the callback is proxied.
- Deployed E2E in this story **requires** a go-ahead to deploy, CloudFront (or `app.prokuro.ai`) in the Google client, and teardown after. Do not claim this works in prod without that.

Do not reuse the Cognito Google client id for this flow.

## Subtasks (one PR each, after this doc)

1. **Gateway OAuth + token store** — start, callback, status, disconnect. `require_manage_team` on connect/disconnect. Cross-account id in the URL → 404, not another account’s token.
2. **List spreadsheets + tabs** — Drive + Sheets metadata only.
3. **Import tab as BOM** — CSV bytes into existing parse/analyze/save. Reuse mapping modal. No parser changes unless we later want xlsx sheet-override; CSV sidesteps that.
4. **Web: settings + BOM picker** — existing `mk-*` / `AppModal` / settings panes. Owner/admin see Connect; `read_only` does not. Callers of import are `canWrite` same as upload.

## Testing (when we deploy — not now)

DoD on the Jira is a real Google account on AWS. Until you say to deploy: unit tests with a fake Google token endpoint, plus a local docker-compose check that a fixture CSV of `values.get` output survives parse + analyze. Failure cases: deny consent, revoke, `read_only` hitting connect, account A’s token with account B’s id.

## Out of scope

Microsoft 365, live two-way sync, editing the Sheet from Prokuro, Google Picker v1 (plain list is enough), using login-with-Google as the Sheets grant.

## Open questions

- Is the Google connection **per Prokuro account** (one grant, whole team uses it) or per connecting user? Ticket text is account-level; that’s the default here.
- First live callback host: wait for `app.prokuro.ai`, or register the CloudFront `GATEWAY_URL` after the next deploy?
- Import allowed for `admin` editors, or owner-only? Default: same as file upload (`can_write`).
