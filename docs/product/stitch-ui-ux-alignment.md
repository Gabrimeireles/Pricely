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

### Checklist Completion and Price Reports

Checklist mode should become the shopper's in-store closing flow instead of only a
manual purchased-state list.

Required behavior:

- allow the shopper to mark an item as purchased
- allow the shopper to report that the shelf/register price does not match the app
  price
- capture optional reported price, store, note, and evidence path for later review
- automatically detect when all items are checked
- offer a "concluir lista" action when the list is complete
- ask for the total paid as an optional value before finishing
- route the user to receipt contribution after completion, without requiring it

Recommended scope change: treat checklist completion, price mismatch reports, optional
paid total, and receipt contribution as one post-shopping feedback loop.

### City Activation and Empty Coverage

Cities without active establishments or without offers need explicit placeholders.
`active`, `activating`, and `collecting_data` states must not look broken or empty.

Required behavior:

- active city with offers: show offers and active establishment count
- active city with establishments but no current offers: show coverage empty state and
  contribution CTA
- activating city: show "em ativacao", explain that offers are not available yet, and
  invite contribution or notification interest
- inactive city: hide from shopper selectors unless admin previewing
- supported-establishments blocks must show active establishments for cities that have
  them and an activation placeholder for cities that do not

### Offers by City and Establishment Filtering

The current offer explorer can list the same product multiple times when several
establishments have the same variant. This makes comparison harder.

Required behavior:

- group public offers by comparable product and variant
- show the cheapest currently eligible establishment first
- show "mais barato em" with store, neighborhood, current price, and freshness
- allow filtering by establishment/store
- allow opening a comparison panel that lists other establishments for the same
  product/variant
- avoid duplicate product cards unless package/variant is materially different
- show variant image in both offer cards and admin offer rows

Recommended scope change: make public city offers a comparison surface, not a raw
offer feed.

### Mobile Responsiveness and Sticky Actions

Important actions currently risk being far from the user on long pages. Persistent
context panels also take too much attention when repeated across the app.

Required behavior:

- replace fixed full-width account/city context blocks with compact contextual headers
  or collapsible summaries
- keep primary actions such as save, optimize, finish checklist, and upload receipt in
  a sticky mobile action bar when the page is long
- verify landing, offers, list editor, optimization result, checklist, admin tables,
  and auth/profile pages on mobile widths
- avoid wide tables on shopper mobile surfaces; use stacked cards instead

### Premium and Entitlement Copy

Premium users should not see copy that explains free-plan limits as if they still
apply.

Required behavior:

- premium active: show "Premium ativo", unlimited optimization value, billing/status
  state, and support-safe management copy
- free user: show monthly token limit, remaining token count, and disabled billing
  note if checkout is unavailable
- trialing/past_due/cancelled/expired: show status-specific copy and next action
- never show "o plano gratuito inclui..." inside a premium-active state

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

### Item Decision Accuracy

Optimization results must show the actual selected variant when the user allowed any
variant. "Qualquer variante" is the request rule, not the final selection.

Required behavior:

- show requested rule separately from selected variant
- show selected variant, package, store, neighborhood, and price in the primary row
- update the list after optimization so the checklist reflects selected variants and
  stores where appropriate
- compare price against a true metric: lowest eligible alternative, city median, or
  regional average
- label the metric explicitly, for example "R$ 1,00 abaixo da media regional" only
  when the average minus selected price is actually R$ 1,00
- show average/median separately from the selected-price delta
- remove nonsensical copy such as "0 notas fiscais confiaveis"
- use "sem validacoes por nota fiscal ainda" for zero receipt evidence and explain
  seed/admin data separately

Recommended scope change: define a single shopper-facing comparison rule. Prefer
"economia vs proxima melhor alternativa elegivel" for item-level decisions and show
regional average as secondary context.

### Location-Aware UX

Phase 23 is still pending. Phase 24 should not visually imply nearby-store accuracy
until location-aware optimization lands. Current "local" wording can be improved, but
nearby claims must stay guarded.

Recommended scope change: design the location widgets now, but implement local mode
copy as "city/local context" until T170-T177 add coordinates, radius preview, and
distance-aware explanations.

Location data should use establishment coordinates derived from address/CEP and allow
future PostGIS indexing without changing the user-facing contract.

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

### Admin Catalog and Queue Readability

Catalog and operational screens need to reduce raw-id density.

Required behavior:

- split catalog product editing from variant editing or make variants an explicit
  detail route/tab
- show variant images in price and offer rows
- make long variant lists searchable and collapsible
- replace "go to link" text with an icon button and accessible label
- summarize operation cards with human-readable status, owner, list name, mode, elapsed
  time, and next action before raw identifiers
- move raw IDs and metadata into a detail drawer or expandable technical section

### Public Load Performance

The public URL is perceived as slow. Treat performance as a product requirement, not
only infrastructure.

Investigation targets:

- initial JS bundle size and route-level code splitting
- blocking requests on landing, especially regions, impact, offers, and auth/session
  hydration
- image weight, remote image latency, and missing dimensions
- Cloudflare/API latency and cold container startup
- React render waterfalls from shared context fetching
- Vite/dev artifacts accidentally reaching public deploy

Success target:

- capture Lighthouse or Playwright navigation timing for the public URL
- define LCP, TTI, total JS, and critical API latency budgets
- make landing usable with skeletons even if offers/impact are still loading

### Seed and Test Data Realism

The current seed data is too small for validating comparison, grouping, stale data,
trust decay, admin operations, and responsive layouts.

Required seed expansion:

- more active and activating cities
- more establishments per active city, with CNPJ, neighborhood, CEP/address, and
  coordinates when Phase 23 lands
- more catalog products and variants across grocery categories
- enough duplicate comparable offers to validate cheapest-store grouping
- stale, low-confidence, receipt-derived, admin-seeded, promotional, and unavailable
  offer scenarios
- receipt records that exercise accepted, duplicate, quarantined, rejected, and pending
  review states

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
- add checklist price mismatch reporting and optional paid-total capture

### Lane B: Trust and Evidence Modules

Goal: make optimization recommendations explainable without overwhelming users.

Tasks:

- create a reusable shopper evidence component for trust factor, receipts, freshness,
  source, and confidence notice
- create an admin decision evidence component with selected offer, rejected
  alternatives, source, trust decay, and moderation status
- add report/upload actions for low-trust or stale selections
- separate requested brand rule from selected optimized variant
- show true comparison math and remove zero-receipt wording that implies bad data

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

### Lane F: Offer Discovery and Data Realism

Goal: make public offer browsing and seed data representative enough for real testing.

Tasks:

- group offers by product/variant and show cheapest eligible establishment first
- add establishment filtering and comparison panels
- expand seed data across cities, stores, products, variants, offers, and receipt
  quality states
- add city activation placeholders and supported-establishment empty states

### Lane G: Performance and Responsive Quality

Goal: make the public URL feel fast and usable on mobile.

Tasks:

- profile public load with Lighthouse/Playwright navigation timing
- identify API, bundle, image, and hydration bottlenecks
- add route-level/code-splitting or request deferral where needed
- add sticky mobile actions and mobile-first card layouts for dense screens

## Validation Plan

- Add Playwright screenshots for landing, offers, list editor, optimization result,
  checklist, receipt state, and public city chooser.
- Add performance assertions or recorded budgets for the public landing URL.
- Add web unit coverage for evidence modules and stale/low-trust states.
- Add web coverage for checklist mismatch reporting, optional paid total, city
  activation placeholders, establishment filters, and grouped offer comparisons.
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
- Decide whether optimization should update shopping-list items directly or persist a
  separate optimized-checklist projection that leaves the original requested list
  untouched.
- Decide whether item comparison should primarily use next-best eligible alternative,
  city median, or regional average.
