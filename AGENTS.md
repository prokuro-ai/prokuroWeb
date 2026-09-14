# Agent instructions — prokuroWeb

## Working agreement

Applies to `prokuroBackend`, `prokuroInfrastructureCDK`, and `prokuroWeb`. Keep the three copies in sync.

### Design before code

Every story gets a rough one-pager before implementation: what it does, which services and repos it touches, how it fits the current architecture, and the failure modes. Rough is fine — the point is that the team sees the architecture evolve instead of discovering it in a diff.

In this repo they live in `design/`, **not** `docs/` — `docs/` is the generated GitHub Pages output and anything committed there is published on `prokuro.ai`.

### Verify on a real deployed stack

A feature is not done because it worked locally or behind a throwaway UI. Deploy it and exercise it end to end on AWS. The expensive bugs are the ones that only surface when the CloudFormation stack is re-deployed against an evolved codebase.

Deploys bill by the hour. Get a go-ahead before deploying, and when verification is finished, destroy the stack or scale the Fargate service to 0 — and say which one you did.

### Small PRs, cross-reviewed

Story → tasks → one small PR per task, opened after the design doc. Never push to `main` directly; branch as `feat/<short-name>`. Whoever picks up a feature asks the other person for a sanity check before merge. Large PRs hide small mistakes — that is the entire reason for this rule.

## After frontend changes: always publish

Pushing source to `main` alone does **not** update the live marketing site. Two deploy paths exist:

### 1. GitHub Pages (`prokuro.ai` marketing)

After any change to landing, pricing, schedule, privacy, terms, or shared marketing CSS/components:

```bash
npm run pages:branch
git add docs/
git commit -m "Update GitHub Pages site"
```

Put the regenerated `docs/` in the same PR as the source change. GitHub Pages serves committed files from `/docs` on `main`, so the site only moves once that PR merges. Skipping `pages:branch` leaves production stale even when `components/` and `app/` are merged.

See `GITHUB-PAGES.md` for details.

### 2. AWS Amplify (full SSR app)

The Amplify app is created by the `Prokuro` stack, so it only exists while that stack is deployed and its ID changes on every recreate. Never hardcode an app ID here — read the CloudFormation output `AmplifyAppId` (or the Amplify console) each time.

Amplify rebuilds on push to `main` when the GitHub webhook is connected. If the live app at `https://main.<appId>.amplifyapp.com` looks stale after a push, trigger a manual build:

```bash
export AWS_PROFILE=prokuro
aws amplify start-job \
  --app-id <AmplifyAppId> \
  --branch-name main \
  --job-type RELEASE
```

Product routes (dashboard, BOMs, account, export, etc.) ship via Amplify only — not GitHub Pages.

See `prokuroInfrastructureCDK/docs/GO-LIVE.md` for SES / Stripe / domain blockers.

## Checklist before marking UI work done

- [ ] Source on a `feat/*` branch, PR opened and sanity-checked by the other person
- [ ] Marketing/visual changes: `npm run pages:branch` + regenerated `docs/` committed in the same PR
- [ ] Amplify build succeeded (auto or manual `start-job`) when SSR/product UI changed
- [ ] Spot-check live URLs after deploy completes

## Do not

- Edit files under `docs/` by hand — regenerate with `pages:branch`
- Set `STATIC_EXPORT=1` on Amplify (SSR build uses default `npm run build`)
