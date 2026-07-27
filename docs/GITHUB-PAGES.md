# GitHub Pages hosting (static export)

*Added July 2026. Read this before changing deploy targets.*

## Why this exists

GitHub Pages serves **static files only**. It cannot run Next.js API routes, middleware, or server components that call Calendly with secret tokens.

`prokuroWeb` was built for **AWS Amplify SSR** (`amplify.yml`). To also ship on GitHub Pages we added a **parallel static-export path** that does not delete the SSR app.

| Mode | Command | Host | Calendly | Auth / BOM APIs |
|------|---------|------|----------|-----------------|
| **SSR (default)** | `npm run build` + `npm start` | Amplify / Node | Custom API (`/api/calendly/*`) | Full (when `SELF_SERVE_ENABLED`) |
| **Static (Pages)** | `npm run build:pages` | GitHub Pages | Public embed (`NEXT_PUBLIC_CALENDLY_URL`) | Hidden / redirected to demo |

## What the Pages build does

`scripts/build-pages.mjs`:

1. Temporarily moves aside (does **not** delete):
   - `app/api/` → `.pages-stash/api/`
   - `middleware.ts` → `.pages-stash/middleware.ts`
   - Product routes: `app/dashboard`, `login`, `signup`, `account`, `analyze`, `bom`, `auth`
2. Runs `STATIC_EXPORT=1 next build` → writes `out/`
3. Copies `out/404/index.html` → `out/404.html` (GitHub Pages custom 404)
4. Writes `out/.nojekyll` (so `_next/` assets are served)
5. Includes `public/CNAME` → `out/CNAME` for `prokuro.ai`
6. Restores stashed files in a `finally` block

Static site includes: `/`, `/schedule`, `/privacy`, `/terms` (and assets).

## Files involved (Pages path)

| Path | Role |
|------|------|
| `docs/GITHUB-PAGES.md` | This doc |
| `scripts/build-pages.mjs` | Stash API + middleware, static build, restore |
| `next.config.ts` | Conditional `output: 'export'` |
| `.github/workflows/pages.yml` | Build + deploy `out/` to GitHub Pages |
| `lib/static-export.ts` | `isStaticExport()` helper |
| `components/SelfServeRedirect.tsx` | Client redirect when middleware is absent |
| `components/schedule/CalendlyEmbed.tsx` | Public Calendly iframe widget |
| `app/schedule/page.tsx` | Embed on static; API widget on SSR |

## One-time GitHub setup

1. Repo → **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions** (not “Deploy from a branch”)
   - If you previously used branch deploy (`/docs`), switch to **GitHub Actions** or `deploy-pages` fails with `404` / “Ensure GitHub Pages has been enabled”.
2. Repo → **Settings → Variables** (Actions)
   - `NEXT_PUBLIC_CALENDLY_URL` — your public scheduling link, e.g. `https://calendly.com/you/prokuro-demo`
   - `NEXT_PUBLIC_BASE_PATH` — leave **empty** for a custom domain at the site root; set to `/prokuroWeb` for `https://<org>.github.io/prokuroWeb/`
3. Push to `main` (or run the workflow manually)

Local check:

```bash
npm run build:pages
npx serve out
```

## Tradeoffs on Pages (known)

- No `/api/*` (BOM proxy, Calendly Scheduling API)
- No middleware (client `SelfServeRedirect` instead)
- Demo booking uses **Calendly’s embed**, not the custom booking UI
- Self-serve product routes redirect to `/schedule`

## How to revert (back to Amplify-only / SSR)

You do **not** need to rewrite history. Revert is configuration + optional file removal.

### A. Stop using GitHub Pages (keep code, switch host)

1. GitHub → Settings → Pages → disable or point elsewhere
2. Disable or delete `.github/workflows/pages.yml` if you want no Pages deploys
3. Keep using Amplify: `npm run build` (no `STATIC_EXPORT`) as before

### B. Remove the Pages path from the repo entirely

1. Delete:
   - `docs/GITHUB-PAGES.md`
   - `scripts/build-pages.mjs`
   - `.github/workflows/pages.yml`
   - `lib/static-export.ts`
   - `components/SelfServeRedirect.tsx`
   - `components/schedule/CalendlyEmbed.tsx`
2. Restore `app/schedule/page.tsx` to SSR-only Calendly (see git history before this change)
3. Remove `SelfServeRedirect` from `app/layout.tsx`
4. Simplify `next.config.ts` to remove the `STATIC_EXPORT` branch
5. Remove `build:pages` from `package.json`
6. Remove `NEXT_PUBLIC_CALENDLY_URL` / `NEXT_PUBLIC_BASE_PATH` from env examples

### C. Git rollback (if this was one commit)

```bash
git log --oneline -- docs/GITHUB-PAGES.md
git revert <commit-sha>   # preferred if already pushed
# or: git reset --hard <sha-before-pages>  # only if not shared
```

## Amplify remains valid

`amplify.yml` is unchanged. SSR builds ignore `STATIC_EXPORT`. Do not set `STATIC_EXPORT=1` on Amplify.
