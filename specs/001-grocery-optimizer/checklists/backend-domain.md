# Backend Domain Checklist: Grocery Shopping Optimizer

**Purpose**: Validate backend/domain requirement quality before refactoring the service
to PostgreSQL and admin-aware flows  
**Created**: 2026-04-25  
**Feature**: [spec.md](D:/Pricely/specs/001-grocery-optimizer/spec.md)

## Requirement Completeness

- [ ] CHK001 Are shared-account requirements defined for both customer and admin roles, including cross-surface behavior? [Completeness, Spec §FR-001, Spec §FR-002]
- [ ] CHK002 Are region visibility requirements complete for `active`, `activating`, and `inactive` states? [Completeness, Spec §FR-012, Spec §FR-013, Spec §FR-014]
- [ ] CHK003 Are establishment identity requirements sufficient to distinguish multiple branches of the same supermarket brand? [Completeness, Spec §FR-011]
- [ ] CHK004 Are canonical product and establishment-specific offer requirements both defined, rather than relying on one implicit catalog model? [Completeness, Spec §FR-009, Spec §FR-010]
- [ ] CHK005 Are admin CRUD requirements defined for every MVP-managed dataset: regions, establishments, products, and offers? [Completeness, Spec §FR-022]

## Requirement Clarity

- [ ] CHK006 Is the difference between `global_unique` and `global_full` clear enough to map to distinct backend rules? [Clarity, Spec §FR-008]
- [ ] CHK007 Is the rule for visible zero-store regions explicit enough for frontend and backend teams to implement consistently? [Clarity, Spec §FR-015, Spec §FR-016, Spec §FR-028]
- [ ] CHK008 Is “same account on mobile and web” specific about shared ownership, not just shared credentials? [Clarity, Spec §FR-001, Spec §SC-001]
- [ ] CHK009 Is “behaves like a normal customer on mobile” precise enough to prevent accidental admin-surface leakage into the mobile app? [Clarity, Spec §FR-002, Spec §US3]

## Requirement Consistency

- [ ] CHK010 Do public region-selection rules align between functional requirements, user stories, and success criteria? [Consistency, Spec §US2, Spec §FR-014, Spec §SC-005]
- [ ] CHK011 Do optimization-run persistence requirements align with the statement that lists can be saved without optimization? [Consistency, Spec §US1, Spec §FR-003, Spec §FR-004]
- [ ] CHK012 Do admin-dashboard metric requirements align with the dashboard-flow contract and not leave “metrics” underspecified? [Consistency, Spec §FR-023, Contracts §admin-dashboard-flows.md]

## Acceptance Criteria Quality

- [ ] CHK013 Can backend-owned optimization behavior be objectively verified from the written requirements without inferring undocumented client logic? [Measurability, Spec §FR-005, Spec §NFR-001]
- [ ] CHK014 Are success criteria for shared-account synchronization and active-region counts objectively measurable? [Acceptance Criteria, Spec §SC-001, Spec §SC-005]
- [ ] CHK015 Are admin CRUD expectations measurable enough to validate without relying on manual interpretation? [Acceptance Criteria, Spec §SC-003]

## Scenario Coverage

- [ ] CHK016 Are shopper flows covered for sign-up/sign-in, list save, optimization request, and optimization re-run? [Coverage, Spec §US1]
- [ ] CHK017 Are public browsing flows covered for region selection, no-store warning states, and product-detail price breakdowns? [Coverage, Spec §US2]
- [ ] CHK018 Are admin flows covered for both management actions and operational monitoring? [Coverage, Spec §US3, Spec §FR-023, Spec §FR-024]
- [ ] CHK019 Are queued-processing flows covered for success, failure, and retry visibility? [Coverage, Spec §US4, Spec §FR-006, Spec §FR-007]

## Edge Case Coverage

- [ ] CHK020 Are requirements explicit about how inactive regions differ from visible zero-store regions? [Edge Case, Spec §Edge Cases, Spec §FR-014, Spec §FR-016]
- [ ] CHK021 Are historical optimization-run expectations clear when newer runs supersede older ones? [Edge Case, Spec §US1, Spec §Edge Cases]
- [ ] CHK022 Are deactivation effects defined for stores or regions already referenced by historical lists and runs? [Edge Case, Spec §Edge Cases]
- [ ] CHK023 Is receipt persistence scope clearly bounded so QR-code online lookup remains excluded from MVP work? [Scope, Spec §FR-026, Spec §NFR-006]

## Non-Functional Requirements

- [ ] CHK024 Are PostgreSQL, Redis, and queueing constraints framed as system requirements rather than hidden implementation assumptions? [Non-Functional, Spec §NFR-002, Spec §NFR-003]
- [ ] CHK025 Are logging and diagnostics requirements specific enough to drive backend observability tasks? [Non-Functional, Spec §FR-025, Spec §NFR-004]
- [ ] CHK026 Are scalability expectations stated clearly enough to justify the relational replan and queue-backed architecture? [Non-Functional, Spec §NFR-007]

## Dependencies & Assumptions

- [ ] CHK027 Is the assumption to keep establishment identity in one MVP table documented clearly enough to avoid accidental over-modeling? [Assumption, Spec §Assumptions]
- [ ] CHK028 Are dependencies between public queries, admin CRUD, and optimization data freshness made explicit? [Dependency, Spec §FR-018, Spec §FR-019, Spec §FR-022]
- [ ] CHK029 Is the decision to keep optimization server-side documented strongly enough to prevent later client-side drift? [Assumption, Spec §FR-005, Spec §NFR-001]
