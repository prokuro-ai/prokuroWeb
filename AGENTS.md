# Agent instructions — prokuroWeb

## After frontend changes: always publish

Pushing source to `main` alone does **not** update the live marketing site. Two deploy paths exist:

### 1. GitHub Pages (`prokuro.ai` marketing)

After any change to landing, pricing, schedule, privacy, terms, or shared marketing CSS/components:

```bash
npm run pages:branch
git add docs/
git commit -m "Update GitHub Pages site"
git push origin main
```

GitHub Pages serves committed files from `/docs` on `main`. Skipping `pages:branch` leaves production stale even when `components/` and `app/` are pushed.

See `GITHUB-PAGES.md` for details.

### 2. AWS Amplify (full SSR app)

Amplify rebuilds on push to `main` when the GitHub webhook is connected. If the live app at `https://main.<appId>.amplifyapp.com` looks stale after a push, trigger a manual build:

```bash
export AWS_PROFILE=prokuro
aws amplify start-job \
  --app-id d3n8wqfj728pqh \
  --branch-name main \
  --job-type RELEASE
```

Product routes (dashboard, BOMs, account, export, etc.) ship via Amplify only — not GitHub Pages.

## Checklist before marking UI work done

- [ ] Source committed and pushed to `origin/main`
- [ ] Marketing/visual changes: `npm run pages:branch` + commit `docs/` + push
- [ ] Amplify build succeeded (auto or manual `start-job`) when SSR/product UI changed
- [ ] Spot-check live URLs after deploy completes

## Do not

- Edit files under `docs/` by hand — regenerate with `pages:branch`
- Set `STATIC_EXPORT=1` on Amplify (SSR build uses default `npm run build`)
