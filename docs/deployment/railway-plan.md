# Railway Deployment Plan

## Services

- `backend`: NestJS API and worker process image from `backend/Dockerfile`.
- `web`: Vite build served from the web image.
- `postgres`: managed PostgreSQL.
- `redis`: managed Redis for BullMQ queues.

## Environment

Backend required variables:

- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_DB`
- `JWT_ACCESS_SECRET`
- `LOG_LEVEL`
- `QUEUE_WORKERS_ENABLED`

Web required variables:

- `VITE_API_BASE_URL`

Secrets must be configured in Railway project variables, not committed to the repo.

## Health Checks

- Backend: HTTP health endpoint to be added before production promotion.
- Web: static route availability.
- Worker: queue diagnostics from admin processing endpoints until a dedicated worker
  health endpoint exists.

## Rollout

1. Deploy backend with workers disabled and validate migrations separately.
2. Enable backend API traffic.
3. Enable workers after Redis and processing-job persistence are verified.
4. Deploy web pointing at the backend public URL.
5. Smoke auth, regions, list creation, optimization queueing, admin metrics, and
   receipt submission status.

## Rollback

- Keep previous backend and web deployments available for manual rollback.
- Disable `QUEUE_WORKERS_ENABLED` first if background processing causes failures.
- Do not run destructive Prisma commands in hosted environments.
