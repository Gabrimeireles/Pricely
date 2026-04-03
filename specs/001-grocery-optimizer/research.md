# Research: Grocery Shopping Optimizer

## Decision 1: Use a modular NestJS monolith for backend capabilities

- **Decision**: Implement the backend as a modular NestJS monolith with separate
  modules for receipts, catalog normalization, shopping lists, stores, and
  optimization.
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

## Decision 6: Prefer minimal dependencies and native framework capabilities

- **Decision**: Use NestJS and Flutter built-in capabilities as the default approach and
  only add external libraries where they solve a clear gap in validation, persistence
  integration, or device storage.
- **Rationale**: This aligns with the project constraints around maintainability, low
  resource usage, and simplicity.
- **Alternatives considered**:
  - Broad utility and architecture packages: rejected because they add abstraction and
    maintenance overhead without clear initial value.

## Decision 7: Expose a small, stable backend API for mobile workflows

- **Decision**: Provide a concise API surface for receipt ingestion, shopping list
  management, store selection, and optimization execution/results retrieval.
- **Rationale**: A small contract supports reliable mobile integration, easier contract
  testing, and less future breakage.
- **Alternatives considered**:
  - Large generic CRUD surface: rejected because it would leak internal models and add
    unnecessary coupling.

## Decision 8: Add observability at parsing, matching, optimization, and sync boundaries

- **Decision**: Emit structured logs and diagnostic summaries for receipt parse success,
  product match confidence, optimization decisions, and mobile sync state transitions.
- **Rationale**: These are the highest-risk workflows for incorrect outcomes or user
  confusion, and they need to be debuggable without invasive manual inspection.
- **Alternatives considered**:
  - Minimal logging only: rejected because silent data-quality issues would be difficult
    to diagnose.
