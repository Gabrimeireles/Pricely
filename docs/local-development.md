# Local Development

## Overview

The project is organized into three application surfaces:

- `backend/` for the NestJS API
- `mobile/` for the Flutter app
- `web/` for the Vite + React landing page and admin dashboard

Infrastructure assets live under `infra/terraform/`.

## Local Services

The current baseline assumes these local services are available during development:

- MongoDB on `127.0.0.1:27017`
- Redis on `127.0.0.1:6379`

These defaults are documented in [backend/.env.example](/E:/Gabriel/Pricely/backend/.env.example)
and [web/.env.example](/E:/Gabriel/Pricely/web/.env.example).

## Backend Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Install dependencies in `backend/`.
3. Start the NestJS application once the bootstrap entrypoint is added in later tasks.

Current default values:

- API port: `3000`
- MongoDB database: `pricely`
- Redis port: `6379`

## Web Setup

1. Copy `web/.env.example` to `web/.env`.
2. Install dependencies in `web/`.
3. Run the Vite development server.

Current default values:

- Web dev server: `5173`
- Backend API base URL: `http://localhost:3000`

## Mobile Setup

1. Ensure Flutter stable with Dart 3 is installed.
2. Install Flutter dependencies in `mobile/`.
3. Run the app on an emulator or device.

## Notes

- Environment values should stay local-first for development unless a task explicitly
  introduces hosted services.
- Add new variables to the relevant `.env.example` file as backend and web features are
  implemented.
