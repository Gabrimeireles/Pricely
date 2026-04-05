---

description: "Task list for Grocery Shopping Optimizer feature implementation"
---

# Tasks: Grocery Shopping Optimizer

**Input**: Design documents from `/specs/001-grocery-optimizer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include tests for backend modules, API contracts, Flutter flows, and React
surfaces because the constitution and plan require automated verification for behavior
changes.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency on unfinished tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Each task includes an exact file path

## Path Conventions

- **Backend**: `backend/src/`, `backend/test/`
- **Mobile**: `mobile/lib/`, `mobile/test/`
- **Web**: `web/src/`, `web/test/`
- **Infrastructure**: `infra/terraform/`, `.github/workflows/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the multi-surface project structure and shared tooling

- [x] T001 Create the top-level application structure in `backend/`, `mobile/`, `web/`, `infra/terraform/`, and `.github/workflows/` | Issue: [#1](https://github.com/Gabrimeireles/Pricely/issues/1)
- [x] T002 Initialize the NestJS backend workspace in `backend/package.json`, `backend/src/app.module.ts`, and `backend/tsconfig.json` | Issue: [#2](https://github.com/Gabrimeireles/Pricely/issues/2)
- [x] T003 [P] Initialize the Flutter mobile app workspace in `mobile/pubspec.yaml` and `mobile/lib/main.dart` | Issue: [#3](https://github.com/Gabrimeireles/Pricely/issues/3)
- [x] T004 [P] Initialize the Vite/React web workspace in `web/package.json`, `web/vite.config.ts`, and `web/src/main.tsx` | Issue: [#4](https://github.com/Gabrimeireles/Pricely/issues/4)
- [x] T005 [P] Configure repository-level ignore and editor settings in `.gitignore`, `.editorconfig`, and `.gitattributes` | Issue: [#5](https://github.com/Gabrimeireles/Pricely/issues/5)
- [x] T006 [P] Configure backend linting and formatting in `backend/eslint.config.js`, `backend/prettier.config.js`, and `backend/package.json` | Issue: [#6](https://github.com/Gabrimeireles/Pricely/issues/6)
- [x] T007 [P] Configure web linting and formatting in `web/eslint.config.js`, `web/prettier.config.js`, and `web/package.json` | Issue: [#7](https://github.com/Gabrimeireles/Pricely/issues/7)
- [x] T008 [P] Configure Flutter analysis and formatting defaults in `mobile/analysis_options.yaml` and `mobile/pubspec.yaml` | Issue: [#8](https://github.com/Gabrimeireles/Pricely/issues/8)
- [x] T009 [P] Add local developer environment examples in `backend/.env.example`, `web/.env.example`, and `docs/local-development.md` | Issue: [#9](https://github.com/Gabrimeireles/Pricely/issues/9)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the common infrastructure that blocks all user stories

**CRITICAL**: No user story work should begin until this phase is complete

- [x] T010 Create MongoDB connection and persistence bootstrap in `backend/src/persistence/mongo.module.ts` and `backend/src/persistence/mongo.config.ts` | Issue: [#10](https://github.com/Gabrimeireles/Pricely/issues/10)
- [x] T011 [P] Create Redis and BullMQ bootstrap in `backend/src/common/queue/queue.module.ts` and `backend/src/common/queue/queue.config.ts` | Issue: [#11](https://github.com/Gabrimeireles/Pricely/issues/11)
- [x] T012 [P] Configure NestJS Pino logging in `backend/src/common/logging/logging.module.ts` and `backend/src/main.ts` | Issue: [#12](https://github.com/Gabrimeireles/Pricely/issues/12)
- [x] T013 [P] Add shared backend validation and error filters in `backend/src/common/validation/validation.pipe.ts`, `backend/src/common/errors/http-exception.filter.ts`, and `backend/src/common/errors/domain-error.ts` | Issue: [#13](https://github.com/Gabrimeireles/Pricely/issues/13)
- [x] T014 Create backend feature module skeletons in `backend/src/receipts/`, `backend/src/catalog/`, `backend/src/lists/`, `backend/src/stores/`, `backend/src/optimization/`, `backend/src/admin/`, and `backend/src/jobs/` | Issue: [#14](https://github.com/Gabrimeireles/Pricely/issues/14)
- [x] T015 [P] Create shared backend DTO and contract models from the API spec in `backend/src/common/contracts/` | Issue: [#15](https://github.com/Gabrimeireles/Pricely/issues/15)
- [x] T016 [P] Create Flutter app shell, navigation scaffold, and shared theme in `mobile/lib/app/app.dart`, `mobile/lib/app/router.dart`, and `mobile/lib/core/widgets/` | Issue: [#16](https://github.com/Gabrimeireles/Pricely/issues/16)
- [x] T017 [P] Create Flutter core API, storage, and error abstractions in `mobile/lib/core/networking/`, `mobile/lib/core/storage/`, and `mobile/lib/core/errors/` | Issue: [#17](https://github.com/Gabrimeireles/Pricely/issues/17)
- [x] T018 [P] Configure shadcn/ui base, global styles, and responsive layout primitives in `web/src/components/ui/`, `web/src/index.css`, and `web/src/lib/utils.ts` | Issue: [#18](https://github.com/Gabrimeireles/Pricely/issues/18)
- [x] T019 [P] Create web routing shell for marketing and dashboard areas in `web/src/routes/`, `web/src/marketing/`, and `web/src/dashboard/` | Issue: [#19](https://github.com/Gabrimeireles/Pricely/issues/19)
- [x] T020 Configure test runners and scripts in `backend/package.json`, `web/package.json`, and `mobile/pubspec.yaml` | Issue: [#20](https://github.com/Gabrimeireles/Pricely/issues/20)
- [x] T021 [P] Add Terraform environment/module skeletons in `infra/terraform/environments/`, `infra/terraform/modules/`, and `infra/terraform/variables/` | Issue: [#21](https://github.com/Gabrimeireles/Pricely/issues/21)
- [x] T022 [P] Add GitFlow-supporting GitHub workflow placeholders in `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, and `.github/PULL_REQUEST_TEMPLATE.md` | Issue: [#22](https://github.com/Gabrimeireles/Pricely/issues/22)

**Checkpoint**: Foundation ready; user story implementation can begin

---

## Phase 3: User Story 1 - Build Cheapest List Across Stores (Priority: P1) MVP

**Goal**: Let users submit grocery lists, ingest receipt data, and receive the lowest-total-cost
multi-market shopping plan with traceable pricing and store breakdown.

**Independent Test**: Submit a shopping list and receipt-derived data from multiple
stores, run Multi-Market Optimization, and verify the output chooses the cheapest valid
offer per item with total cost and savings breakdown.

### Tests for User Story 1

- [x] T023 [P] [US1] Add backend unit tests for receipt parsing and normalization rules in `backend/test/unit/receipts/receipt-parser.service.spec.ts` and `backend/test/unit/catalog/product-normalizer.service.spec.ts` | Issue: [#23](https://github.com/Gabrimeireles/Pricely/issues/23)
- [x] T024 [P] [US1] Add backend unit tests for multi-market optimization logic in `backend/test/unit/optimization/multi-market-optimizer.service.spec.ts` | Issue: [#24](https://github.com/Gabrimeireles/Pricely/issues/24)
- [x] T025 [P] [US1] Add backend integration tests for receipt ingestion and optimization flows in `backend/test/integration/receipts/receipt-ingestion.integration.spec.ts` and `backend/test/integration/optimization/multi-market-optimization.integration.spec.ts` | Issue: [#25](https://github.com/Gabrimeireles/Pricely/issues/25)
- [x] T026 [P] [US1] Add API contract tests for shopping list, receipt, and optimization endpoints in `backend/test/contract/grocery-optimizer-api.contract.spec.ts` | Issue: [#26](https://github.com/Gabrimeireles/Pricely/issues/26)
- [ ] T027 [P] [US1] Add Flutter unit and widget tests for shopping list and multi-market result flows in `mobile/test/unit/features/shopping_lists/` and `mobile/test/widget/features/optimization/multi_market_result_screen_test.dart` | Issue: [#27](https://github.com/Gabrimeireles/Pricely/issues/27)

### Implementation for User Story 1

- [x] T028 [P] [US1] Implement shopping list persistence model and repository in `backend/src/lists/domain/shopping-list.entity.ts`, `backend/src/lists/infrastructure/shopping-list.schema.ts`, and `backend/src/lists/infrastructure/shopping-list.repository.ts` | Issue: [#28](https://github.com/Gabrimeireles/Pricely/issues/28)
- [x] T029 [P] [US1] Implement receipt and receipt line persistence models in `backend/src/receipts/domain/receipt-record.entity.ts`, `backend/src/receipts/domain/receipt-line-item.entity.ts`, and `backend/src/receipts/infrastructure/` | Issue: [#29](https://github.com/Gabrimeireles/Pricely/issues/29)
- [x] T030 [P] [US1] Implement product match and store offer persistence models in `backend/src/catalog/domain/product-match.entity.ts`, `backend/src/stores/domain/store-offer.entity.ts`, and matching infrastructure files | Issue: [#30](https://github.com/Gabrimeireles/Pricely/issues/30)
- [x] T031 [US1] Implement receipt parsing and normalization services in `backend/src/receipts/application/receipt-parser.service.ts`, `backend/src/catalog/application/product-normalizer.service.ts`, and `backend/src/catalog/application/product-match.service.ts` | Issue: [#31](https://github.com/Gabrimeireles/Pricely/issues/31)
- [x] T032 [US1] Implement receipt ingestion queue producer and worker in `backend/src/receipts/application/receipt-ingestion.service.ts`, `backend/src/jobs/receipt-ingestion.processor.ts`, and `backend/src/common/queue/queue.tokens.ts` | Issue: [#32](https://github.com/Gabrimeireles/Pricely/issues/32)
- [x] T033 [US1] Implement multi-market optimizer and result assembly in `backend/src/optimization/domain/multi-market-optimizer.service.ts`, `backend/src/optimization/domain/optimization-selection.entity.ts`, and `backend/src/optimization/application/optimization-result.service.ts` | Issue: [#33](https://github.com/Gabrimeireles/Pricely/issues/33)
- [x] T034 [US1] Implement shopping list, receipt, and optimization API endpoints in `backend/src/lists/api/`, `backend/src/receipts/api/`, and `backend/src/optimization/api/` | Issue: [#34](https://github.com/Gabrimeireles/Pricely/issues/34)
- [x] T035 [US1] Add backend logging, diagnostics, and confidence handling for parsing and optimization in `backend/src/common/logging/`, `backend/src/receipts/application/`, and `backend/src/optimization/application/` | Issue: [#35](https://github.com/Gabrimeireles/Pricely/issues/35)
- [ ] T036 [P] [US1] Implement Flutter shopping list creation and editing flow in `mobile/lib/features/shopping_lists/` | Issue: [#36](https://github.com/Gabrimeireles/Pricely/issues/36)
- [ ] T037 [P] [US1] Implement Flutter receipt submission and ingestion status flow in `mobile/lib/features/receipts/` | Issue: [#37](https://github.com/Gabrimeireles/Pricely/issues/37)
- [ ] T038 [US1] Implement Flutter multi-market optimization result flow in `mobile/lib/features/optimization/` | Issue: [#38](https://github.com/Gabrimeireles/Pricely/issues/38)
- [ ] T039 [US1] Add Flutter offline draft and cached-result storage for core P1 flows in `mobile/lib/core/storage/local_cache_service.dart` and related feature state files | Issue: [#39](https://github.com/Gabrimeireles/Pricely/issues/39)
- [ ] T040 [P] [US1] Implement responsive landing page that introduces the app and its value proposition in `web/src/marketing/pages/home-page.tsx`, `web/src/marketing/components/`, and `web/src/routes/marketing.tsx` | Issue: [#40](https://github.com/Gabrimeireles/Pricely/issues/40)

**Checkpoint**: User Story 1 is independently functional as the MVP

---

## Phase 4: User Story 2 - Optimize Within One Nearby Store (Priority: P2)

**Goal**: Let users choose a nearest or selected store and optimize their full list
within that single location while surfacing missing or unsupported items clearly.

**Independent Test**: Select one store, run Local Optimization, and verify all results
stay constrained to that store, with missing items and total cost clearly shown.

### Tests for User Story 2

- [ ] T041 [P] [US2] Add backend unit tests for local optimization and store filtering in `backend/test/unit/optimization/local-market-optimizer.service.spec.ts` | Issue: [#41](https://github.com/Gabrimeireles/Pricely/issues/41)
- [ ] T042 [P] [US2] Add backend integration tests for local optimization constraints in `backend/test/integration/optimization/local-market-optimization.integration.spec.ts` | Issue: [#42](https://github.com/Gabrimeireles/Pricely/issues/42)
- [ ] T043 [P] [US2] Add Flutter tests for store selection and local optimization views in `mobile/test/widget/features/stores/store_selector_test.dart` and `mobile/test/widget/features/optimization/local_market_result_screen_test.dart` | Issue: [#43](https://github.com/Gabrimeireles/Pricely/issues/43)

### Implementation for User Story 2

- [ ] T044 [P] [US2] Implement store repository and freshness support in `backend/src/stores/domain/store.entity.ts`, `backend/src/stores/infrastructure/store.schema.ts`, and `backend/src/stores/infrastructure/store.repository.ts` | Issue: [#44](https://github.com/Gabrimeireles/Pricely/issues/44)
- [ ] T045 [US2] Implement local-market optimizer and store-constrained selection rules in `backend/src/optimization/domain/local-market-optimizer.service.ts` | Issue: [#45](https://github.com/Gabrimeireles/Pricely/issues/45)
- [ ] T046 [US2] Extend optimization API to accept location and preferred store context in `backend/src/optimization/api/optimize-shopping-list.dto.ts` and `backend/src/optimization/api/optimization.controller.ts` | Issue: [#46](https://github.com/Gabrimeireles/Pricely/issues/46)
- [ ] T047 [US2] Implement Flutter store discovery/selection and local optimization flow in `mobile/lib/features/stores/` and `mobile/lib/features/optimization/` | Issue: [#47](https://github.com/Gabrimeireles/Pricely/issues/47)
- [ ] T048 [US2] Add user-visible missing-item and low-confidence feedback states for local optimization in `mobile/lib/features/optimization/widgets/` and `mobile/lib/features/stores/widgets/` | Issue: [#48](https://github.com/Gabrimeireles/Pricely/issues/48)

**Checkpoint**: User Story 2 works independently on top of the foundation and P1 data model

---

## Phase 5: User Story 3 - Choose the Best Single Store (Priority: P3)

**Goal**: Compare eligible supermarkets as whole-list candidates and recommend the best
single store while explaining the trade-off versus the global minimum multi-store plan.

**Independent Test**: Run Global Store Optimization for a list with multiple store
options and verify that one best store is highlighted with total cost, coverage, and
savings trade-off against multi-market optimization.

### Tests for User Story 3

- [ ] T049 [P] [US3] Add backend unit tests for global-store optimization logic in `backend/test/unit/optimization/global-store-optimizer.service.spec.ts` | Issue: [#49](https://github.com/Gabrimeireles/Pricely/issues/49)
- [ ] T050 [P] [US3] Add backend integration tests for best single-store recommendation in `backend/test/integration/optimization/global-store-optimization.integration.spec.ts` | Issue: [#50](https://github.com/Gabrimeireles/Pricely/issues/50)
- [ ] T051 [P] [US3] Add Flutter tests for global-store result presentation in `mobile/test/widget/features/optimization/global_store_result_screen_test.dart` | Issue: [#51](https://github.com/Gabrimeireles/Pricely/issues/51)

### Implementation for User Story 3

- [ ] T052 [US3] Implement global-store optimizer and full-list coverage evaluation in `backend/src/optimization/domain/global-store-optimizer.service.ts` | Issue: [#52](https://github.com/Gabrimeireles/Pricely/issues/52)
- [ ] T053 [US3] Extend optimization result assembly with alternative-comparison summaries in `backend/src/optimization/application/optimization-result.service.ts` | Issue: [#53](https://github.com/Gabrimeireles/Pricely/issues/53)
- [ ] T054 [US3] Implement Flutter global-store optimization flow and trade-off explanation UI in `mobile/lib/features/optimization/` | Issue: [#54](https://github.com/Gabrimeireles/Pricely/issues/54)
- [ ] T055 [P] [US3] Implement responsive admin dashboard views for item prices, shopping lists, and optimization visibility in `web/src/dashboard/pages/`, `web/src/dashboard/components/`, and `web/src/routes/dashboard.tsx` | Issue: [#55](https://github.com/Gabrimeireles/Pricely/issues/55)
- [ ] T056 [US3] Implement backend admin reporting endpoints for prices, items, and list summaries in `backend/src/admin/api/`, `backend/src/admin/application/`, and `backend/src/admin/domain/` | Issue: [#56](https://github.com/Gabrimeireles/Pricely/issues/56)
- [ ] T057 [US3] Connect admin dashboard data fetching and mobile-ready responsive tables/cards in `web/src/dashboard/hooks/` and `web/src/components/` | Issue: [#57](https://github.com/Gabrimeireles/Pricely/issues/57)

**Checkpoint**: All three optimization modes and admin visibility are independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple stories and complete delivery readiness

- [ ] T058 [P] Add backend queue retry, dead-letter, and health diagnostics in `backend/src/jobs/`, `backend/src/common/queue/`, and `backend/src/admin/api/queue-health.controller.ts` | Issue: [#58](https://github.com/Gabrimeireles/Pricely/issues/58)
- [ ] T059 [P] Add web tests for landing page responsiveness and dashboard core flows in `web/test/marketing/` and `web/test/dashboard/` | Issue: [#59](https://github.com/Gabrimeireles/Pricely/issues/59)
- [ ] T060 [P] Add Terraform modules and environment composition for app deployment in `infra/terraform/modules/` and `infra/terraform/environments/` | Issue: [#60](https://github.com/Gabrimeireles/Pricely/issues/60)
- [ ] T061 [P] Add GitHub CI/CD workflows for lint, test, build, and deploy in `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` | Issue: [#61](https://github.com/Gabrimeireles/Pricely/issues/61)
- [ ] T062 Update developer and operator documentation in `README.md`, `docs/local-development.md`, and `docs/api/` | Issue: [#62](https://github.com/Gabrimeireles/Pricely/issues/62)
- [ ] T063 Run quickstart validation and record any gaps in `specs/001-grocery-optimizer/quickstart.md` | Issue: [#63](https://github.com/Gabrimeireles/Pricely/issues/63)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and reuses P1 data structures
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from P1/P2 optimization foundations
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1**: MVP and base platform capability
- **US2**: Uses shared list, store, and optimization foundations but remains independently testable
- **US3**: Uses shared optimization and admin reporting foundations but remains independently testable

### Within Each User Story

- Tests before implementation
- Domain models and persistence before services
- Services before API/UI integration
- User-visible feedback and observability before story sign-off

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel across backend, mobile, web, and infra
- Foundational tasks marked `[P]` can run in parallel once project scaffolds exist
- Backend tests, mobile tests, and web tests inside each story can run in parallel
- Landing page work in US1 and admin dashboard work in US3 can proceed in parallel with backend tasks that expose the needed contracts

---

## Parallel Example: User Story 1

```bash
# Backend test work in parallel
Task: "Add backend unit tests for receipt parsing and normalization rules in backend/test/unit/receipts/receipt-parser.service.spec.ts and backend/test/unit/catalog/product-normalizer.service.spec.ts"
Task: "Add backend unit tests for multi-market optimization logic in backend/test/unit/optimization/multi-market-optimizer.service.spec.ts"
Task: "Add API contract tests for shopping list, receipt, and optimization endpoints in backend/test/contract/grocery-optimizer-api.contract.spec.ts"

# Frontend surface work in parallel
Task: "Implement Flutter shopping list creation and editing flow in mobile/lib/features/shopping_lists/"
Task: "Implement responsive landing page that introduces the app and its value proposition in web/src/marketing/pages/home-page.tsx, web/src/marketing/components/, and web/src/routes/marketing.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup
2. Complete Foundational infrastructure
3. Deliver User Story 1 with receipt ingestion, normalization, multi-market optimization, Flutter core flows, and landing page
4. Validate with quickstart scenarios before moving on

### Incremental Delivery

1. Ship P1 as the savings-focused MVP
2. Add P2 for single-store convenience optimization
3. Add P3 for best-store recommendation and admin dashboard visibility
4. Finish with deployment automation, queue diagnostics, and documentation polish

### Parallel Team Strategy

With multiple contributors:

1. One contributor focuses on backend foundations and optimization engine
2. One contributor focuses on Flutter mobile flows
3. One contributor focuses on web landing/dashboard surfaces and Terraform/GitHub delivery
4. Integrate through the documented API contracts and contract tests

---

## Notes

- Total tasks are ordered for execution, not just grouped by subsystem
- Every user story remains independently testable
- File paths are intentionally explicit so the task list is immediately executable
- Suggested MVP scope: Phase 1 + Phase 2 + Phase 3 only
