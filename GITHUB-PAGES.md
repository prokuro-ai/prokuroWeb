# GitHub Pages hosting (static export)

*Added July 2026. Read this before changing deploy targets.*

## Why this exists

GitHub Pages serves **static files only**. It cannot run Next.js API routes, middleware, or server components that call Calendly with secret tokens.

`prokuroWeb` was built for **AWS Amplify SSR** (`amplify.yml`). To also ship on GitHub Pages we added a **parallel static-export path** that does not delete the SSR app.

| Mode | Command | Host | Calendly backend | Auth / BOM APIs |
|------|---------|------|------------------|-----------------|
| **SSR (default)** | `npm run build` + `npm start` | Amplify / Node | Next.js routes (`/api/calendly/*`) | Full (when `SELF_SERVE_ENABLED`) |
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

Deploy prints the Worker origin, e.g. `https://prokuro-calendly.<subdomain>.workers.dev`. Put it in `.env` as `NEXT_PUBLIC_CALENDLY_API_BASE` — it is baked into the bundle at build time, so the site must be rebuilt whenever it changes.

Update `ALLOWED_ORIGINS` in `worker/wrangler.toml` if the site origin ever changes; anything else gets a 403. Bookings are capped at 5/minute per IP so nobody can drain the Calendly quota.

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

`NEXT_PUBLIC_CALENDLY_API_BASE` must be set (via `.env` or inline) or `/schedule` will render with no available times.

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
| `lib/calendly/validation.ts` | Request rules shared by routes and Worker |

## Tradeoffs on Pages (known)

- No `/api/*` for BOM (the Calendly endpoints are covered by the Worker)
- No middleware (client `SelfServeRedirect` instead)
- First booking request pays a Worker cold start (~50ms)
- Self-serve product routes redirect to `/schedule`
- You must run `pages:branch` and commit `docs/` when the marketing site changes
- Changing the Worker URL requires a site rebuild, since it is inlined at build time

## Amplify remains valid

`amplify.yml` is unchanged. SSR builds ignore `STATIC_EXPORT`. Do not set `STATIC_EXPORT=1` on Amplify.
