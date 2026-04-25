# Quickstart: Grocery Shopping Optimizer

## Goal

Validate the replanned local stack for PostgreSQL, Redis, queue workers, shared auth,
regional catalog queries, reusable shopping lists, optimization jobs, and admin CRUD.

## Prerequisites

- Local PostgreSQL instance running
- Local Redis instance running
- NestJS backend dependencies installed
- Prisma migrations available locally
- Flutter SDK installed and device or emulator available
- Web application dependencies installed
- Feature branch `001-grocery-optimizer` checked out

## Backend Setup

1. Start PostgreSQL and Redis locally.
2. Configure backend environment values for PostgreSQL, Redis, JWT/session secrets, and
   app settings.
3. Apply Prisma migrations and seed minimal data for one admin, one customer, one
   active region, and a small offer catalog.
4. Start the NestJS API locally.
5. Start the BullMQ worker process if it runs separately from the API.
6. Confirm the backend can connect to PostgreSQL and Redis and exposes both public and
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
