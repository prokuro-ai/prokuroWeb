# prokuroWeb

Unified Next.js frontend for Prokuro:

- Landing page at `/`
- Authenticated dashboard at `/dashboard`
- BOM upload at `/bom/new`
- BOM results at `/bom/[id]`

## Local development

```bash
npm install
npm run dev
```

Runs at `http://localhost:3010`.

## Backend integration

This frontend talks to the gateway via environment variables.

Set these in `.env.local`:

```bash
GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<app-client-id>
NEXT_PUBLIC_COGNITO_DOMAIN=<prefix>.auth.us-west-2.amazoncognito.com
```

`NEXT_PUBLIC_COGNITO_DOMAIN` enables Google redirect sign-in. The OAuth callback route is `/auth/callback`.

**Local Admin Enable** must talk to a **local** gateway (`GATEWAY_URL=http://localhost:3000`). Do not Enable against the production ALB. Cognito is the production user pool, so a grant issued through prod would turn on a real account.

Only `admin@prokuro.ai` can use the product until you Enable another email. If `BILLING_TABLE` is unset, grants live in gateway memory and reset on restart. If `.env` points `BILLING_TABLE` at the production table, Enable writes there — unset it or use a throwaway table for local tests.

API routes:

- `POST /api/parse` and `POST /api/analyze` proxy to the gateway when `NEXT_PUBLIC_GATEWAY_URL` is unset (local dev fallback)
- When `NEXT_PUBLIC_GATEWAY_URL` is set, the browser calls `${NEXT_PUBLIC_GATEWAY_URL}/v1/parse` and `/v1/analyze` directly to avoid Amplify's 30s proxy timeout on long BOM analysis
- `GET|POST /api/boms` -> `${GATEWAY_URL}/v1/boms` (`GET` supports `limit` + `next_token`)
- `GET|DELETE /api/boms/[id]` -> `${GATEWAY_URL}/v1/boms/{id}`

## Deploying

### AWS Amplify (SSR — full app)

Set `GATEWAY_URL` and `NEXT_PUBLIC_GATEWAY_URL` to your deployed gateway ALB URL (CDK sets both on Amplify automatically). Use `npm run build` (default). Do **not** set `STATIC_EXPORT=1` on Amplify.

### GitHub Pages (static marketing + demo booking)

No GitHub Actions needed. Build locally, commit `docs/`, push:

```bash
npm run pages:branch
git add docs/
git commit -m "Update GitHub Pages site"
git push origin main
```

GitHub **Settings → Pages**: source **Deploy from a branch**, branch **`main`**, folder **`/docs`**.

Full setup and tradeoffs: [`GITHUB-PAGES.md`](./GITHUB-PAGES.md).
