# Pricely Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-25

## Active Technologies
- TypeScript on current NestJS LTS runtime; TypeScript on current + NestJS core modules, NestJS Pino, BullMQ, Redis, PostgreSQL, Prisma ORM (001-grocery-optimizer)
- PostgreSQL for backend persistence; Redis for queues and job coordination (001-grocery-optimizer)
- TypeScript on current Vite/React runtime; Dart 3 with current Flutter stable; shadcn/ui for web; Flutter Stacked for mobile (001-grocery-optimizer)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript on current NestJS LTS runtime; TypeScript on current Vite/React runtime; Dart 3 with current Flutter stable: Follow standard conventions

## Recent Changes
- 001-grocery-optimizer: Replanned backend around PostgreSQL, Prisma ORM, Redis, BullMQ, shared auth, regions, establishments, canonical products, product offers, admin metrics, and backend-owned optimization runs
- 001-grocery-optimizer: Confirmed frontend stack remains Vite/React + shadcn/ui and mobile remains Flutter Stacked with shared-account behavior

<!-- MANUAL ADDITIONS START -->
 - Default execution workflow: each task should complete the cycle `issue -> branch -> implementation -> validation -> commit -> PR` before moving to the next task, unless the plan explicitly groups tasks into a single delivery unit.
 - Branch workflow default: publish each task branch to the remote, merge task PRs into the current phase branch, and then open a phase PR from that phase branch into `homolog`.
 - Issue-closing workflow: do not rely on `Closes #...` in task or phase PRs that target `homolog`; if automatic closure is required, the final PR into the default branch must carry the closing keywords.
<!-- MANUAL ADDITIONS END -->
