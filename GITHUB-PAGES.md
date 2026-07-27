# GitHub Pages hosting (static export)

*Added July 2026. Read this before changing deploy targets.*

## Why this exists

GitHub Pages serves **static files only**. It cannot run Next.js API routes, middleware, or server components that call Calendly with secret tokens.

`prokuroWeb` was built for **AWS Amplify SSR** (`amplify.yml`). To also ship on GitHub Pages we added a **parallel static-export path** that does not delete the SSR app.

| Mode | Command | Host | Calendly | Auth / BOM APIs |
|------|---------|------|----------|-----------------|
| **SSR (default)** | `npm run build` + `npm start` | Amplify / Node | Custom API (`/api/calendly/*`) | Full (when `SELF_SERVE_ENABLED`) |
| **Static (Pages)** | `npm run pages:branch` | GitHub Pages | Public embed (`NEXT_PUBLIC_CALENDLY_URL`) | Hidden / redirected to demo |

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

Optional env for Calendly embed on `/schedule`:

```bash
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/you/prokuro-demo npm run pages:branch
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

## Tradeoffs on Pages (known)

- No `/api/*` (BOM proxy, Calendly Scheduling API)
- No middleware (client `SelfServeRedirect` instead)
- Demo booking uses **Calendly’s embed**, not the custom booking UI
- Self-serve product routes redirect to `/schedule`
- You must run `pages:branch` and commit `docs/` when the marketing site changes

## Amplify remains valid

`amplify.yml` is unchanged. SSR builds ignore `STATIC_EXPORT`. Do not set `STATIC_EXPORT=1` on Amplify.
