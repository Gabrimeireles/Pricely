---

description: "Task list for Grocery Shopping Optimizer feature implementation"
---

# Tasks: Grocery Shopping Optimizer

**Input**: Design documents from `/specs/001-grocery-optimizer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include backend, web, and mobile tests for all behavior changes. Migration,
authorization, queue, and optimization logic changes require automated coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency on unfinished tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Each task includes an exact file path

## Path Conventions

- **Backend**: `backend/src/`, `backend/test/`, `backend/prisma/`
- **Mobile**: `mobile/lib/`, `mobile/test/`
- **Web**: `web/src/`, `web/test/`
- **Infrastructure**: `infra/terraform/`, `.github/workflows/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Replace the old persistence assumptions and align local tooling with the
replanned backend.

- [ ] T001 Update backend dependencies for PostgreSQL, Prisma, auth support, and related scripts in `backend/package.json`
- [ ] T002 [P] Add Prisma schema bootstrap and migration configuration in `backend/prisma/schema.prisma` and `backend/package.json`
- [ ] T003 [P] Replace MongoDB local-development guidance with PostgreSQL guidance in `backend/.env.example`, `docs/local-development.md`, and `specs/001-grocery-optimizer/quickstart.md`
- [ ] T004 [P] Update web and mobile environment examples for shared auth and region endpoints in `web/.env.example`, `mobile/lib/core/networking/`, and `docs/local-development.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that must exist before any story-specific delivery.

**CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T005 Replace Mongo bootstrap with PostgreSQL/Prisma persistence bootstrap in `backend/src/persistence/`, `backend/src/app.module.ts`, and `backend/src/main.ts`
- [X] T006 [P] Implement shared auth module, JWT/session guards, and role enforcement in `backend/src/auth/`, `backend/src/users/`, and `backend/src/common/`
- [ ] T007 [P] Introduce shared request logging, correlation IDs, and severity-oriented error mapping in `backend/src/common/logging/`, `backend/src/common/errors/`, and `backend/src/common/validation/`
- [ ] T008 [P] Add queue-backed processing job persistence and BullMQ worker wiring in `backend/src/common/queue/`, `backend/src/processing/`, and `backend/src/jobs/`
- [ ] T009 Create core relational entities and Prisma mappings for accounts, regions, establishments, products, offers, lists, optimization runs, and jobs in `backend/prisma/schema.prisma`
- [ ] T010 [P] Refresh shared backend contracts for auth, regions, offers, lists, and optimization runs in `backend/src/common/contracts/`
- [ ] T011 [P] Add backend migration and seed workflow for baseline admin/customer accounts and demo catalog in `backend/prisma/` and `backend/package.json`
- [ ] T012 [P] Add foundational backend integration coverage for auth, Prisma persistence, and queued job state transitions in `backend/test/integration/`
- [ ] T013 [P] Add frontend shared API client structure for authenticated public/admin requests in `web/src/app/`, `mobile/lib/core/networking/`, and related shared files

**Checkpoint**: Foundation ready; user story implementation can begin.

---

## Phase 3: User Story 1 - Reuse Shopping Lists and Run Optimization from Shared Accounts (Priority: P1) MVP

**Goal**: Shared accounts across mobile and web, reusable shopping lists, and
backend-owned optimization runs.

**Independent Test**: Sign in with the same account on mobile and web, create a list,
run optimization from one channel, and fetch the resulting run from the other.

### Tests for User Story 1

- [ ] T014 [P] [US1] Add backend unit tests for auth session handling and list ownership rules in `backend/test/unit/auth/` and `backend/test/unit/lists/`
- [ ] T015 [P] [US1] Add backend integration tests for shared auth, list persistence, and optimization run queuing in `backend/test/integration/auth/`, `backend/test/integration/lists/`, and `backend/test/integration/optimization/`
- [ ] T016 [P] [US1] Add API contract tests for auth, shopping list, and optimization-run endpoints in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`
- [ ] T017 [P] [US1] Add mobile tests for shared account sign-in, saved lists, and latest optimization access in `mobile/test/unit/features/auth/`, `mobile/test/widget/features/shopping_lists/`, and `mobile/test/widget/features/optimization/`
- [ ] T018 [P] [US1] Add web tests for sign-in, list routes, and optimization-run retrieval in `web/test/public/`

### Implementation for User Story 1

- [ ] T019 [P] [US1] Implement user account persistence and auth services in `backend/src/users/` and `backend/src/auth/`
- [ ] T020 [P] [US1] Refactor shopping list persistence to PostgreSQL/Prisma in `backend/src/lists/domain/`, `backend/src/lists/infrastructure/`, and `backend/src/lists/application/`
- [ ] T021 [US1] Implement optimization-run aggregate and repository in `backend/src/optimization/domain/`, `backend/src/optimization/infrastructure/`, and `backend/src/processing/`
- [ ] T022 [US1] Implement auth, profile, shopping list, and optimization-run API endpoints in `backend/src/auth/api/`, `backend/src/users/api/`, `backend/src/lists/api/`, and `backend/src/optimization/api/`
- [ ] T023 [US1] Implement optimization-job enqueueing and result retrieval services in `backend/src/optimization/application/` and `backend/src/jobs/`
- [ ] T024 [P] [US1] Implement Flutter shared auth, persisted lists, and optimization-run polling flow in `mobile/lib/features/auth/`, `mobile/lib/features/shopping_lists/`, and `mobile/lib/features/optimization/`
- [ ] T025 [P] [US1] Implement web sign-in, sign-up, list editor, and optimization-run polling against real APIs in `web/src/public/`, `web/src/app/`, and `web/src/routes/`
- [ ] T026 [US1] Add user-visible processing, retry, and stale-result states on mobile and web in `mobile/lib/features/optimization/`, `web/src/public/`, and related shared UI files
- [ ] T027 [US1] Add structured logs and metrics for auth, list mutations, and optimization-run state changes in `backend/src/common/logging/`, `backend/src/auth/`, `backend/src/lists/`, and `backend/src/optimization/`

**Checkpoint**: Shared accounts, reusable lists, and backend-owned optimization runs
work independently.

---

## Phase 4: User Story 2 - Browse Regional Offers and Product Store Prices (Priority: P1)

**Goal**: Public region selection, active-establishment counts, regional offers, and
product detail price breakdowns.

**Independent Test**: Load public regions, verify inactive ones are hidden, select a
visible zero-store region and get warning-ready data, and open product details showing
multiple establishment prices.

### Tests for User Story 2

- [ ] T028 [P] [US2] Add backend unit tests for region visibility rules and active-establishment counts in `backend/test/unit/regions/`
- [ ] T029 [P] [US2] Add backend integration tests for public region, offer, and product-detail reads in `backend/test/integration/regions/`, `backend/test/integration/catalog/`, and `backend/test/integration/pricing/`
- [ ] T030 [P] [US2] Add API contract tests for public region and product detail endpoints in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`
- [ ] T031 [P] [US2] Add web tests for public region dropdown behavior, zero-store messaging, and product detail modal content in `web/test/public/`
- [ ] T032 [P] [US2] Add mobile tests for region selection and public offer browsing in `mobile/test/widget/features/regions/` and `mobile/test/widget/features/offers/`

### Implementation for User Story 2

- [ ] T033 [P] [US2] Implement region persistence, activation rules, and query services in `backend/src/regions/`
- [ ] T034 [P] [US2] Implement establishment persistence with branch-level identity and active-state handling in `backend/src/establishments/`
- [ ] T035 [P] [US2] Implement canonical product and alias persistence in `backend/src/catalog/`
- [ ] T036 [P] [US2] Implement current product offer persistence and active-offer queries in `backend/src/pricing/`
- [ ] T037 [US2] Implement public region, regional-offer, and product-detail endpoints in `backend/src/regions/api/`, `backend/src/catalog/api/`, and `backend/src/pricing/api/`
- [ ] T038 [US2] Implement web public region selector, active-store count handling, offer explorer, and product detail modal against backend data in `web/src/public/`, `web/src/app/`, and `web/src/routes/`
- [ ] T039 [US2] Implement mobile region selector and public offer browsing against backend data in `mobile/lib/features/regions/` and `mobile/lib/features/offers/`
- [ ] T040 [US2] Add logging and diagnostics for region filtering, zero-store results, and product-offer reads in `backend/src/regions/`, `backend/src/pricing/`, and `backend/src/common/logging/`

**Checkpoint**: Public region and product-offer discovery work independently of admin
flows.

---

## Phase 5: User Story 3 - Admin Manage Regions, Stores, Catalog, Prices, and Metrics (Priority: P1)

**Goal**: Restricted admin dashboard with operational metrics and complete CRUD for the
MVP catalog surface.

**Independent Test**: Sign in as admin on web, load overview metrics, and create or
update regions, establishments, products, and offers from the dashboard.

### Tests for User Story 3

- [ ] T041 [P] [US3] Add backend unit tests for role checks, admin metrics aggregation, and activation-state mutations in `backend/test/unit/admin/`, `backend/test/unit/regions/`, and `backend/test/unit/pricing/`
- [ ] T042 [P] [US3] Add backend integration tests for admin CRUD and metrics endpoints in `backend/test/integration/admin/`, `backend/test/integration/catalog/`, and `backend/test/integration/establishments/`
- [ ] T043 [P] [US3] Add API contract tests for admin metrics and CRUD endpoints in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`
- [ ] T044 [P] [US3] Add web tests for protected admin routing, metrics views, and CRUD forms in `web/test/dashboard/`

### Implementation for User Story 3

- [ ] T045 [P] [US3] Implement admin metrics aggregation services in `backend/src/admin/application/` and `backend/src/admin/domain/`
- [ ] T046 [P] [US3] Implement admin CRUD services for regions, establishments, products, and offers in `backend/src/admin/application/`, `backend/src/regions/`, `backend/src/establishments/`, `backend/src/catalog/`, and `backend/src/pricing/`
- [ ] T047 [US3] Implement admin API controllers, DTOs, and role guards in `backend/src/admin/api/`, `backend/src/regions/api/`, `backend/src/establishments/api/`, `backend/src/catalog/api/`, and `backend/src/pricing/api/`
- [ ] T048 [US3] Connect the web admin dashboard to live backend metrics and CRUD endpoints in `web/src/dashboard/`, `web/src/app/`, and `web/src/routes/`
- [ ] T049 [US3] Add dashboard states for empty metrics, activation toggles, and CRUD validation errors in `web/src/dashboard/` and `web/src/components/`
- [ ] T050 [US3] Add observability for admin writes and dashboard metrics generation in `backend/src/admin/`, `backend/src/common/logging/`, and `backend/src/common/errors/`

**Checkpoint**: Admins can manage the MVP dataset and inspect operational state.

---

## Phase 6: User Story 4 - Queue Heavy Processing in the Backend (Priority: P2)

**Goal**: Durable backend processing for optimization jobs and optional receipt-related
workflows.

**Independent Test**: Queue an optimization request, observe job transitions, trigger a
failure, and verify admin diagnostics expose the issue and retry context.

### Tests for User Story 4

- [ ] T051 [P] [US4] Add backend unit tests for processing-job state transitions and retry rules in `backend/test/unit/processing/` and `backend/test/unit/jobs/`
- [ ] T052 [P] [US4] Add backend integration tests for BullMQ workers and job persistence in `backend/test/integration/jobs/` and `backend/test/integration/processing/`
- [ ] T053 [P] [US4] Add API contract tests for processing-job reads in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`

### Implementation for User Story 4

- [ ] T054 [P] [US4] Implement durable processing-job persistence and mapping to BullMQ jobs in `backend/src/processing/` and `backend/src/common/queue/`
- [ ] T055 [US4] Refactor optimization worker execution to update processing-job and optimization-run records consistently in `backend/src/jobs/` and `backend/src/optimization/application/`
- [ ] T056 [US4] Implement optional receipt-record persistence and queued processing hooks in `backend/src/receipts/` and `backend/src/processing/`
- [ ] T057 [US4] Expose processing-job diagnostics to admin and public clients where relevant in `backend/src/processing/api/` and `backend/src/admin/api/`
- [ ] T058 [US4] Add worker logs, failure reasons, retry context, and queue health summaries in `backend/src/jobs/`, `backend/src/common/logging/`, and `backend/src/admin/application/`

**Checkpoint**: Queue-backed processing is observable, durable, and consistent.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and complete the MVP.

- [ ] T059 [P] Add backend regression coverage for migration from Mongo-shaped assumptions to PostgreSQL relations in `backend/test/integration/` and `backend/prisma/`
- [ ] T060 [P] Update local seed/demo data and operator docs for regions, establishments, products, and offers in `backend/prisma/seed.*`, `docs/local-development.md`, and `README.md`
- [ ] T061 [P] Add web and mobile copy/state review for PT-BR region warnings, product-offer details, and admin validation feedback in `web/src/`, `mobile/lib/`, and related tests
- [ ] T062 Run quickstart validation and record any gaps in `specs/001-grocery-optimizer/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and benefits from core region/catalog entities
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from region, establishment, product, and offer persistence
- **User Story 4 (Phase 6)**: Depends on Foundational completion and integrates with optimization/domain persistence
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1**: MVP baseline for shared accounts, reusable lists, and optimization runs
- **US2**: Requires region, establishment, product, and offer foundations but remains independently testable
- **US3**: Depends on domain entities from US2 for CRUD value, but remains independently testable once those entities exist
- **US4**: Depends on queue foundations and optimization persistence, but remains independently testable

### Within Each User Story

- Tests before implementation
- Persistence and entities before services
- Services before API/UI integration
- Validation, reliability, and observability before story sign-off

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel
- Foundational tasks marked `[P]` can run in parallel once dependency ordering is respected
- Backend, web, and mobile tests inside each story can run in parallel
- US1 client work can proceed in parallel once auth/list contracts stabilize
- US2 public web/mobile work can proceed in parallel once region/offer contracts stabilize

---

## Implementation Strategy

### MVP First

1. Complete Setup
2. Complete Foundational infrastructure
3. Deliver US1 for shared accounts, saved lists, and backend-owned optimization runs
4. Deliver US2 for public regions and product-offer visibility
5. Deliver US3 for admin dataset control
6. Add US4 queue durability and receipt-ready hooks if still within MVP capacity

### Incremental Delivery

1. Ship shared accounts and reusable-list optimization first
2. Add public regional browsing and product-level price detail
3. Add admin dashboards and CRUD
4. Harden queued processing and deferred receipt support

### Parallel Team Strategy

With multiple contributors:

1. One contributor focuses on backend auth, persistence, and optimization flows
2. One contributor focuses on backend catalog/region/admin modules
3. One contributor focuses on web/mobile integration against stabilized contracts

---

## Notes

- Total tasks are ordered for execution, not just grouped by subsystem
- Every user story remains independently testable
- File paths are intentionally explicit so the task list is immediately executable
- Suggested MVP scope: Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5
