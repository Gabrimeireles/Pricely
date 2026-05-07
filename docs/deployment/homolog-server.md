# Homolog Server Deploy

Pricely homolog server deploy runs the full Docker stack:

- PostgreSQL
- Redis
- pgAdmin
- backend
- web

The workflow is manual: `.github/workflows/deploy-homolog-server.yml`.

## Required Repository Secrets

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `GHCR_TOKEN` or `GHCR_PAT`
- `RUNTIME_ENV_FILE`
- `POSTGRES_PASSWORD`
- `PGADMIN_DEFAULT_PASSWORD`

`RUNTIME_ENV_FILE` is written to `.env.backend` on the server and should contain
backend-only runtime values such as:

```text
JWT_ACCESS_SECRET=...
LOG_LEVEL=info
QUEUE_WORKERS_ENABLED=true
```

Do not put CPF, receipt personal data, or local developer-only secrets in this file.

## Required Repository Variables

- `DEPLOY_PATH`

Optional variables:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PORT`
- `REDIS_PORT_PUBLIC`
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_PORT`
- `BACKEND_PORT`
- `WEB_PORT`
- `WEB_APP_URL`
- `VITE_API_BASE_URL`
- `NODE_ENV`
- `USE_TAILSCALE`

## Database Behavior

The server compose never force-resets the database on normal container start.

Workflow inputs control database maintenance:

- `reset_database=false`: runs `prisma db push` without destructive reset.
- `reset_database=true`: runs `prisma db push --force-reset`; this is destructive.
- `run_seeders=true`: runs `npm run db:seed` after schema sync/reset.

Use `reset_database=true` only when the homolog server data can be discarded.
