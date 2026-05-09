# Stitch UI/UX Alignment Audit

## Context

Phase 24 should improve the product experience after the core backend, receipt,
optimization, entitlement, security, and homolog deployment work. The current app is
functional, but the next UX pass should make the flows easier to scan, more visual,
and more explicit about why Pricely trusts each recommendation.

This audit converts the broad Phase 24 direction into smaller delivery lanes that can
be implemented through issues and PRs without destabilizing the backend behavior that
is already validated.

## Current Product Shape

- Public web already has city-first navigation, offers, list editing, optimization
  results, checklist mode, profile metrics, and token states in `web/src/public/`.
- Admin web already has overview, regions, establishments, catalog, offers, list
  operations, queue health, and job detail surfaces in `web/src/dashboard/`.
- Mobile already has bottom navigation for home, lists, optimization, receipts, and
  profile in `mobile/lib/features/home/`, with separate list, receipt, and result
  screens.
- Backend contracts now expose optimization explanation, receipt trust, offer
  confidence, and trust-factor fields that can become first-class UI evidence.

## Product Gaps

### Public Shopper Flow

The shopper journey is technically complete, but the main conversion path still feels
like several adjacent screens instead of one guided shopping workflow.

Improve the flow around these moments:

- city selected or missing
- list created or edited
- item match quality and brand rule selected
- optimization mode chosen
- trust factor and price freshness interpreted
- checklist used inside the store
- receipt contribution submitted after shopping

Recommended scope change: make "create list -> optimize -> shop -> contribute receipt"
the primary narrative for public web and mobile, and let offers browsing support that
journey instead of competing with it as a separate surface.

### Optimization Result Trust

Trust factor is now available but should not be shown as an isolated number. Users need
to see why the recommendation is trusted and what to do when confidence is weak.

Required evidence module:

- source type, such as receipt-derived or seeded/admin data
- number of validating receipts or trusted observations
- last validation age
- trust score and label
- freshness decay warning when stale
- missing or low-confidence reason
- user action: report issue, upload receipt, or choose another store

Recommended scope change: replace raw technical copy in result cards with compact
"Evidencia da oferta" modules on shopper surfaces and deeper "Decision trace" modules
for admins.

### Location-Aware UX

Phase 23 is still pending. Phase 24 should not visually imply nearby-store accuracy
until location-aware optimization lands. Current "local" wording can be improved, but
nearby claims must stay guarded.

Recommended scope change: design the location widgets now, but implement local mode
copy as "city/local context" until T170-T177 add coordinates, radius preview, and
distance-aware explanations.

### Receipt Contribution UX

Receipt ingestion and scoring are available enough to explain contribution quality,
but rewards remain gated by T162. The UI should highlight contribution status without
promising token rewards prematurely.

Recommended scope change: make receipt contribution a trust-building flow before a
reward flow. Show accepted, pending review, duplicate, rejected, and low-confidence
states visually, then add reward language only after T162.

### Admin Operations

Admin surfaces expose useful diagnostics, but the most important operational states
should be easier to scan.

Improve admin hierarchy around:

- stale or low-trust offers needing review
- receipt-derived offers pending moderation
- queue failures by resource type
- optimization runs with partial coverage
- catalog products with weak images or missing variants
- city coverage and establishment activation state

Recommended scope change: make admin overview an action queue first and a metrics page
second. Metrics should support decisions; low-trust and blocked data should rise to
the top.

## Design-System Mapping

Use the existing `docs/design/DESIGN.md` direction as the implementation source of
truth unless Stitch conflicts materially.

### Tokens

- Primary action and selected state: `brand.teal` / `#0F766E`
- Savings proof: `brand.lime` / `#84CC16`
- Location and informational state: `brand.blue` / `#2563EB`
- Uncertain, stale, or partial data: `brand.amber` / `#F59E0B`
- Rejected, expired, destructive, or hard error: `brand.coral` / `#F43F5E`
- Main surface: `surface.base` / `#F7FAF8`
- Raised repeated item surface: `surface.raised` / `#FFFFFF`

### Component Rules

- Keep cards for repeated entities: offers, products, list items, queue jobs, and
  receipt submissions.
- Do not put page sections inside decorative cards.
- Use 8px radius for cards, buttons, sheets, and compact panels.
- Use badges with icon or text for trust, freshness, receipt status, and coverage.
- Use tabular numbers for price and savings comparisons.
- Use segmented controls for optimization modes.
- Use explicit empty and partial states, especially for missing city, no coverage, no
  trusted offers, and exhausted optimization tokens.

## Proposed Delivery Lanes

### Lane A: Shopper Flow Narrative

Goal: make public web and mobile feel like one shopping workflow.

Tasks:

- add a compact "next best action" strip on landing, lists, optimization, checklist,
  and receipt states
- make city context persistent and visually prominent without blocking offer browsing
- make list item cards show image, product, brand rule, quantity, and confidence
- route users from completed checklist to receipt contribution

### Lane B: Trust and Evidence Modules

Goal: make optimization recommendations explainable without overwhelming users.

Tasks:

- create a reusable shopper evidence component for trust factor, receipts, freshness,
  source, and confidence notice
- create an admin decision evidence component with selected offer, rejected
  alternatives, source, trust decay, and moderation status
- add report/upload actions for low-trust or stale selections

### Lane C: Receipt Quality Surfaces

Goal: make receipt contribution feedback visual and honest before rewards are enabled.

Tasks:

- render receipt status as accepted, pending review, duplicate, rejected, or low
  confidence
- show why a receipt did or did not update offers
- keep reward language disabled until T162 is complete
- expose admin receipt-review queues by moderation reason

### Lane D: Location Readiness

Goal: prepare UI for Phase 23 without claiming unsupported proximity behavior.

Tasks:

- add location preference mock/disabled states behind existing city-first behavior
- define radius-preview visual layout for web and mobile
- add copy that distinguishes city-wide global optimization from future nearby local
  optimization
- implement final distance display only after backend T170-T177 lands

### Lane E: Admin Actionability

Goal: turn the dashboard from a metrics summary into an operational command center.

Tasks:

- elevate stale offers, low-trust offers, failed jobs, and quarantined receipts
- add visual severity grouping for queue and moderation status
- make catalog image/variant gaps visible as admin tasks
- keep raw tables available as detail views, not first-level summaries

## Validation Plan

- Add Playwright screenshots for landing, offers, list editor, optimization result,
  checklist, receipt state, and public city chooser.
- Add web unit coverage for evidence modules and stale/low-trust states.
- Add dashboard tests for admin action queues and receipt/offer moderation states.
- Add mobile widget tests or screenshot notes for home, list, optimization result,
  receipt contribution, profile/token state, and dark mode.
- Keep existing backend, web, mobile, and homolog smoke checks green.

## Open Scope Decisions

- Decide whether Phase 24 should include the first implementation of location widgets
  or only design-ready disabled states before Phase 23 lands.
- Decide whether receipt contribution should be reachable from the main public web nav
  before the reward flow is connected.
- Decide whether admin review for receipt-derived offers should be its own top-level
  route or live under queue/list operations.
- Decide whether "Trust factor" remains the UI label or becomes "Confianca da oferta"
  for shopper-facing copy.
