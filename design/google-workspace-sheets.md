# Google Workspace / Sheets → BOM

**Status:** agreed on the three calls below — implementation may start
**Ticket:** Workspace connection + subtask “Open a Sheet as a BOM”
**Repos:** `prokuroBackend` (gateway), `prokuroWeb` (settings + upload flow), `prokuroInfrastructureCDK` (Sheets OAuth secret + env — not the Cognito Google login secret)

SCRUM-19 leftover UI still sits on unmerged web #6 / backend #10. This story does not touch those files.

## Decisions (locked)

1. **Per Prokuro account. One grant, whole team.** Per-user OAuth means every uploader consents, and the integration dies when that person leaves. Connect/disconnect: `require_manage_team` (owner | admin). Path `account_id` that is not the caller’s account → **404**, not 403.

   Caveat: editors then see whatever Sheets that connecting admin’s Google can see. Store **which Prokuro user** connected it (`connected_by_user_id`, Prokuro email, timestamp) for audit. Do **not** store tokens per user.

2. **Do not wait for `app.prokuro.ai`.** Callback hits the **gateway**, so the Google redirect URI is the gateway HTTPS origin, not Amplify and not `prokuro.ai`. First live URI after the next deploy: `https://<dist>.cloudfront.net/v1/integrations/google/callback`, plus `http://localhost:3000/v1/integrations/google/callback` for local. `app.prokuro.ai` is a later product hostname and does not resolve. **No live E2E until an explicit deploy go-ahead.**

3. **Import = same as file upload (`can_write`).** Owner-only import is a fake restriction today: the only roles are owner | admin | read_only, so `can_write` and `can_manage_team` are the same two people. `read_only` cannot import. When a real editor role exists, they import from the **account** grant and still cannot connect/disconnect.

Do **not** reuse the Cognito Google client (`prokuro/google/oauth`). That IdP only maps email/name for login.

## What it is

A Prokuro account owner or admin connects Google once. After that, anyone with `can_write` can pick a spreadsheet + tab, run the **same** column mapping and analyze path as a file, and save a living BOM. No second parser.

## How today actually works

**Google login ≠ Sheets access.** Cognito `UserPoolIdentityProviderGoogle` in `lib/constructs/auth.ts` does not issue a refreshable Google API token and does not request Drive/Sheets scopes. Second OAuth client: `access_type=offline`, `prompt=consent`.

**Parse is bytes in, BOM lines out.** `parse_file` accepts `.csv` / `.xlsx` / `.txt` only. Multi-sheet xlsx auto-picks a tab; there is no sheet-name override. Import serializes the chosen tab to CSV and calls the existing parse → analyze → save path.

## Shape

1. **Connect (owner/admin).** `GET /v1/accounts/{account_id}/integrations/google/start` — CSRF `state` HMAC-bound to `account_id` + connecting `user_id`. Redirect to Google. Callback `GET /v1/integrations/google/callback` on the gateway (no Cognito). Store one encrypted refresh token on the **account**.
2. **Status.** `GET /v1/accounts/{account_id}/integrations/google` — any authenticated member of that account. Returns connected flag + audit fields. Never tokens.
3. **Disconnect (owner/admin).** `DELETE` same path. Deletes the refresh token. Later list/import fail closed.
4. **List (later PR).** `can_write`. Drive list, spreadsheet MIME type.
5. **Import (later PR).** `can_write`. Sheets `values.get` → CSV → existing parse/analyze/save.

Scopes:

- `https://www.googleapis.com/auth/spreadsheets.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

Not `drive.readonly`, not Gmail, not Workspace admin, not the Cognito login client.

## Token storage

One Dynamo item on `prokuro-members`: `pk=ACCOUNT#{account_id}`, `sk=INTEGRATION#GOOGLE`. AES-256-GCM with `GOOGLE_TOKEN_KEY` (32-byte hex, env — not the Cognito OAuth secret). Ciphertext only in Dynamo. Access token in gateway memory for the request. Logs must not print tokens, codes, or `state` secrets.

Audit attributes on that item: `connected_by_user_id`, `connected_by_email`, `connected_at`, `status` (`active` | `revoked`).

Env (Sheets client, **separate** from `prokuro/google/oauth`): `GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` (`{GATEWAY_PUBLIC_URL}/v1/integrations/google/callback`), `GOOGLE_TOKEN_KEY`, `GOOGLE_OAUTH_SUCCESS_REDIRECT` (web origin after callback).

Failure: user revokes in Google → next API 401 → mark `revoked`, no retry storm. Missing refresh token on consent → do not store. Missing env → connect returns 503.

## Subtasks (one PR each)

1. **Gateway OAuth + token store** — start, callback, status, disconnect. `require_manage_team` on connect/disconnect. Cross-account id → 404.
2. **List spreadsheets + tabs** — Drive + Sheets metadata only. `can_write`.
3. **Import tab as BOM** — CSV into existing parse/analyze/save. Reuse mapping modal.
4. **Web: settings + BOM picker** — existing `mk-*`. Connect only if `canManage`. Import on the upload flow if `canWrite`.

## Testing

Until a deploy go-ahead: unit tests with a fake token endpoint. Failure cases in PR 1: deny consent, `read_only` on start/disconnect, account A’s id in account B’s URL → 404, status JSON has no token fields.

Live Google + CloudFront URI is a later session.

## Out of scope

Microsoft 365, live two-way sync, editing the Sheet from Prokuro, Google Picker, using login-with-Google as the Sheets grant, `app.prokuro.ai` as the OAuth callback host.
