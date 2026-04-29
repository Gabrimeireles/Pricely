# Feature Specification: Grocery Shopping Optimizer

**Feature Branch**: `001-grocery-optimizer`  
**Created**: 2026-04-03  
**Updated**: 2026-04-25  
**Status**: Draft  
**Input**: Replanned backend and product scope for a grocery optimization platform with
shared customer/admin accounts, regional catalog activation, store-level pricing,
admin CRUD, and queue-backed optimization processing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reuse Shopping Lists and Run Optimization from Shared Accounts (Priority: P1)

As a shopper, I want to keep reusable grocery lists in one account shared by mobile
and web, then trigger optimization runs whenever I need them, so I can reuse the same
monthly or weekly list and re-calculate it against the latest available prices.

**Why this priority**: The core product value depends on list persistence, shared
identity across channels, and repeatable optimization runs against current data.

**Independent Test**: Create one account, sign in on mobile and web, save a shopping
list without optimizing it, trigger a new optimization run later, and verify the
latest result reflects current store offers without requiring the list to be recreated.

**Acceptance Scenarios**:

1. **Given** a user signs in with the same account on mobile and web, **When** the
   user views their lists, **Then** both channels show the same saved lists, profile
   data, and latest optimization history.
2. **Given** a user has a saved shopping list, **When** the user requests a new
   optimization run, **Then** the backend queues the calculation, returns a trackable
   processing state, and later exposes the completed result.
3. **Given** a shopping list has already been optimized before, **When** the user runs
   optimization again later, **Then** the list remains the same object and a new
   optimization result is produced without overwriting historical runs silently.
4. **Given** a result includes incomplete or low-confidence data, **When** the result
   is shown, **Then** the system highlights the limitation explicitly and does not
   fabricate missing prices or availability.

---

### User Story 2 - Browse Regional Offers and Product Store Prices (Priority: P1)

As a shopper, I want to choose a supported region, browse its active offers, and open
product details that show all known store prices, so I can understand where each item
is cheaper before or outside a full-list optimization flow.

**Why this priority**: The offer discovery and product-detail experience is part of the
public-facing product and supports user trust before full optimization.

**Independent Test**: Query supported regions, select one with active stores, browse
regional offers, open a product detail view, and verify the product lists multiple
store-specific prices and store identities when available.

**Acceptance Scenarios**:

1. **Given** supported regions exist, **When** the frontend loads region options,
   **Then** only regions with `implantationStatus` other than `inactive` appear in the
   public selector and each option includes the count of active stores.
2. **Given** a selected region has zero active stores, **When** offers are requested,
   **Then** the API returns the region with an active store count of `0` and the client
   can present a warning to switch regions.
3. **Given** a product has prices in multiple establishments, **When** the user opens
   product details, **Then** the response includes each active establishment, current
   price, freshness, confidence, and store identity needed for the UI modal.
4. **Given** a region is marked `inactive`, **When** public region options are
   requested, **Then** that region is excluded from the public dropdown while remaining
   visible to admins.

---

### User Story 3 - Admin Manage Regions, Stores, Catalog, Prices, and Metrics (Priority: P1)

As an admin, I want to sign in with the same account used in the consumer app and
access restricted web dashboards for operational metrics and catalog management, so I
can control regions, establishments, products, offers, and system health from one
place.

**Why this priority**: The catalog and price dataset will not remain trustworthy
without an administrative surface to manage it and observe system behavior.

**Independent Test**: Sign in as an admin on web, access restricted dashboard routes,
create or edit regions, stores, products, and offers, and verify overview metrics and
queue health endpoints return the expected operational data.

**Acceptance Scenarios**:

1. **Given** an account has the `admin` role, **When** it signs in on web, **Then** it
   can access restricted dashboard endpoints and views unavailable to customer-only
   accounts.
2. **Given** an admin updates a region, establishment, product, or product offer,
   **When** the change is saved, **Then** subsequent public and optimization queries
   reflect the updated active state and price relationships.
3. **Given** the dashboard requests operational metrics, **When** the backend responds,
   **Then** the response includes user activity, optimization throughput, queue health,
   processing outcomes, and catalog coverage indicators.
4. **Given** an admin account signs in on mobile, **When** it uses the mobile app,
   **Then** it behaves like a normal customer account and does not expose web-only
   dashboard privileges there.

---

### User Story 4 - Queue Heavy Processing in the Backend (Priority: P2)

As the system, I want optimization and receipt-related processing to run as backend
jobs with durable state, so the product can scale safely, preserve shared business
logic, and expose operational diagnostics to admins.

**Why this priority**: Queue-backed processing keeps mobile and web responsive while
making optimization, ingestion, and retry behavior observable and consistent.

**Independent Test**: Trigger an optimization request, verify a BullMQ job is created,
observe job status transitions, and confirm the completed result can be retrieved by
job-aware APIs without client-side optimization logic.

**Acceptance Scenarios**:

1. **Given** a user requests optimization, **When** the backend accepts the request,
   **Then** it creates a queued processing record and returns a response that can be
   polled for status.
2. **Given** an optimization or receipt-processing job fails, **When** the failure is
   recorded, **Then** the system logs the reason clearly, preserves a retryable state,
   and exposes the failure in admin diagnostics.
3. **Given** optimization logic changes over time, **When** clients request new runs,
   **Then** the backend remains the single source of optimization behavior rather than
   duplicating critical decision logic inside mobile devices.

### Edge Cases

- What happens when a region is publicly selectable but currently has zero active
  establishments?
- How does the system behave when a product exists in the catalog but has no active
  current offers in the selected region?
- What happens when the same supermarket brand has multiple units in different
  neighborhoods and only one unit is active?
- How does the system respond when an admin deactivates a store or region that is
  referenced by historical shopping lists or optimization results?
- What happens when a queued optimization job is retried and a newer run already
  exists for the same shopping list?
- How does the system behave when a shopper account becomes admin-capable on web but
  should still see only consumer flows on mobile?
- What happens when no region is publicly available because all regions are
  `inactive`?
- How does the system handle optional receipt ingestion when QR-code-based online
  receipt resolution is not part of the MVP?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support a single account model shared by mobile and web.
- **FR-002**: The system MUST distinguish authorization by role so that `admin`
  accounts can access restricted web dashboard capabilities while behaving like normal
  consumer accounts on mobile.
- **FR-003**: The system MUST allow users to create, edit, save, and reuse shopping
  lists without forcing optimization at creation time.
- **FR-004**: The system MUST support repeated optimization runs against the same
  shopping list and preserve historical optimization results as separate records.
- **FR-005**: The system MUST execute optimization requests in the backend rather than
  relying on client-side optimization logic as the source of truth.
- **FR-006**: The system MUST queue heavy optimization and receipt-related processing
  with Redis and BullMQ-compatible backend job orchestration.
- **FR-007**: The system MUST expose processing state for queued jobs so clients and
  dashboards can track pending, running, failed, and completed work.
- **FR-008**: The system MUST support three optimization modes aligned with the product
  language: `local`, `global_unique`, and `global_full`.
- **FR-009**: The system MUST maintain a canonical product catalog representing common
  grocery products independently of any one establishment.
- **FR-010**: The catalog MUST distinguish between a generic comparable product and one
  or more concrete branded or packaging-level variants that can actually be offered by
  establishments.
- **FR-010a**: The system MUST associate each concrete product variant with zero or more
  establishment-specific current offers, each containing price and store identity.
- **FR-011**: The system MUST maintain establishments as store-level units with enough
  identity to distinguish branches of the same supermarket brand, including at minimum
  brand name, unit name or neighborhood context, city or region, and CNPJ.
- **FR-012**: The system MUST maintain explicit region records for public selection and
  admin management.
- **FR-013**: Each region MUST include an `implantationStatus` with at least `active`,
  `activating`, and `inactive`.
- **FR-014**: Public region selection endpoints MUST exclude regions whose
  `implantationStatus` is `inactive`.
- **FR-015**: Public region selection endpoints MUST return the number of active
  establishments in each visible region.
- **FR-016**: The system MUST allow a visible region to have zero active
  establishments and MUST expose that count explicitly so the client can instruct the
  user to change regions.
- **FR-017**: Establishments MUST include `isActive` state so inactive units are not
  treated as valid current shopping options.
- **FR-018**: The system MUST expose public regional offers filtered to active
  establishments in the selected region.
- **FR-019**: The system MUST expose product detail data that lists all active known
  establishment prices for that product, including store identity, freshness, and
  confidence.
- **FR-020**: The system MUST not fabricate unknown prices, unknown availability, or
  unverified store-product relationships.
- **FR-021**: The system MUST surface data freshness and confidence on offers and
  optimization selections.
- **FR-022**: The system MUST allow admins to create, update, activate, deactivate, and
  inspect regions, establishments, products, and current product offers.
- **FR-023**: The admin dashboard backend MUST return operational metrics including at
  least active-user indicators, optimization volume, queue or processing health, and
  catalog or offer coverage.
- **FR-024**: The admin dashboard backend MUST return data needed for dense views of
  regions, establishments, products, offers, shopping lists, optimization runs, and
  processing jobs.
- **FR-025**: The system MUST provide clear structured logging and explicit error
  classification for informational, warning, and error conditions across API requests,
  background jobs, and data processing paths.
- **FR-026**: The system MUST persist translated or parsed receipt data when receipt
  ingestion is used, but QR-code-based online receipt lookup is OUT OF SCOPE for the
  MVP.
- **FR-027**: The optimization result MUST include the chosen mode, total estimated
  cost, savings or trade-off information where available, item-level selections, and
  clear incomplete-data notices.
- **FR-028**: The frontend contract for region selection MUST support showing labels
  such as `São Paulo - 20` and warning states such as `Nenhum estabelecimento ativo`
  when the selected visible region has zero active stores.

- **FR-029**: Shopper-facing region selection MUST be city-based rather than
  neighborhood-based, and only city-level regions with public status other than
  `inactive` MUST appear in selectors.
- **FR-030**: City selectors on web and mobile MUST display the count of active
  establishments for each visible city, including `0` when the city is visible but
  still collecting supply coverage.
- **FR-031**: The product catalog MUST support specific branded grocery products, such
  as brand, line, type, package size, and product image, instead of relying only on
  generic commodity labels.
- **FR-031a**: Shopper list entry MUST allow choosing a generic comparable product
  first, then optionally constraining the item by preferred or exact brand/variant.
- **FR-031b**: When no brand is constrained, optimization MUST be free to choose the
  cheapest valid offer according to the selected optimization mode.
- **FR-031c**: When preferred brands are configured, optimization SHOULD prioritize
  those brands first and may fall back to other valid variants only when the rule set
  allows it.
- **FR-031d**: When an exact brand or variant is configured, optimization MUST only
  consider matching variants for that shopping-list item.
- **FR-032**: Admin product creation and editing MUST support slug, display name,
  category, default unit, aliases, brand specificity, and product image assignment.
- **FR-033**: Offer records MAY keep `displayName` and `packageLabel`, and admin/public
  views MUST surface them as the store-facing merchandising text and packaging context
  used to distinguish multiple offers for the same product.
- **FR-034**: Shopping-list item entry on web and mobile MUST support searching and
  selecting real catalog products while still allowing users to save a list without
  running optimization.
- **FR-034a**: Shopping-list item entry on web and mobile MUST expose brand preference
  choices as `any`, `preferred`, or `exact` instead of forcing brand selection at the
  start of item creation.
- **FR-035**: Shopping lists on web and mobile MUST support an in-store shopping mode
  where users can mark items as purchased and follow the list dynamically during a
  supermarket trip.
- **FR-036**: The list experience on web and mobile MUST present richer item rows with
  images, stronger separation between items, and clearer purchased/unpurchased states.
- **FR-037**: The app MAY request location permission to preselect the shopper city,
  but the chosen city MUST remain explicit and editable.
- **FR-038**: The create-list flow MUST default to the user-selected city and MUST NOT
  require choosing an optimization mode during initial list creation.
- **FR-039**: Admin list operations MUST include queue state, list ownership, and
  detail inspection for troubleshooting inconsistencies from a dedicated operational
  view.

### Non-Functional Requirements

- **NFR-001**: The product MUST preserve a single authoritative optimization behavior
  in the backend so mobile and web return consistent outcomes.
- **NFR-002**: The system MUST use PostgreSQL as the primary relational data store for
  account, region, establishment, catalog, offer, list, and optimization data.
- **NFR-003**: The system MUST use Redis-backed queues for asynchronous work that would
  otherwise block user interactions noticeably.
- **NFR-004**: The backend MUST expose structured logs and actionable diagnostics for
  normal operations, degraded states, and failures.
- **NFR-005**: Public and admin queries MUST remain understandable and traceable even
  when data is partial or stale.
- **NFR-006**: The design MUST keep the MVP bounded: QR-code-based online receipt
  resolution and non-MVP LLM enrichment remain future extensions, not baseline
  dependencies.
- **NFR-007**: The system MUST support future catalog growth, more regions, more store
  units, and more optimization runs without redefining the core data relationships.

### Key Entities *(include if feature involves data)*

- **User Account**: Shared identity used by customers and admins across mobile and web,
  with role-based access control.
- **Region**: Publicly selectable geographic area with implantation status and active
  establishment count.
- **Establishment**: Specific supermarket unit or branch with brand identity, unit
  identity, CNPJ, region, and active state.
- **Catalog Product**: Generic comparable grocery item chosen first by shoppers and
  used as the optimization comparison anchor.
- **Product Variant**: Specific branded or packaging-level product variant that can be
  offered by establishments and optionally locked or preferred by shoppers.
- **Product Offer**: Current establishment-specific price record for one product
  variant, including freshness and confidence.
- **Shopping List**: User-owned reusable list of grocery needs, independent of any one
  optimization run.
- **Optimization Run**: One backend-generated execution of a selected optimization mode
  for a shopping list.
- **Processing Job**: Trackable background work item for optimization or other queued
  processing.
- **Receipt Record**: Optional persisted translated receipt data for ingestion-based
  pricing workflows, excluding QR-code online lookup in the MVP.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can sign in with one account on mobile and web and access the same
  shopping lists and latest optimization history in under 2 minutes.
- **SC-002**: 100% of prices shown in product details and optimization results are tied
  to active establishment offers stored by the backend rather than fabricated client
  assumptions.
- **SC-003**: Admins can create or update a region, establishment, product, or offer
  and see the change reflected in subsequent API reads without manual data repair.
- **SC-004**: At least 90% of optimization requests for standard grocery lists expose a
  visible processing state and complete without blocking the requesting client.
- **SC-005**: Public region selection always returns counts of active establishments for
  each visible region and clearly distinguishes zero-store regions from hidden inactive
  regions.
- **SC-006**: Dashboard metrics provide enough operational visibility for admins to
  identify queue failures, stale catalog coverage, and basic user activity without
  inspecting raw database records directly.

## Assumptions

- The MVP uses the backend as the only authoritative optimization engine.
- Regions presented to shoppers should be treated as city-level operating areas rather
  than neighborhood-level delivery zones.
- Customer and admin identities share the same account table, with role-based
  differences enforced server-side.
- Admin-only dashboards remain a web capability; mobile intentionally stays focused on
  customer behavior even for admin accounts.
- A single establishment row will store both brand identity and unit-level identity for
  the MVP rather than introducing a separate supermarket-chain table immediately.
- Public region selection is driven by `Region` records and not inferred dynamically
  from arbitrary establishment rows alone.
- The catalog should prefer specific branded products where data supports them while
  keeping alias-based sanitization for generic user input and receipt parsing.
- Shopping-list creation should optimize for speed by letting shoppers choose a generic
  product first and only constrain brand when they care to do so.
- QR-code-based online invoice lookup and more advanced LLM-assisted enrichment are
  deferred beyond the MVP.
- Manual admin CRUD for catalog, stores, and current offers is sufficient to support an
  MVP dataset even before automated receipt ingestion becomes central.

## Implementation Constraints *(mandatory)*

- PostgreSQL, Redis, and BullMQ-compatible queueing are mandatory infrastructure for
  the replanned backend.
- Frontend and backend technologies remain otherwise unchanged from the agreed stack:
  NestJS for backend, Vite/React for web, and Flutter Stacked for mobile.
- The backend must expose explicit admin APIs for full management of regions,
  establishments, products, and offers.
- Public frontend region selectors must not include regions with
  `implantationStatus = inactive`.
- The system must preserve safe error handling, structured logs, and severity-oriented
  diagnostics (`info`, `warn`, `error`) across API and background processing paths.
