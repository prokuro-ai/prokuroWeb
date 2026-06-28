# prokuroWeb

Unified Next.js frontend for Prokuro:

- Landing page at `/`
- BOM parser/analyzer app at `/analyze`

## Local development

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Runs at `http://localhost:3010`.

## Backend integration

Both `/api/parse` and `/api/analyze` proxy to the gateway via `GATEWAY_URL`.

Local `.env.local`:

```bash
GATEWAY_URL=http://localhost:3000
```

Start the backend:

```bash
cd ../prokuroBackend && docker compose up --build
```

API routes:

- `POST /api/parse` → `${GATEWAY_URL}/v1/parse`
- `POST /api/analyze` → `${GATEWAY_URL}/v1/analyze`

## Deploying (Amplify)

Deployed by CDK (`prokuroInfrastructureCDK`). One `cdk deploy` creates the Amplify app, connects GitHub, and sets branch env vars (`GATEWAY_URL`, Cognito). [`amplify.yml`](amplify.yml) is a standard Next.js build only.

Pushes to `main` trigger auto-builds.
