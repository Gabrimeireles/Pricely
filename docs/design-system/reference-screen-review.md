# Reference Screen Review

Status: implementation review for issue #327.

## Source Images

Reference images are stored under `docs/design-system/reference-screens/`.

Web public:

- `web-public/generic-app.png`
- `web-public/public_web_home.png`
- `web-public/public_web_in-store_checklist.png`
- `web-public/public_web_list_editor.png`
- `web-public/public_web_optimization_result.png`

Mobile:

- `mobile/mobile_app_home.png`
- `mobile/mobile_list-checklist_screen.png`
- `mobile/mobile_optimization_result.png`
- `mobile/mobile_receipt_submission.png`

Admin dashboard:

- `admin-dashboard/admin_catalog_and_offers_management.png`
- `admin-dashboard/admin_dashboard_overview.png`
- `admin-dashboard/admin_queue_job_detail.png`
- `admin-dashboard/admin_receipt_processing_queue.png`

## Executive Read

The references are aligned enough to become implementation inputs. They follow the
new design-system direction: compact operational layouts, teal primary action, clear
status chips, receipt/trust evidence, and separate treatments for shopper, mobile,
and admin surfaces.

Do not implement the images pixel-for-pixel. Treat them as target composition and
component direction, then adapt to the existing React/shadcn and Flutter structures.

## Cross-Surface Strengths

- Stronger workflow hierarchy than the current app: city/location, next action,
  shopping list, optimization, checklist, receipt.
- Good use of trust and receipt evidence as first-class UI rather than hidden text.
- Better separation between shopper cards and admin operational tables.
- Mobile references have thumb-zone CTAs and bottom navigation.
- Admin references correctly make action queues and status summaries more important
  than passive metrics.
- Colors mostly match the design-system semantic roles.

## Cross-Surface Risks

- Some screens use high visual density; implementation must preserve readable spacing
  at smaller breakpoints.
- The generated UI assumes some components that do not exist yet as shared building
  blocks: evidence modules, status chips, price rows, action queue rows, sticky action
  bars.
- Mobile references include richer product imagery than the app can always guarantee;
  neutral fallbacks must remain first-class.
- Some generated labels may need normalization to current backend contract names and
  PT-BR copy conventions.
- The `generic-app.png` reference appears useful as a mobile composition idea, but it
  should not be treated as a separate web-public implementation target.

## Web Public Review

### `public_web_home.png`

Implementation value: high.

Keep:

- authenticated app workspace instead of marketing hero
- compact location strip
- next action card
- active list and receipt cards
- offer preview with trust/freshness signals

Adjust:

- keep shell consistent with current `PublicShell`
- avoid overloading the first viewport with every module on mobile
- use existing route/state contracts from `PricelyContext`

Implementation targets:

- `web/src/public/public-shell.tsx`
- `web/src/public/public-pages.tsx`
- new shared public components under `web/src/public/components/` or similar

### `public_web_list_editor.png`

Implementation value: high.

Keep:

- three-column desktop planning layout
- item cards with match/brand rule states
- sticky save/optimize action
- side panels for suggestions and optimization readiness

Adjust:

- mobile must collapse into one column with a sticky bottom action
- brand-rule controls should reuse existing list editor behavior
- catalog search loading/no-match states need explicit components

Implementation targets:

- `web/src/public/public-pages.tsx`
- list editor tests in `web/src/public/list-editor-page.spec.tsx`

### `public_web_optimization_result.png`

Implementation value: very high.

Keep:

- summary metrics
- store plan cards
- item-level evidence module
- selected variant separated from requested brand rule
- unavailable item panel

Adjust:

- trust copy should consistently use `Confianca da oferta`
- comparison math must use existing backend fields only
- local distance labels only when backend returns distance

Implementation targets:

- `web/src/public/public-pages.tsx`
- optimization tests in `web/src/public/optimization-page.spec.tsx`
- e2e smoke coverage in `web/e2e/mvp-smoke.spec.ts`

### `public_web_in-store_checklist.png`

Implementation value: high, but after result components.

Keep:

- store grouping
- purchased progress
- mismatch report state
- optional paid total
- receipt handoff

Adjust:

- confirm current backend support for price mismatch and paid total before enabling
  write actions; otherwise render planned/disabled states.
- preserve existing purchased-state API.

Implementation targets:

- `web/src/public/public-pages.tsx`
- checklist tests in `web/src/public/checklist-page.spec.tsx`

### `generic-app.png`

Implementation value: medium.

Use as a mobile layout reference only. It overlaps with `mobile/mobile_app_home.png`
and should not drive a separate web screen.

## Mobile Review

### `mobile_app_home.png`

Implementation value: high.

Keep:

- compact city/location summary
- coverage preview card
- next step panel
- latest optimization card
- active list card
- receipt status card
- quick actions and bottom nav

Adjust:

- map visual tokens into Flutter theme constants before broad screen rewrites
- avoid assuming every product has an image
- keep text shorter than the generated image where possible

Implementation targets:

- `mobile/lib/features/home/presentation/mobile_home_screen.dart`
- `mobile/lib/core/widgets/app_scaffold.dart`

### `mobile_list-checklist_screen.png`

Implementation value: high.

Keep:

- progress summary
- store grouping
- item rows with selected variant and trust score
- mismatch report state
- sticky completion action

Adjust:

- split edit-list and checklist states carefully; current mobile list screen combines
  multiple behaviors.
- use backend-supported purchased-state behavior first.

Implementation targets:

- `mobile/lib/features/shopping_lists/presentation/shopping_list_screen.dart`
- mobile widget tests for shopping lists

### `mobile_optimization_result.png`

Implementation value: very high.

Keep:

- top result metrics
- store plan grouping
- compact evidence row
- unavailable items
- sticky checklist CTA

Adjust:

- replace long text evidence currently rendered in mobile with structured widgets
- keep distance conditional on `distanceKm`

Implementation targets:

- `mobile/lib/features/optimization/presentation/multi_market_result_screen.dart`
- `mobile/lib/features/optimization/domain/optimization_result.dart`

### `mobile_receipt_submission.png`

Implementation value: high.

Keep:

- QR/NFC-e and manual tabs
- validation timeline
- detected receipt metadata cards
- pending reward copy
- privacy/safety note

Adjust:

- current mobile receipt screen may need a larger refactor; implement after shared
  mobile status chips and sticky actions exist.
- do not promise reward grant before backend response confirms it.

Implementation targets:

- `mobile/lib/features/receipts/presentation/receipt_submission_screen.dart`
- `mobile/lib/features/receipts/application/receipt_flow_controller.dart`

## Admin Dashboard Review

### `admin_dashboard_overview.png`

Implementation value: high.

Keep:

- action queue first
- compact metrics second
- receipt/queue/offer/city operational summaries
- severity grouping

Adjust:

- avoid making the overview too chart-heavy
- keep current admin sidebar navigation model

Implementation targets:

- `web/src/dashboard/dashboard-home.tsx`
- `web/src/dashboard/admin-shell.tsx`

### `admin_receipt_processing_queue.png`

Implementation value: very high.

Keep:

- processing/moderation/reward status columns
- quality indicators
- manual release action
- right-side detail panel
- technical data secondary

Adjust:

- ensure destructive reject/reprocess flows use confirmation and feedback
- keep current API payloads from admin receipt-processing endpoints

Implementation targets:

- `web/src/dashboard/dashboard-pages.tsx`
- `web/src/dashboard/dashboard-pages.spec.tsx`

### `admin_catalog_and_offers_management.png`

Implementation value: medium-high.

Keep:

- product list with variant/offer health
- variant detail side panel
- image status
- stale/low-trust offer flags

Adjust:

- this should be split into product, variant, and offer components before a full-page
  rewrite
- avoid raw ID density

Implementation targets:

- `web/src/dashboard/dashboard-pages.tsx`
- catalog/offer tests

### `admin_queue_job_detail.png`

Implementation value: medium-high.

Keep:

- job status summary
- timeline
- failure reason
- related receipt/resource card
- technical payload disclosure

Adjust:

- can be implemented after admin status/action queue components exist

Implementation targets:

- `web/src/dashboard/dashboard-pages.tsx`
- queue/job detail tests

## Component Inventory To Build First

Web shared/public/admin:

- `StatusBadge` with semantic families for trust, receipt, queue, reward, freshness,
  city, and severity.
- `EvidenceModule` for shopper optimization evidence.
- `PriceRow` for product/variant/store/price/source display.
- `NextActionStrip` for public shopper workflow.
- `StickyActionBar` for mobile-width web flows.
- `AdminActionQueueItem` for operational dashboard rows.
- `TechnicalDisclosure` for raw IDs, payloads, and debug metadata.

Mobile Flutter:

- `PricelyStatusChip`
- `PricelyEvidenceBlock`
- `PricelyStickyActionBar`
- `PricelyPriceRow`
- `PricelyReceiptStatusCard`
- theme constants for semantic colors and radii

## Recommended Implementation Batches

### Batch 1: Web Component Foundation

Goal: create reusable primitives that make the generated web/admin screens feasible.

Scope:

- status badge semantics
- evidence module
- price row
- next action strip
- technical disclosure
- focused unit tests

Why first: multiple references depend on these pieces, and current screens duplicate
status/evidence copy.

### Batch 2: Public Web Optimization Result

Goal: ship the highest-value shopper trust surface.

Scope:

- result summary layout
- store plan cards
- item evidence modules
- unavailable item panel
- report/upload actions where already supported
- Playwright/widget coverage

Why second: it connects directly to trust evidence and the recently improved backend
payloads.

### Batch 3: Admin Receipt Processing Queue

Goal: improve the highest-risk admin operations surface.

Scope:

- action summary
- receipt queue readability
- moderation/reward/quality status chips
- right-side/detail disclosure
- release/reprocess/reject feedback

Why third: it supports receipt trust and manual release workflows already validated in
homolog.

### Batch 4: Mobile Optimization Result

Goal: align mobile with the same trust/evidence model.

Scope:

- Flutter evidence block
- store plan cards
- unavailable item state
- sticky checklist action
- widget tests

Why fourth: mobile benefits from the same UX language after web components clarify the
model.

### Batch 5: Public Web Home And List Editor

Goal: make the shopper planning flow feel cohesive.

Scope:

- authenticated home workspace
- active list continuation
- list editor layout
- search/brand-rule states
- responsive sticky action

Why fifth: broader layout changes should happen after evidence/status primitives are
stable.

### Batch 6: Mobile Home, Checklist, Receipt Submission

Goal: complete shopper mobile flow.

Scope:

- home next action hub
- checklist completion/mismatch states
- receipt submission timeline
- reward-pending copy

Why sixth: this is larger and touches multiple mobile flows.

### Batch 7: Admin Catalog And Queue Detail

Goal: round out operational clarity.

Scope:

- catalog/variant/offer health views
- queue job detail timeline
- technical disclosures
- responsive admin tables/cards

## Open Decisions Before Coding

- Whether price mismatch and optional paid total should be implemented as real writes
  now or shown as disabled/planned states until backend endpoints exist.
- Whether `generic-app.png` should be removed or kept as a mobile composition
  reference.
- Whether Flutter theme constants should be introduced before touching individual
  screens.
- Whether admin catalog/offers should be split into dedicated route-level components
  before visual refactor.

## Acceptance Criteria For First Implementation PR

- Uses the reference images as composition guidance, not pixel-perfect targets.
- Preserves current backend contracts and homolog flows.
- Adds focused tests for any behavior or rendering changes.
- Keeps `git diff --check`, web tests, mobile tests, and CI green.
- Does not merge broad web, mobile, and admin rewrites in one PR.

