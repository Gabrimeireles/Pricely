# Research: Grocery Shopping Optimizer

## Decision 1: Use a modular NestJS monolith for backend capabilities

- **Decision**: Implement the backend as a modular NestJS monolith with separate
  modules for receipts, catalog normalization, shopping lists, stores, optimization,
  admin reporting, and background jobs.
- **Rationale**: This keeps deployment and local development simple while preserving
  strong separation of concerns. It matches the constitution requirement to avoid
  over-engineering and supports future extraction if scaling needs change.
- **Alternatives considered**:
  - Microservices: rejected because current scope does not justify operational
    complexity.
  - Single flat service layer: rejected because parsing, matching, and optimization
    logic would become tightly coupled and harder to test.

## Decision 2: Keep MongoDB local-first for product, receipt, and optimization data

- **Decision**: Store receipt records, normalized product records, shopping lists,
  store offers, and optimization history in a local MongoDB instance.
- **Rationale**: MongoDB fits semi-structured receipt ingestion and evolving product
  normalization records well, while local deployment supports privacy, reliability, and
  fast reads during optimization.
- **Alternatives considered**:
  - PostgreSQL: rejected for initial scope because flexible receipt and matching data
    would require more schema friction early on.
  - Remote managed database only: rejected because it weakens privacy and offline/local
    reliability goals.

## Decision 3: Use explicit normalization pipeline instead of opaque fuzzy-only matching

- **Decision**: Normalize products through a staged pipeline: text cleanup, token
  normalization, unit/size extraction, store alias mapping, confidence scoring, and
  historical match reuse.
- **Rationale**: This improves consistency, makes matching decisions explainable, and
  reduces the risk of invalid substitutions. It also supports iterative improvement
  from historical data without relying on black-box behavior.
- **Alternatives considered**:
  - Direct fuzzy string matching only: rejected because it is too error-prone for
    grocery product equivalence.
  - Manual-only normalization: rejected because it does not scale with receipt volume.

## Decision 4: Design optimization engine around three explicit strategies

- **Decision**: Implement three separate optimization strategies behind a shared
  interface: Multi-Market Optimization, Local Optimization, and Global Store
  Optimization.
- **Rationale**: The user experience and trade-offs differ meaningfully by mode.
  Separate strategy implementations keep rules easy to test, extend, and explain.
- **Alternatives considered**:
  - One generic optimizer with many condition flags: rejected because it would reduce
    readability and make edge-case reasoning harder.

## Decision 5: Use offline-first mobile behavior with local caching and deferred sync

- **Decision**: The Flutter app will cache shopping lists, latest store data snapshots,
  and most recent optimization results locally, allowing read-heavy workflows and draft
  edits while offline.
- **Rationale**: Users often plan shopping in variable-connectivity environments.
  Offline-first behavior improves retention, responsiveness, and perceived reliability.
- **Alternatives considered**:
  - Fully online-only app: rejected because it creates unnecessary friction and weakens
    usability.
  - Full local database sync of every backend record: rejected initially because it is
    more complexity than the first feature needs.

## Decision 6: Use Vite + React + shadcn/ui for landing page and admin dashboard

- **Decision**: Implement the landing page and admin dashboard as a responsive
  Vite/React application using shadcn/ui for composable, consistent UI primitives.
- **Rationale**: This keeps the web layer fast, modern, and maintainable while avoiding
  heavy meta-framework complexity. It also provides a practical base for responsive
  marketing and admin workflows with a consistent component system.
- **Alternatives considered**:
  - A second mobile-only admin experience: rejected because admin visibility is more
    practical on web.
  - A larger web framework by default: rejected because the current needs do not demand
    more runtime complexity than Vite/React.

## Decision 7: Use BullMQ with Redis for background and retryable backend work

- **Decision**: Run receipt parsing, normalization follow-up, and heavier optimization
  or data-refresh jobs through BullMQ backed by Redis.
- **Rationale**: Queue-backed processing improves responsiveness and reliability without
  forcing all workflows into synchronous request lifecycles. BullMQ is established and
  fits NestJS well.
- **Alternatives considered**:
  - Synchronous request-only processing: rejected because parsing and enrichment can
    become too slow or fragile under spikes.
  - Custom in-process job orchestration: rejected because it would be less reliable and
    harder to observe.

## Decision 8: Use NestJS Pino for structured backend logging

- **Decision**: Standardize backend logging on NestJS Pino for structured, contextual
  logs across API requests, queue jobs, parsing steps, and optimization decisions.
- **Rationale**: Pino provides low-overhead structured logging and fits the project's
  performance and observability goals.
- **Alternatives considered**:
  - Plain console logging: rejected because it weakens observability and production
    diagnostics.
  - More elaborate observability stacks by default: rejected because they add setup
    complexity too early.

## Decision 9: Prefer minimal dependencies and native framework capabilities

- **Decision**: Use NestJS and Flutter built-in capabilities as the default approach and
  only add external libraries where they solve a clear gap in validation, persistence
  integration, device storage, queueing, logging, or UI composition.
- **Rationale**: This aligns with the project constraints around maintainability, low
  resource usage, and simplicity.
- **Alternatives considered**:
  - Broad utility and architecture packages: rejected because they add abstraction and
    maintenance overhead without clear initial value.

## Decision 10: Expose a small, stable backend API for mobile and admin workflows

- **Decision**: Provide a concise API surface for receipt ingestion, shopping list
  management, store selection, optimization execution/results retrieval, and admin
  reporting queries.
- **Rationale**: A small contract supports reliable mobile and web integration, easier
  contract testing, and less future breakage.
- **Alternatives considered**:
  - Large generic CRUD surface: rejected because it would leak internal models and add
    unnecessary coupling.

## Decision 11: Use Terraform-driven infrastructure and GitHub-centered delivery

- **Decision**: Manage deployable infrastructure with Terraform and trigger delivery
  from GitHub workflows, while following GitFlow with issues, branches, and pull
  requests as the collaboration baseline.
- **Rationale**: This creates a repeatable, reviewable release path and keeps
  operational changes versioned alongside application code.
- **Alternatives considered**:
  - Manual infrastructure changes: rejected because they reduce reproducibility and
    auditability.
  - Ad hoc branch management: rejected because GitFlow better matches the user's stated
    release process expectations.

## Decision 12: Add observability at parsing, matching, optimization, queue, and sync boundaries

- **Decision**: Emit structured logs and diagnostic summaries for receipt parse success,
  product match confidence, optimization decisions, queue processing, and mobile or web
  sync state transitions.
- **Rationale**: These are the highest-risk workflows for incorrect outcomes, degraded
  responsiveness, or user confusion, and they need to be debuggable without invasive
  manual inspection.
- **Alternatives considered**:
  - Minimal logging only: rejected because silent data-quality issues would be difficult
    to diagnose.
