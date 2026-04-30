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
- **Status markers**:
  - `[X]` concluded
  - `[~]` partial
  - `[ ]` not started

## Path Conventions

- **Backend**: `backend/src/`, `backend/test/`, `backend/prisma/`
- **Mobile**: `mobile/lib/`, `mobile/test/`
- **Web**: `web/src/`, `web/test/`
- **Infrastructure**: `infra/terraform/`, `.github/workflows/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Replace the old persistence assumptions and align local tooling with the
replanned backend.

- [X] T001 Update backend dependencies for PostgreSQL, Prisma, auth support, and related scripts in `backend/package.json`
- [X] T002 [P] Add Prisma schema bootstrap and migration configuration in `backend/prisma/schema.prisma` and `backend/package.json`
- [X] T003 [P] Replace MongoDB local-development guidance with PostgreSQL guidance in `backend/.env.example`, `docs/local-development.md`, and `specs/001-grocery-optimizer/quickstart.md`
- [X] T004 [P] Update web and mobile environment examples for shared auth and region endpoints in `web/.env.example`, `mobile/lib/core/networking/`, and `docs/local-development.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that must exist before any story-specific delivery.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T005 Replace Mongo bootstrap with PostgreSQL/Prisma persistence bootstrap in `backend/src/persistence/`, `backend/src/app.module.ts`, and `backend/src/main.ts`
- [X] T006 [P] Implement shared auth module, JWT/session guards, and role enforcement in `backend/src/auth/`, `backend/src/users/`, and `backend/src/common/`
- [X] T007 [P] Introduce shared request logging, correlation IDs, and severity-oriented error mapping in `backend/src/common/logging/`, `backend/src/common/errors/`, and `backend/src/common/validation/`
- [X] T008 [P] Add queue-backed processing job persistence and BullMQ worker wiring in `backend/src/common/queue/`, `backend/src/processing/`, and `backend/src/jobs/`
- [X] T009 Create core relational entities and Prisma mappings for accounts, regions, establishments, products, offers, lists, optimization runs, and jobs in `backend/prisma/schema.prisma`
- [X] T010 [P] Refresh shared backend contracts for auth, regions, offers, lists, and optimization runs in `backend/src/common/contracts/`
- [X] T011 [P] Add backend migration and seed workflow for baseline admin/customer accounts and demo catalog in `backend/prisma/` and `backend/package.json`
- [X] T012 [P] Add foundational backend integration coverage for auth, Prisma persistence, and queued job state transitions in `backend/test/integration/`
- [X] T013 [P] Add frontend shared API client structure for authenticated public/admin requests in `web/src/app/`, `mobile/lib/core/networking/`, and related shared files

**Checkpoint**: Foundation ready; user story implementation can begin.

---

## Phase 3: User Story 1 - Reuse Shopping Lists and Run Optimization from Shared Accounts (Priority: P1) MVP

**Goal**: Shared accounts across mobile and web, reusable shopping lists, and
backend-owned optimization runs.

**Independent Test**: Sign in with the same account on mobile and web, create a list,
run optimization from one channel, and fetch the resulting run from the other.

### Tests for User Story 1

- [X] T014 [P] [US1] Add backend unit tests for auth session handling and list ownership rules in `backend/test/unit/auth/` and `backend/test/unit/lists/`
- [X] T015 [P] [US1] Add backend integration tests for shared auth, list persistence, and optimization run queuing in `backend/test/integration/auth/`, `backend/test/integration/lists/`, and `backend/test/integration/optimization/`
- [X] T016 [P] [US1] Add API contract tests for auth, shopping list, and optimization-run endpoints in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`
- [X] T017 [P] [US1] Add mobile tests for shared account sign-in, saved lists, and latest optimization access in `mobile/test/unit/features/auth/`, `mobile/test/widget/features/shopping_lists/`, and `mobile/test/widget/features/optimization/`
- [X] T018 [P] [US1] Add web tests for sign-in, list routes, and optimization-run retrieval in `web/test/public/`

### Implementation for User Story 1

- [X] T019 [P] [US1] Implement user account persistence and auth services in `backend/src/users/` and `backend/src/auth/`
- [X] T020 [P] [US1] Refactor shopping list persistence to PostgreSQL/Prisma in `backend/src/lists/domain/`, `backend/src/lists/infrastructure/`, and `backend/src/lists/application/`
- [X] T021 [US1] Implement optimization-run aggregate and repository in `backend/src/optimization/domain/`, `backend/src/optimization/infrastructure/`, and `backend/src/processing/`
- [X] T022 [US1] Implement auth, profile, shopping list, and optimization-run API endpoints in `backend/src/auth/api/`, `backend/src/users/api/`, `backend/src/lists/api/`, and `backend/src/optimization/api/`
- [X] T023 [US1] Implement optimization-job enqueueing and result retrieval services in `backend/src/optimization/application/` and `backend/src/jobs/`
- [X] T024 [P] [US1] Implement Flutter shared auth, persisted lists, and optimization-run polling flow in `mobile/lib/features/auth/`, `mobile/lib/features/shopping_lists/`, and `mobile/lib/features/optimization/`
- [X] T025 [P] [US1] Implement web sign-in, sign-up, list editor, and optimization-run polling against real APIs in `web/src/public/`, `web/src/app/`, and `web/src/routes/`
- [X] T026 [US1] Add user-visible processing, retry, and stale-result states on mobile and web in `mobile/lib/features/optimization/`, `web/src/public/`, and related shared UI files
- [X] T027 [US1] Add structured logs and metrics for auth, list mutations, and optimization-run state changes in `backend/src/common/logging/`, `backend/src/auth/`, `backend/src/lists/`, and `backend/src/optimization/`

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

- [X] T028 [P] [US2] Add backend unit tests for region visibility rules and active-establishment counts in `backend/test/unit/regions/`
- [X] T029 [P] [US2] Add backend integration tests for public region, offer, and product-detail reads in `backend/test/integration/regions/`, `backend/test/integration/catalog/`, and `backend/test/integration/pricing/`
- [X] T030 [P] [US2] Add API contract tests for public region and product detail endpoints in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`
- [X] T031 [P] [US2] Add web tests for public region dropdown behavior, zero-store messaging, and product detail modal content in `web/test/public/`
- [X] T032 [P] [US2] Add mobile tests for region selection and public offer browsing in `mobile/test/widget/features/regions/` and `mobile/test/widget/features/offers/`

### Implementation for User Story 2

- [X] T033 [P] [US2] Implement region persistence, activation rules, and query services in `backend/src/regions/`
- [X] T034 [P] [US2] Implement establishment persistence with branch-level identity and active-state handling in `backend/src/establishments/`
- [X] T035 [P] [US2] Implement canonical product and alias persistence in `backend/src/catalog/`
- [X] T036 [P] [US2] Implement current product offer persistence and active-offer queries in `backend/src/pricing/`
- [X] T037 [US2] Implement public region, regional-offer, and product-detail endpoints in `backend/src/regions/api/`, `backend/src/catalog/api/`, and `backend/src/pricing/api/`
- [X] T038 [US2] Implement web public region selector, active-store count handling, offer explorer, and product detail modal against backend data in `web/src/public/`, `web/src/app/`, and `web/src/routes/`
- [X] T039 [US2] Implement mobile region selector and public offer browsing against backend data in `mobile/lib/features/regions/` and `mobile/lib/features/offers/`
- [X] T040 [US2] Add logging and diagnostics for region filtering, zero-store results, and product-offer reads in `backend/src/regions/`, `backend/src/pricing/`, and `backend/src/common/logging/`

**Checkpoint**: Public region and product-offer discovery work independently of admin
flows.

---

## Phase 5: User Story 3 - Admin Manage Regions, Stores, Catalog, Prices, and Metrics (Priority: P1)

**Goal**: Restricted admin dashboard with operational metrics and complete CRUD for the
MVP catalog surface.

**Independent Test**: Sign in as admin on web, load overview metrics, and create or
update regions, establishments, products, and offers from the dashboard.

### Tests for User Story 3

- [X] T041 [P] [US3] Add backend unit tests for role checks, admin metrics aggregation, and activation-state mutations in `backend/test/unit/admin/`, `backend/test/unit/regions/`, and `backend/test/unit/pricing/`
- [X] T042 [P] [US3] Add backend integration tests for admin CRUD and metrics endpoints in `backend/test/integration/admin/`, `backend/test/integration/catalog/`, and `backend/test/integration/establishments/`
- [X] T043 [P] [US3] Add API contract tests for admin metrics and CRUD endpoints in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`
- [X] T044 [P] [US3] Add web tests for protected admin routing, metrics views, and CRUD forms in `web/test/dashboard/`

### Implementation for User Story 3

- [X] T045 [P] [US3] Implement admin metrics aggregation services in `backend/src/admin/application/` and `backend/src/admin/domain/`
- [X] T046 [P] [US3] Implement admin CRUD services for regions, establishments, products, and offers in `backend/src/admin/application/`, `backend/src/regions/`, `backend/src/establishments/`, `backend/src/catalog/`, and `backend/src/pricing/`
- [X] T047 [US3] Implement admin API controllers, DTOs, and role guards in `backend/src/admin/api/`, `backend/src/regions/api/`, `backend/src/establishments/api/`, `backend/src/catalog/api/`, and `backend/src/pricing/api/`
- [X] T048 [US3] Connect the web admin dashboard to live backend metrics and CRUD endpoints in `web/src/dashboard/`, `web/src/app/`, and `web/src/routes/`
- [X] T049 [US3] Add dashboard states for empty metrics, activation toggles, and CRUD validation errors in `web/src/dashboard/` and `web/src/components/`
- [X] T050 [US3] Add observability for admin writes and dashboard metrics generation in `backend/src/admin/`, `backend/src/common/logging/`, and `backend/src/common/errors/`

**Checkpoint**: Admins can manage the MVP dataset and inspect operational state.

---

## Phase 6: User Story 4 - Queue Heavy Processing in the Backend (Priority: P2)

**Goal**: Durable backend processing for optimization jobs and optional receipt-related
workflows.

**Independent Test**: Queue an optimization request, observe job transitions, trigger a
failure, and verify admin diagnostics expose the issue and retry context.

### Tests for User Story 4

- [X] T051 [P] [US4] Add backend unit tests for processing-job state transitions and retry rules in `backend/test/unit/processing/` and `backend/test/unit/jobs/`
- [X] T052 [P] [US4] Add backend integration tests for BullMQ workers and job persistence in `backend/test/integration/jobs/` and `backend/test/integration/processing/`
- [X] T053 [P] [US4] Add API contract tests for processing-job reads in `backend/test/contract/grocery-optimizer-api.contract.spec.ts`

### Implementation for User Story 4

- [X] T054 [P] [US4] Implement durable processing-job persistence and mapping to BullMQ jobs in `backend/src/processing/` and `backend/src/common/queue/`
- [X] T055 [US4] Refactor optimization worker execution to update processing-job and optimization-run records consistently in `backend/src/jobs/` and `backend/src/optimization/application/`
- [X] T056 [US4] Implement optional receipt-record persistence and queued processing hooks in `backend/src/receipts/` and `backend/src/processing/`
- [X] T057 [US4] Expose processing-job diagnostics to admin and public clients where relevant in `backend/src/processing/api/` and `backend/src/admin/api/`
- [X] T058 [US4] Add worker logs, failure reasons, retry context, and queue health summaries in `backend/src/jobs/`, `backend/src/common/logging/`, and `backend/src/admin/application/`

**Checkpoint**: Queue-backed processing is observable, durable, and consistent.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and complete the MVP.

- [X] T059 [P] Add backend regression coverage for migration from Mongo-shaped assumptions to PostgreSQL relations in `backend/test/integration/` and `backend/prisma/`
- [X] T060 [P] Update local seed/demo data and operator docs for regions, establishments, products, and offers in `backend/prisma/seed.*`, `docs/local-development.md`, and `README.md`
- [X] T061 [P] Add web and mobile copy/state review for PT-BR region warnings, product-offer details, and admin validation feedback in `web/src/`, `mobile/lib/`, and related tests
- [X] T062 Run quickstart validation and record any gaps in `specs/001-grocery-optimizer/quickstart.md`

---

## Phase 7: Web + Mobile Stitch Realignment

**Purpose**: Bring web and mobile to the intended Stitch information architecture and
visual system, replacing temporary layouts and mock product presentation.

### Tests for Stitch Realignment

- [X] T063 [P] Add web tests for admin information architecture, city selector counts, and richer list-item rendering in `web/test/dashboard/` and `web/test/public/`
- [X] T064 [P] Add mobile widget tests for city selection, catalog-backed list item search, purchased-state toggles, and richer list cards in `mobile/test/widget/features/regions/`, `mobile/test/widget/features/shopping_lists/`, and `mobile/test/widget/features/offers/`

### Implementation for Stitch Realignment

- [X] T065 [P] Extend the product and offer data model for real images, richer brand/package specificity, and catalog-backed shopper search in `backend/prisma/schema.prisma`, `backend/src/catalog/`, and `backend/src/pricing/`
- [X] T066 [P] Implement backend APIs for product media, catalog-backed list item lookup, city-aware selectors, and shopper purchased-state persistence in `backend/src/catalog/api/`, `backend/src/lists/api/`, `backend/src/regions/api/`, and `backend/src/users/api/`
- [X] T067 [P] Refactor the web public header, city selector, supported cities view, and create-list flow to be city-first, count-aware, and free of mock product images in `web/src/public/`, `web/src/app/`, and `web/src/routes/`
- [X] T068 [P] Rebuild the web shopping-list, optimization, and in-store checklist views with product images, item cards, purchased-state handling, and clearer processing states in `web/src/public/`, `web/src/components/`, and `web/src/routes/`
- [X] T069 [P] Split the admin dashboard into dedicated overview, regions, establishments, products, offers, and list-operations views with richer charts and visual KPIs in `web/src/dashboard/`, `web/src/routes/`, and `web/src/components/`
- [X] T070 [P] Rebuild the mobile home, city selection, product browsing, and list flows to match the Stitch direction with real product imagery and city-first behavior in `mobile/lib/features/home/`, `mobile/lib/features/regions/`, `mobile/lib/features/offers/`, and `mobile/lib/features/shopping_lists/`
- [X] T071 [P] Add mobile and web in-store shopping mode so users can mark items as bought without requiring optimization, with synced persistence through the backend in `backend/src/lists/`, `web/src/public/`, and `mobile/lib/features/shopping_lists/`
- [X] T072 [P] Audit and replace temporary/mock product imagery and placeholder offer art with real catalog assets or neutral non-product fallbacks in `web/src/`, `mobile/lib/`, `backend/prisma/seed.*`, and related asset/config files

---

## Phase 8: Catalog Base Product + Brand Preference Refactor

**Purpose**: Move from direct brand-first product selection to a generic product first
model with optional preferred or exact brand/variant constraints across backend, admin,
web, and mobile.

### Tests for Base Product + Brand Preference

- [X] T073 [P] Add backend unit and integration tests for base-product search, variant filtering, and optimization behavior under `any`, `preferred`, and `exact` brand modes in `backend/test/unit/catalog/`, `backend/test/unit/optimization/`, and `backend/test/integration/catalog/`
- [X] T074 [P] Add web and mobile tests for generic product search, brand-preference modal flows, and checklist behavior in `web/test/public/`, `web/test/dashboard/`, and `mobile/test/widget/features/shopping_lists/`

### Implementation for Base Product + Brand Preference

- [X] T075 [P] Refactor Prisma schema and backend domain models from direct `Product -> ProductOffer` assumptions into `CatalogProduct -> ProductVariant -> ProductOffer` plus shopping-list brand preference fields in `backend/prisma/schema.prisma`, `backend/src/catalog/`, `backend/src/pricing/`, and `backend/src/lists/domain/`
- [X] T076 [P] Implement backend catalog APIs for base-product search, variant listing, and brand-preference aware shopping-list item payloads in `backend/src/catalog/api/`, `backend/src/lists/api/`, and `backend/src/common/contracts/`
- [X] T077 [P] Refactor optimization services to honor `any`, `preferred`, and `exact` brand rules while preserving `local`, `global_unique`, and `global_full` modes in `backend/src/optimization/` and `backend/src/lists/application/`
- [X] T078 [P] Rebuild admin product and offer CRUD to manage base products, variants, images, and offer-to-variant relationships in `web/src/dashboard/`, `backend/src/admin/`, `backend/src/catalog/`, and `backend/src/pricing/`
- [X] T079 [P] Refactor web list creation and editing so users choose a generic product first, optionally open a brand/variant modal, and save list items with brand preference metadata in `web/src/public/`, `web/src/components/`, and `web/src/app/`
- [X] T080 [P] Refactor mobile list creation and editing to the same generic-product-first and optional-brand-preference flow in `mobile/lib/features/shopping_lists/`, `mobile/lib/features/offers/`, and `mobile/lib/features/home/`
- [X] T081 [P] Update public product detail, optimization result rendering, and checklist cards on web and mobile so they show generic product context, chosen variant or brand rule, and real product imagery in `web/src/public/`, `mobile/lib/features/optimization/`, `mobile/lib/features/shopping_lists/`, and related UI files

---

## Phase 9: UX Flow Polish and Stitch Fidelity Hardening

**Purpose**: Eliminate UX friction found in the post-release audit, fix PT-BR copy
quality regressions, and align web/mobile/admin flows more closely with the intended
Stitch direction while preserving the validated backend behavior.

### Tests for UX Flow Polish

- [X] T082 [P] Add regression tests for PT-BR copy, city-count rendering, step-based list creation, and optimization mode cards in `web/test/public/`, `web/test/dashboard/`, and `mobile/test/widget/features/`
- [X] T083 [P] Add mobile/widget tests for consolidated list flow, offer-detail sheet, and visual state rendering in `mobile/test/widget/features/home/`, `mobile/test/widget/features/shopping_lists/`, and `mobile/test/widget/features/optimization/`

### Implementation for UX Flow Polish

- [X] T084 [P] Fix broken PT-BR copy, encoding artifacts, and inconsistent labels across web and mobile surfaces in `web/src/`, `mobile/lib/`, `README.md`, and related tests
- [X] T085 [P] Refactor the web public journey so landing, city selection, list creation, and optimization use clearer staged flows, stronger visual hierarchy, and explicit trade-off communication in `web/src/public/`, `web/src/routes/`, and `web/src/app/`
- [X] T086 [P] Upgrade the web admin overview with richer KPI hierarchy, chart-like summaries, clearer operational grouping, and cleaner region/establishment/catalog management flows in `web/src/dashboard/`, `web/src/routes/`, and `web/src/components/`
- [X] T087 [P] Consolidate the mobile shopping-list flow into a single source of truth, remove dead/duplicated surfaces, and align home/list/result styling with the Stitch direction in `mobile/lib/features/home/`, `mobile/lib/features/shopping_lists/`, and `mobile/lib/features/optimization/`
- [X] T088 [P] Improve mobile and web offer-detail, checklist, and in-store shopping views with stronger product/store context, purchased-state clarity, and better fallback handling for images and empty states in `web/src/public/`, `mobile/lib/features/home/`, `mobile/lib/features/optimization/`, and `mobile/lib/features/shopping_lists/`
- [X] T089 [P] Add final smoke and release-readiness validation for the polished UX flows in `web/test/`, `mobile/test/`, `backend/test/`, `docs/local-development.md`, and `specs/001-grocery-optimizer/quickstart.md`

---

## Phase 10: Preferred City Persistence and Cross-Surface QoL

**Purpose**: Persist the shopper's chosen city on the shared account, force city
selection after login, improve list-creation clarity, and harden admin catalog UX
for media, activation state, and theme visibility.

### Tests for Preferred City and QoL

- [X] T090 [P] Add backend unit, integration, and contract tests for persisted user city preference, city-update APIs, and product media upload in `backend/test/unit/users/`, `backend/test/integration/auth/`, `backend/test/integration/catalog/`, and `backend/test/contract/`
- [X] T091 [P] Add web tests for post-login city-selection modal, landing copy changes, richer `/listas` account cards, save-vs-optimize actions, and live product-row filtering in `web/src/public/` and `web/src/dashboard/`
- [X] T092 [P] Add mobile tests for required city onboarding after login, persisted city changes, and richer list-creation product picking in `mobile/test/widget/features/auth/`, `mobile/test/widget/features/regions/`, and `mobile/test/widget/features/shopping_lists/`

### Implementation for Preferred City and QoL

- [X] T093 [P] Persist preferred city on the shared user account, expose read/update APIs, and synchronize auth/profile contracts in `backend/prisma/schema.prisma`, `backend/src/users/`, `backend/src/auth/`, `backend/src/common/contracts/`, and related DTOs/controllers
- [X] T094 [P] Implement backend product media upload/storage and admin-friendly activation metadata for products and variants in `backend/src/catalog/`, `backend/src/admin/`, `backend/src/common/`, and local media storage wiring
- [X] T095 [P] Refactor the web public journey so authenticated users must choose a city when none is stored, landing copy highlights concrete value, `/listas` exposes account stats in cards, list creation uses richer card/table rows with live filtering, and users can choose between save-only or save-and-optimize in `web/src/public/`, `web/src/app/`, and `web/src/routes/`
- [X] T096 [P] Refactor the web admin dashboard to use PT-BR labels for technical fields, add upload-driven product imagery, move variant activation into a dedicated visible active column, and add dark/light mode switching with stronger field contrast in `web/src/dashboard/`, `web/src/components/`, `web/src/app/`, and `web/src/index.css`
- [X] T097 [P] Refactor the mobile auth/home/list flows so a logged-in user without a saved city lands on a dedicated city-selection screen, city changes persist to the backend, and list creation follows the richer comparable-product picker in `mobile/lib/features/auth/`, `mobile/lib/features/home/`, `mobile/lib/features/regions/`, and `mobile/lib/features/shopping_lists/`
- [X] T098 [P] Run final cross-surface validation for preferred-city persistence, product media upload, web/mobile list creation, dashboard theme switching, and Docker-backed boot flows in `backend/test/`, `web/src/`, `mobile/test/`, `docs/local-development.md`, and smoke scripts

---

## Phase 11: Dashboard, Savings, and City-First List QoL

**Purpose**: Tighten admin clarity, remove brand-preference ambiguity from list creation,
surface user and platform savings more effectively, and improve city/list/dashboard polish
across backend, web, and mobile.

### Tests for Dashboard, Savings, and List QoL

- [X] T099 [P] Add backend unit, integration, and contract tests for automatic active-establishment counting, list-history auditing payloads, queue diagnostics, savings aggregation, and variant-only item selection in `backend/test/unit/admin/`, `backend/test/unit/regions/`, `backend/test/integration/admin/`, `backend/test/integration/lists/`, and `backend/test/contract/`
- [X] T100 [P] Add web tests for admin region/product/offer/list surfaces, city-first headers, aggregate-savings copy, variant selection tables, and save-vs-optimize actions in `web/src/dashboard/`, `web/src/public/`, and `web/src/routes/`
- [X] T101 [P] Add mobile tests for city-first list creation, variant-only item selection, non-checklist new-list flow, and authenticated savings copy in `mobile/test/widget/features/home/`, `mobile/test/widget/features/shopping_lists/`, and `mobile/test/unit/features/optimization/`

### Implementation for Dashboard, Savings, and List QoL

- [X] T102 [P] Implement backend support for computed active-establishment counts, per-list optimization savings, user-level cumulative savings, global cumulative savings for landing, auditable list-processing history, and richer queue diagnostics in `backend/src/admin/`, `backend/src/lists/`, `backend/src/optimization/`, `backend/src/pricing/`, `backend/src/regions/`, and `backend/src/common/contracts/`
- [X] T103 [P] Refactor web public header, landing hero, `/listas`, and list-creation flows to improve alignment, remove generic savings from pre-login surfaces, show authenticated savings copy correctly, use comparable-product rows with exact variant selection, and keep checklist only on checklist surfaces in `web/src/public/`, `web/src/app/`, `web/src/components/`, and `web/src/routes/`
- [X] T104 [P] Refactor web admin regions, products, offers, list-operations, and queue-health views with PT-BR helper copy, stronger cards, icon-only theme toggle, upload affordances, variant activation columns, collapsible variant groups, city cards, list audit views, and expanded queue details in `web/src/dashboard/`, `web/src/components/`, and `web/src/app/`
- [X] T105 [P] Refactor mobile list creation and authenticated account surfaces to remove preferred-brand free text, require exact variant selection or any-brand choice, keep checklist outside the new-list flow, and mirror the updated savings/account messaging in `mobile/lib/features/home/`, `mobile/lib/features/shopping_lists/`, and `mobile/lib/features/optimization/`
- [X] T106 [P] Use Stitch-aligned component structure and visual hierarchy refinements for header, list cards, and admin cards without rebuilding entire screens in `docs/product/`, `web/src/public/`, `web/src/dashboard/`, and `mobile/lib/features/`
- [X] T107 [P] Run final cross-surface validation for computed counts, savings aggregation, list auditing, queue-health diagnostics, and city-first list creation in `backend/test/`, `web/src/`, `mobile/test/`, `docs/local-development.md`, and Docker-backed smoke scripts

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
