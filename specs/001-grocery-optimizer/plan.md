# Implementation Plan: Grocery Shopping Optimizer

**Branch**: `001-grocery-optimizer` | **Date**: 2026-04-03 | **Spec**: [spec.md](E:/Gabriel/Pricely/specs/001-grocery-optimizer/spec.md)
**Input**: Feature specification from `/specs/001-grocery-optimizer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a grocery shopping optimization system with a NestJS backend, Flutter mobile app,
Vite/React web surface for the landing page and admin dashboard, and local MongoDB
storage that ingests receipt-derived supermarket data, normalizes product names, and
generates savings-focused shopping recommendations in three modes: multi-market, local
single-market, and best single-store. The design prioritizes modular architecture,
offline-first behavior where practical, minimal dependencies, clear trade-off
explanations, queue-backed background processing, responsive interfaces, and
extensibility for future optimization and personalization features.

## Technical Context

**Language/Version**: TypeScript on current NestJS LTS runtime; TypeScript on current
Vite/React runtime; Dart 3 with current Flutter stable  
**Primary Dependencies**: NestJS core modules, NestJS Pino, BullMQ, Redis, official
MongoDB driver or NestJS MongoDB integration, Flutter SDK core libraries, Vite, React,
shadcn/ui, OpenAPI for API contract documentation, Terraform for infrastructure as
code  
**Storage**: Local MongoDB instance for backend persistence; Redis for queues and job
coordination; local device cache for offline-first mobile behavior; browser-local state
for web UX where appropriate  
**Testing**: Backend unit and integration tests with NestJS testing utilities; mobile
widget and unit tests with Flutter test framework; web component and route tests for
React surfaces; contract tests for API behavior  
**Target Platform**: Android and iOS mobile clients, responsive web landing page,
responsive admin dashboard, and a local/developer-hosted NestJS API service  
**Project Type**: Mobile app plus backend service plus responsive web applications  
**Performance Goals**: Optimized shopping plans for standard grocery lists should be
computed quickly enough for interactive use; receipt parsing and normalization should
complete without noticeable blocking in normal flows; mobile and web screens should
remain responsive during sync, optimization, and dashboard operations  
**Constraints**: Prefer a minimal number of external libraries; process and store data
locally when possible; preserve user privacy; support offline-first behavior when
possible; keep architecture simple and extensible; avoid speculative over-engineering;
follow GitFlow with issues, branches, and pull requests; deploy from GitHub through the
selected infrastructure pipeline  
**Scale/Scope**: Initial release supports grocery list optimization, receipt ingestion,
product normalization, store comparison, local historical price intelligence, a
marketing landing page, and an admin dashboard for price, item, and list visibility

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code quality: Architecture is organized into clear backend and mobile modules, with
  explicit domain boundaries for receipts, catalog normalization, pricing,
  optimization, marketing web content, and admin reporting. Design artifacts keep
  responsibilities narrow and traceable.
- Architecture: Backend separates API, application, domain, and persistence concerns.
  Mobile separates presentation, state orchestration, domain use cases, and local sync
  concerns. Web separates marketing UI and admin dashboard features from backend data
  contracts. Shared contracts are documented at the API boundary only.
- Testing: Plan requires backend unit tests for parsing, normalization, and
  optimization logic; integration tests for persistence, queues, and API flows;
  Flutter unit and widget tests for state and presentation; React tests for landing and
  dashboard behavior; contract tests for client-server behavior.
- Reliability: Parsing and optimization flows surface unresolved items rather than
  inventing answers. Local persistence, queue retries, sync retries, stale-data
  handling, and explicit feedback paths are designed into the workflows.
- Performance: Receipt ingestion, product matching, and optimization are designed around
  efficient local reads, normalized lookup indexes, bounded optimization passes for
  common list sizes, and queued background processing for heavier work. Mobile and web
  avoid blocking UI on long-running operations.
- Observability: Backend structured logging with NestJS Pino, queue diagnostics,
  domain event tracing, sync diagnostics, and optimization decision summaries are
  included. Mobile and web include user-visible sync and processing states plus
  actionable error reporting.
- Simplicity and reuse: Design favors NestJS and Flutter native capabilities, minimal
  dependencies, reusable normalization and optimization services, and no unnecessary
  abstraction layers. Web UI is consolidated in a single Vite/React workspace with
  shared shadcn-based primitives instead of separate design systems.
- UX consistency: All optimization modes return the same output shape: recommended
  option, total estimated cost, savings comparison, confidence or missing-data notices,
  and clear store breakdown where relevant. Landing, dashboard, and app flows all
  require responsive mobile-ready layouts and consistent interaction feedback.

## Project Structure

### Documentation (this feature)

```text
specs/001-grocery-optimizer/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- grocery-optimizer-api.yaml
|   `-- admin-dashboard-flows.md
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
|   |   |-- queue/
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
|   |-- admin/
|   |-- jobs/
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

web/
|-- src/
|   |-- marketing/
|   |-- dashboard/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   `-- routes/
`-- test/

infra/
|-- terraform/
|   |-- environments/
|   |-- modules/
|   `-- variables/
`-- delivery/

.github/
|-- workflows/
`-- PULL_REQUEST_TEMPLATE.md
```

**Structure Decision**: Use a three-surface structure with `backend/` for NestJS,
`mobile/` for Flutter, and `web/` for the responsive landing page plus admin dashboard.
Add `infra/` for Terraform-based deployment assets and `.github/` for GitFlow-supporting
automation. This keeps user-facing channels separate while preserving shared backend
contracts and clear boundaries between marketing, operations, optimization, and core
data workflows.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
