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
```

API proxy routes (all via gateway):

- `POST /api/parse` -> `${GATEWAY_URL}/v1/parse`
- `POST /api/analyze` -> `${GATEWAY_URL}/v1/analyze`
- `GET|POST /api/boms` -> `${GATEWAY_URL}/v1/boms` (`GET` supports `limit` + `next_token`)
- `GET|DELETE /api/boms/[id]` -> `${GATEWAY_URL}/v1/boms/{id}`

## Deploying

For AWS deployment, point `GATEWAY_URL` at your deployed gateway endpoint in the runtime environment.
