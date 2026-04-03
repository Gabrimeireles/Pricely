# Implementation Plan: Grocery Shopping Optimizer

**Branch**: `001-grocery-optimizer` | **Date**: 2026-04-03 | **Spec**: [spec.md](E:/Gabriel/Pricely/specs/001-grocery-optimizer/spec.md)
**Input**: Feature specification from `/specs/001-grocery-optimizer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a grocery shopping optimization system with a NestJS backend, Flutter mobile app,
and local MongoDB storage that ingests receipt-derived supermarket data, normalizes
product names, and generates savings-focused shopping recommendations in three modes:
multi-market, local single-market, and best single-store. The design prioritizes
modular architecture, offline-first behavior where practical, minimal dependencies,
clear trade-off explanations, and extensibility for future optimization and
personalization features.

## Technical Context

**Language/Version**: TypeScript on current NestJS LTS runtime; Dart 3 with current
Flutter stable  
**Primary Dependencies**: NestJS core modules, official MongoDB driver or NestJS
MongoDB integration, Flutter SDK core libraries, platform storage support required for
offline caching, OpenAPI for API contract documentation  
**Storage**: Local MongoDB instance for backend persistence; local device cache for
offline-first mobile behavior  
**Testing**: Backend unit and integration tests with NestJS testing utilities; mobile
widget and unit tests with Flutter test framework; contract tests for API behavior  
**Target Platform**: Android and iOS mobile clients backed by a local/developer-hosted
NestJS API service  
**Project Type**: Mobile app plus modular backend service  
**Performance Goals**: Optimized shopping plans for standard grocery lists should be
computed quickly enough for interactive use; receipt parsing and normalization should
complete without noticeable blocking in normal flows; mobile screens should remain
responsive during sync and optimization operations  
**Constraints**: Prefer a minimal number of external libraries; process and store data
locally when possible; preserve user privacy; support offline-first behavior when
possible; keep architecture simple and extensible; avoid speculative over-engineering  
**Scale/Scope**: Initial release supports grocery list optimization, receipt ingestion,
product normalization, store comparison, and local historical price intelligence for an
individual user or household dataset

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code quality: Architecture is organized into clear backend and mobile modules, with
  explicit domain boundaries for receipts, catalog normalization, pricing, and
  optimization. Design artifacts keep responsibilities narrow and traceable.
- Architecture: Backend separates API, application, domain, and persistence concerns.
  Mobile separates presentation, state orchestration, domain use cases, and local sync
  concerns. Shared contracts are documented at the API boundary only.
- Testing: Plan requires backend unit tests for parsing, normalization, and
  optimization logic; integration tests for persistence and API flows; Flutter unit and
  widget tests for state and presentation; contract tests for client-server behavior.
- Reliability: Parsing and optimization flows surface unresolved items rather than
  inventing answers. Local persistence, sync retries, stale-data handling, and explicit
  feedback paths are designed into the workflows.
- Performance: Receipt ingestion, product matching, and optimization are designed around
  efficient local reads, normalized lookup indexes, and bounded optimization passes for
  common list sizes. Mobile avoids blocking UI on long-running operations.
- Observability: Backend structured logging, domain event tracing, sync diagnostics, and
  optimization decision summaries are included. Mobile includes user-visible sync and
  processing states plus actionable error reporting.
- Simplicity and reuse: Design favors NestJS and Flutter native capabilities, minimal
  dependencies, reusable normalization and optimization services, and no unnecessary
  abstraction layers.
- UX consistency: All optimization modes return the same output shape: recommended
  option, total estimated cost, savings comparison, confidence or missing-data notices,
  and clear store breakdown where relevant.

## Project Structure

### Documentation (this feature)

```text
specs/001-grocery-optimizer/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- grocery-optimizer-api.yaml
`-- tasks.md
```

### Source Code (repository root)

```text
backend/
|-- src/
|   |-- app.module.ts
|   |-- common/
|   |   |-- errors/
|   |   |-- logging/
|   |   `-- validation/
|   |-- receipts/
|   |   |-- api/
|   |   |-- application/
|   |   |-- domain/
|   |   `-- infrastructure/
|   |-- catalog/
|   |   |-- application/
|   |   |-- domain/
|   |   `-- infrastructure/
|   |-- optimization/
|   |   |-- api/
|   |   |-- application/
|   |   |-- domain/
|   |   `-- infrastructure/
|   |-- stores/
|   |-- lists/
|   `-- persistence/
`-- test/
    |-- contract/
    |-- integration/
    `-- unit/

mobile/
|-- lib/
|   |-- app/
|   |-- core/
|   |   |-- errors/
|   |   |-- networking/
|   |   |-- storage/
|   |   `-- widgets/
|   |-- features/
|   |   |-- shopping_lists/
|   |   |-- receipts/
|   |   |-- optimization/
|   |   `-- stores/
|   `-- shared/
`-- test/
    |-- unit/
    `-- widget/

docs/
`-- api/
```

**Structure Decision**: Use a two-application structure with `backend/` for NestJS and
`mobile/` for Flutter because the feature spans a server-side optimization/data service
and a mobile-first user experience. Both apps use feature-based modules with consistent
internal layering to preserve separation of concerns and allow future growth without
mixing parsing, persistence, optimization, and UI logic.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
