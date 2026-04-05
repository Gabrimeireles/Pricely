# Pricely Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-04

## Active Technologies
- TypeScript on current NestJS LTS runtime; TypeScript on current + NestJS core modules, NestJS Pino, BullMQ, Redis, official (001-grocery-optimizer)
- Local MongoDB instance for backend persistence; Redis for queues and job (001-grocery-optimizer)

- TypeScript on current NestJS LTS runtime; Dart 3 with current + NestJS core modules, official MongoDB driver or NestJS (001-grocery-optimizer)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript on current NestJS LTS runtime; Dart 3 with current: Follow standard conventions

## Recent Changes
- 001-grocery-optimizer: Added TypeScript on current NestJS LTS runtime; TypeScript on current + NestJS core modules, NestJS Pino, BullMQ, Redis, official

- 001-grocery-optimizer: Added TypeScript on current NestJS LTS runtime; Dart 3 with current + NestJS core modules, official MongoDB driver or NestJS

<!-- MANUAL ADDITIONS START -->
 - Default execution workflow: each task should complete the cycle `issue -> branch -> implementation -> validation -> commit -> PR` before moving to the next task, unless the plan explicitly groups tasks into a single delivery unit.
 - Branch workflow default: publish each task branch to the remote, merge task PRs into the current phase branch, and then open a phase PR from that phase branch into `homolog`.
<!-- MANUAL ADDITIONS END -->
