# Implementation Plan: Grocery Shopping Optimizer

**Branch**: `001-grocery-optimizer` | **Date**: 2026-04-25 | **Spec**: [spec.md](D:/Pricely/specs/001-grocery-optimizer/spec.md)
**Input**: Replanned feature specification from `/specs/001-grocery-optimizer/spec.md`

## Summary

Rebuild the backend architecture around PostgreSQL, Redis, and BullMQ so the product
can support one shared account model across mobile and web, role-gated admin
dashboards on web, explicit region activation, establishment-level pricing, a canonical
product catalog, reusable shopping lists, and queue-backed optimization runs executed
on the server. The current implementation phase also needs a full UX realignment for
web and mobile so both surfaces match the Stitch direction: city-first selection,
branded product visuals, richer admin information architecture, more visual metrics,
real product imagery, and list experiences that work both as optimization inputs and
as live in-store shopping checklists. The catalog and optimization model also needs to
shift from direct brand-first selection toward `generic product first -> optional brand
preference -> concrete variant offers`, so list creation stays fast while optimization
still respects exact brand constraints when requested.

## Technical Context

**Language/Version**: TypeScript on current NestJS LTS runtime; TypeScript on current
Vite/React runtime; Dart 3 with current Flutter stable  
**Primary Dependencies**: NestJS core modules, NestJS Pino, BullMQ, Redis, PostgreSQL,
Prisma ORM with migration support, Flutter Stacked, Vite, React, shadcn/ui, OpenAPI
for API contract documentation  
**Storage**: PostgreSQL for application data; Redis for queues and transient job state;
local device cache for mobile drafts and recent results; browser-local UI state where
useful  
**Testing**: Backend unit, integration, and contract tests; web route and component
tests; mobile unit and widget tests; migration and queue regression coverage for risky
backend changes  
**Target Platform**: Android and iOS mobile clients, responsive public web experience,
responsive admin dashboard on web, and a NestJS API plus worker runtime  
**Project Type**: Mobile app plus backend service plus responsive web applications  
**Performance Goals**: Standard list optimization requests should move into queued
processing quickly enough to preserve interactive UX; API reads for region, product, and
dashboard views should feel immediate under normal local/developer loads; admin queries
must remain legible and traceable on responsive layouts  
**Constraints**: Keep the MVP bounded to shared accounts, regions, establishments,
products, offers, lists, optimization runs, and admin CRUD; do not depend on QR-code
online receipt resolution; preserve explicit error handling and structured logging;
avoid duplicating optimization logic on mobile clients; keep shopper-facing region
selection city-based rather than neighborhood-based; stop relying on mock product
images in the final UI  
**Scale/Scope**: Initial release supports customer shopping flows, public regional offer
discovery, backend-owned optimization, admin dashboards, catalog CRUD, region/store
activation, and queue observability

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code quality: The replan replaces under-modeled MongoDB persistence with explicit
  relational structures for regions, establishments, products, offers, lists, users,
  and optimization runs. Clear module boundaries remain required.
- Architecture: Backend responsibility is now explicit across auth, catalog, regions,
  establishments, pricing, lists, optimization, admin reporting, and jobs. Client apps
  remain thin at the decision layer.
- Testing: Plan requires coverage for database relations, authorization, queued job
  behavior, optimization decisions, admin contracts, and region-selection edge cases.
- Reliability: Optimization and heavy processing stay on the backend, preserving
  consistent logic, retry control, and audited job state. Historical runs and inactive
  region/store behavior are explicit model concerns.
- Performance: PostgreSQL is chosen to support strong relations and admin querying.
  Redis/BullMQ absorb heavy processing. Read-heavy public endpoints remain cacheable at
  the application level later without changing domain boundaries.
- Observability: Structured logs, processing job states, queue diagnostics, and admin
  metrics are first-class requirements rather than optional follow-ups.
- Simplicity and reuse: The MVP deliberately avoids a separate chain table and avoids
  client-side optimization engines. Shared backend contracts remain the default.
- UX consistency: Shared account semantics, region visibility rules, and consistent
  optimization outputs apply across mobile and web.

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
|-- checklists/
|   `-- backend-domain.md
`-- tasks.md
```

### Source Code (repository root)

```text
backend/
|-- prisma/
|   `-- schema.prisma
|-- src/
|   |-- app.module.ts
|   |-- auth/
|   |-- admin/
|   |-- catalog/
|   |-- establishments/
|   |-- optimization/
|   |-- lists/
|   |-- jobs/
|   |-- pricing/
|   |-- processing/
|   |-- regions/
|   |-- receipts/
|   |-- users/
|   |-- common/
|   `-- persistence/
`-- test/
    |-- contract/
    |-- integration/
    `-- unit/

mobile/
|-- lib/
|   |-- app/
|   |-- core/
|   |-- features/
|   |   |-- auth/
|   |   |-- offers/
|   |   |-- optimization/
|   |   |-- profile/
|   |   |-- regions/
|   |   `-- shopping_lists/
|   `-- shared/
`-- test/

web/
|-- src/
|   |-- app/
|   |-- public/
|   |-- dashboard/
|   |-- components/
|   |-- hooks/
|   `-- routes/
`-- test/
```

**Structure Decision**: Keep the monorepo surface split by backend, mobile, and web,
but refactor backend internals around explicit relational modules and Prisma-backed
PostgreSQL persistence. Separate public region/offer reads from admin CRUD and metrics
while sharing auth and domain contracts.

## Phase 0: Research Focus

1. Validate PostgreSQL + Prisma as the relational persistence layer for accounts,
   regions, establishments, products, offers, shopping lists, and optimization runs.
2. Define the backend-owned optimization execution model and job status tracking
   contract.
3. Confirm role-based access design for shared customer/admin accounts.
4. Bound receipt persistence as optional MVP support without making QR-based online
   invoice lookup a dependency.

## Phase 1: Design Artifacts

- `data-model.md`: relational entities, validation rules, and lifecycle states
- `contracts/grocery-optimizer-api.yaml`: public and admin APIs for auth, region
  selection, offers, lists, optimization, metrics, and CRUD
- `contracts/admin-dashboard-flows.md`: dashboard use cases and UX rules
- `quickstart.md`: local developer validation for PostgreSQL, Redis, queue workers, web,
  and mobile
- agent context update to reflect PostgreSQL/Prisma instead of MongoDB

## UX Realignment Focus

1. Split admin IA into dedicated screens:
   - overview
   - regions
   - establishments
   - products
   - offers
   - list operations
2. Make the overview more visual with charts, stronger color, and high-signal KPI
   grouping.
3. Upgrade the product model and UI from generic grocery entities toward specific
   branded products with images, aliases, package context, and explicit base-product
   versus variant relationships.
4. Remove mock product imagery from web and mobile and source visuals from real catalog
   media records.
5. Redesign shopping lists so they support:
   - save without optimization
   - generic product selection first
   - optional preferred/exact brand constraints
   - catalog-backed product search
   - purchased-state tracking during a supermarket trip
   - richer row cards with images and stronger separation
6. Align create-list and city-selection flows with the city-first Stitch direction:
   preselect current city when available, allow manual override, and remove default
   optimization-mode choice from list creation.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Prisma ORM | Explicit relational schema, migrations, and query clarity are needed for admin CRUD and product/store relations | Raw SQL or MongoDB would either slow delivery or keep the domain under-modeled |
| Queue-backed optimization | Needed for responsiveness, retry handling, and operational diagnostics | Client-side or synchronous optimization would duplicate logic and reduce control |
