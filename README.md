# prokuroWeb

Unified Next.js frontend for Prokuro:

- Landing page at `/`
- BOM parser/analyzer app at `/analyze`

## Local development

```bash
npm install
npm run dev
```

Runs at `http://localhost:3010`.

## Backend integration

This frontend stays in its own repository and talks to backend services via environment variables.

Set these in `.env.local`:

```bash
PARSER_URL=http://localhost:3001
GATEWAY_URL=http://localhost:3000
```

API proxy routes:

- `POST /api/parse` -> `${PARSER_URL}/v1/parse`
- `POST /api/analyze` -> `${GATEWAY_URL}/v1/analyze`

## Deploying

For AWS deployment, point `PARSER_URL` and `GATEWAY_URL` at your deployed backend endpoints in the runtime environment.
