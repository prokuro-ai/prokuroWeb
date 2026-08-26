# GitHub Pages hosting (static export)

*Added July 2026. Read this before changing deploy targets.*

## Why this exists

GitHub Pages serves **static files only**. It cannot run Next.js API routes, middleware, or server components that call Calendly with secret tokens.

`prokuroWeb` was built for **AWS Amplify SSR** (`amplify.yml`). To also ship on GitHub Pages we added a **parallel static-export path** that does not delete the SSR app.

| Mode | Command | Host | Calendly backend | Auth / BOM APIs |
|------|---------|------|------------------|-----------------|
| **SSR (default)** | `npm run build` + `npm start` | Amplify / Node | Next.js routes (`/api/calendly/*`) | Full |
| **Static (Pages)** | `npm run pages:branch` | GitHub Pages | Cloudflare Worker (`worker/`) | Hidden / redirected to demo |

The **same booking UI** (`components/schedule/BookDemo.tsx`) ships in both modes. Only the origin serving `/api/calendly/*` differs, controlled by `NEXT_PUBLIC_CALENDLY_API_BASE`.

## Calendly on a static host

`CALENDLY_API_TOKEN` grants write access to scheduled events, contacts, and webhooks, so it must never reach the browser. A static host has nowhere to keep it — hence the Worker in `worker/index.ts`, which serves the same three paths off the same `lib/calendly` code and holds the token as a Cloudflare secret.

### One-time Worker setup

```bash
npx wrangler login
npx wrangler secret put CALENDLY_API_TOKEN      --config worker/wrangler.toml
npx wrangler secret put CALENDLY_EVENT_TYPE_URI --config worker/wrangler.toml
npm run worker:deploy
```

If the account has no `workers.dev` subdomain yet, `worker:deploy` offers to register one — answer yes. Run it from a real terminal, since that prompt is skipped in non-interactive shells.

Deploy prints the Worker origin. It lives in `lib/calendly/config.ts` as `CALENDLY_WORKER_ORIGIN`, committed rather than passed as a build variable: it is public either way (it ships in the client bundle), and a missing variable used to publish a booking page that silently loaded no times. **If you deploy under a different name or account, update that constant and rebuild.**

Update `ALLOWED_ORIGINS` in `worker/wrangler.toml` if the site origin ever changes; anything else gets a 403. Bookings are capped at 5/minute per IP so nobody can drain the Calendly quota.

Verify the deployed Worker directly:

```bash
curl -H "Origin: https://prokuro.ai" \
  "https://prokuro-calendly.mounir-d96.workers.dev/api/calendly/availability"
```

Useful:

```bash
npm run worker:dev    # local Worker on :8787
npm run worker:tail   # live production logs
```

## Deploy without GitHub Actions (recommended)

GitHub Pages can serve committed files from a branch — no Actions setup required.

### One-time GitHub setup

1. Repo → **Settings → Pages → Build and deployment**
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/docs`
2. **Custom domain:** `prokuro.ai` (optional; `docs/CNAME` is included in the build)

### Publish (after site changes)

```bash
npm run pages:branch
git add docs/
git commit -m "Update GitHub Pages site"
git push origin main
```

GitHub rebuilds the site from `docs/` on push. Home page URL: **`https://prokuro.ai/`**

No extra env vars are needed. To sanity-check `/schedule` after a build, confirm the exported HTML prerenders in the loading state rather than the empty one:

```bash
grep -c "Loading available times" docs/schedule/index.html   # 1 = wired up
grep -c "No open times"          docs/schedule/index.html    # 1 = backend missing
```

Local preview:

```bash
npm run pages:branch
npx serve docs
```

## What the build does

`npm run pages:branch` runs:

1. `scripts/build-pages.mjs` — static Next export to `out/`
2. `scripts/sync-pages-to-docs.mjs` — copies `out/` → `docs/`

The build temporarily moves aside server-only routes (`app/api`, middleware, dashboard, auth, etc.), exports marketing pages (`/`, `/schedule`, `/privacy`, `/terms`), then restores source files.

`docs/` contains the **published site** (HTML, `_next/`, `CNAME`, `.nojekyll`). Do not edit files in `docs/` by hand — regenerate with `npm run pages:branch`.

## Files involved

| Path | Role |
|------|------|
| `GITHUB-PAGES.md` | This doc |
| `docs/` | Published static site (served by Pages) |
| `scripts/build-pages.mjs` | Stash routes, static build, restore |
| `scripts/sync-pages-to-docs.mjs` | Copy `out/` → `docs/` |
| `next.config.ts` | Conditional `output: 'export'` |
| `public/CNAME` | Custom domain → copied into `docs/CNAME` |
| `worker/index.ts` | Calendly proxy holding the API token |
| `worker/wrangler.toml` | Worker config: allowed origins, rate limit |
| `lib/calendly/config.ts` | Worker origin used by static builds |
| `lib/calendly/validation.ts` | Request rules shared by routes and Worker |

## Tradeoffs on Pages (known)

- No `/api/*` for BOM (the Calendly endpoints are covered by the Worker)
- No middleware (client `SelfServeRedirect` instead)
- First booking request pays a Worker cold start (measured ~7ms startup)
- Self-serve product routes redirect to `/schedule`
- You must run `pages:branch` and commit `docs/` when the marketing site changes
- Changing the Worker URL requires editing `lib/calendly/config.ts` and rebuilding

## Amplify remains valid

`amplify.yml` is unchanged. SSR builds ignore `STATIC_EXPORT`. Do not set `STATIC_EXPORT=1` on Amplify.
