# Quickstart: Grocery Shopping Optimizer

## Goal

Validate the replanned local stack for PostgreSQL, Redis, queue workers, shared auth,
regional catalog queries, reusable shopping lists, optimization jobs, and admin CRUD.

## Prerequisites

- Docker Desktop or Docker Engine available for local orchestration
- NestJS backend dependencies installed when running services outside Docker
- Flutter SDK installed and device or emulator available
- Web application dependencies installed when running services outside Docker
- Repository dependencies installed in `backend/`, `web/`, and `mobile/`

## Container Setup

1. Start the full local stack with `docker compose up --build`.
2. Wait for PostgreSQL, Redis, backend, and web to report healthy or
   started states.
3. Confirm the following endpoints are reachable from the host machine:
   - `http://localhost:3000` for the backend API
   - `http://localhost:5173` for the web app
4. Use `docker compose down` to stop the stack.
5. Use `docker compose down -v` when you need to reset PostgreSQL and Redis data.

## Backend Setup

1. Configure backend environment values for PostgreSQL, Redis,
   JWT/session secrets, and app settings when running outside Docker.
2. Apply Prisma migrations or `db push` and seed minimal data for one admin, one customer,
   one active region, and a small offer catalog.
3. Start the NestJS API locally if not using Docker.
4. Start the BullMQ worker process if it runs separately from the API.
5. Confirm the backend can connect to PostgreSQL and Redis and exposes both public and
   admin API surfaces.

## Mobile Setup

1. Configure the Flutter app to point to the local backend environment.
2. Sign in with a shared account.
3. Confirm the app can load regions, saved lists, and latest optimization runs for that
   account.

## Web Setup

1. Configure the Vite/React app to point to the local backend environment.
2. Start the public web app locally.
3. Confirm the public region selector lists visible regions with active establishment
   counts.
4. Confirm the admin dashboard is accessible only with an admin-capable account.

## Manual Verification Flow

1. Create one customer account and one admin account.
2. Sign in with the same customer account on mobile and web.
3. Create a shopping list on one surface and confirm it appears on the other.
4. Request a new optimization run for the saved list and verify:
   - The backend returns a queued processing state quickly
   - A processing job is created
   - The completed result can be fetched later
5. Query visible regions and verify:
   - Regions marked `inactive` do not appear publicly
   - Each visible region returns an active establishment count
   - A visible zero-store region can still be shown with count `0`
6. Browse offers in a region and open product details. Verify the product detail payload
   includes multiple store prices when available.
7. Sign in as admin on web and verify:
   - Overview metrics load
   - Regions can be activated/deactivated
   - Establishments can be created or disabled
   - Products and offers can be created or edited
8. Trigger a failure case for an optimization job and verify:
   - The failure is visible in logs
   - The processing job tracks the failure state
   - Admin diagnostics can expose the issue

## Expected Outcomes

- Shared accounts work consistently across mobile and web
- Optimization remains backend-owned and queue-backed
- Public region selection obeys implantation and active-store rules
- Product detail data can explain where each price comes from
- Admin CRUD can control the catalog and operating regions
- Logs and job states make processing failures actionable

## Validation Record

Validated on `2026-04-27` with the current local stack:

1. `docker compose down -v`
2. `docker compose up --build -d`
3. `cd backend && npm run lint && npm run build && npm test -- --runInBand`
4. `cd web && npm run lint && npm run build && npm test`
5. `cd mobile && flutter analyze && flutter test && flutter build apk --debug`
6. Smoke requests executed successfully for:
   - `POST /auth/register`
   - `POST /auth/login`
   - `GET /regions`
   - `GET /regions/:slug/offers`
   - `GET /offers/:offerId`
   - `POST /shopping-lists`
   - `POST /shopping-lists/:id/items`
   - `POST /shopping-lists/:id/optimize`
   - `GET /shopping-lists/:id/optimizations/latest`
   - `GET /admin/metrics`
   - `GET /admin/processing-jobs`
   - `GET /admin/queue-health`

Known gap after this validation:

- The MVP is functional, but admin CRUD depth, richer public/mobile coverage, and final polish tasks still remain before release sign-off.
