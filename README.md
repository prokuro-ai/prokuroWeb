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
NEXT_PUBLIC_COGNITO_REGION=us-west-2
NEXT_PUBLIC_COGNITO_DOMAIN=<prefix>.auth.us-west-2.amazoncognito.com
```

`NEXT_PUBLIC_COGNITO_DOMAIN` enables Google redirect sign-in. The OAuth callback route is `/auth/callback`.

API routes:

- `POST /api/parse` and `POST /api/analyze` proxy to the gateway when `NEXT_PUBLIC_GATEWAY_URL` is unset (local dev fallback)
- When `NEXT_PUBLIC_GATEWAY_URL` is set, the browser calls `${NEXT_PUBLIC_GATEWAY_URL}/v1/parse` and `/v1/analyze` directly to avoid Amplify's 30s proxy timeout on long BOM analysis
- `GET|POST /api/boms` -> `${GATEWAY_URL}/v1/boms` (`GET` supports `limit` + `next_token`)
- `GET|DELETE /api/boms/[id]` -> `${GATEWAY_URL}/v1/boms/{id}`

## Deploying

For AWS deployment, set `GATEWAY_URL` and `NEXT_PUBLIC_GATEWAY_URL` to your deployed gateway ALB URL (CDK sets both on Amplify automatically).
