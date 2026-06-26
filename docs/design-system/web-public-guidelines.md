# Public Web UI Guidelines

Status: foundation draft for issue #323.

## Role Of Public Web

The public web app is the planning and review surface for shoppers. It should help a
user understand city coverage, build a list, compare offers, run optimization, and
finish with a checklist/receipt loop.

It should not behave like a generic marketing site once the user is inside the app.

## Primary Workflow

Use this workflow as the first-priority IA:

1. Choose or confirm city.
2. Build or continue a list.
3. Choose optimization mode.
4. Review result with evidence.
5. Shop with checklist.
6. Contribute receipt or report mismatch.

Offer browsing supports this workflow. It is not a separate product competing with
shopping-list optimization.

## Layout Rules

- Start app routes with functional content, not hero marketing.
- Keep city/location context visible as a compact strip or header summary.
- Use one dominant primary action per page section.
- Use cards for repeated lists, products, offers, receipt submissions, and result
  selections.
- Do not put page sections inside decorative cards.
- Long forms and result pages should have sticky bottom actions on mobile widths.
- Admin-like tables should not appear in shopper routes.

## Public Web Core Components

### City Context Strip

Shows:

- selected city
- city status
- active establishment count
- local coverage preview if location is saved
- next action if city/location is missing

States:

- no city selected
- active city with offers
- active city with no offers
- activating city
- collecting-data city
- location saved
- location denied
- no establishments in radius

### Next Best Action Strip

Used on home, lists, optimization, checklist, and receipt pages.

Content:

- current workflow step
- one recommended next action
- optional secondary link
- no marketing copy

### Product/List Item Card

Shows:

- product image or neutral fallback
- requested product name
- quantity and unit
- requested brand rule
- selected optimized variant when available
- match/confidence status
- purchased state in checklist

### Offer Comparison Card

Shows:

- product/variant
- cheapest eligible store
- neighborhood
- current price
- freshness
- source/trust
- comparison action for other stores

Group public offers by comparable product/variant. Avoid duplicate cards for the same
variant unless the package or eligibility differs materially.

### Optimization Evidence Module

Use the canonical evidence module from `pricely-design-system.md`.

Shopper default density:

- trust label
- trust score
- source
- receipt/observation count
- freshness
- selected variant
- action: report or upload receipt

Hide deep technical details behind a disclosure.

### Receipt State Card

States:

- submitted
- waiting manual release
- queued
- running
- accepted
- pending review
- duplicate
- rejected
- low confidence
- reward pending
- reward granted
- reward disabled

Never promise credits before the backend has granted or explicitly marked the reward
as eligible pending validation.

## Page Guidelines

### Home

Primary job: resume shopping.

Required:

- city context
- next best action
- active list continuation
- useful offer preview
- receipt contribution prompt only after shopping/checklist context

Avoid:

- oversized marketing hero inside authenticated app
- decorative feature cards
- repeating city context in multiple large panels

### Cities And Offers

Required:

- city status explanations
- supported establishments or activation placeholder
- grouped offer comparisons
- store filter
- no broken empty grids

### Lists And List Editor

Required:

- list title and city
- item entry with catalog-backed search
- brand rule selector
- quantity controls
- inline validation
- sticky save/optimize action on small viewports

### Optimization

Required:

- mode selection as segmented cards/control
- clear tradeoff between one store, city-wide total, and nearby modes
- error copy near the failed action
- local modes must explain location/radius requirements

### Optimization Result

Required:

- total estimated cost
- savings and comparison basis
- coverage status
- store count or selected store summary
- item-level evidence module
- unavailable items
- report/upload receipt actions

### Checklist

Required:

- optimized selected variants when available
- store grouping
- purchased toggles
- price mismatch report
- optional paid total on completion
- receipt handoff after completion

### Auth And Entitlement

Required:

- seed/local credentials may be documented, never displayed as production UX
- premium active state must not show free-plan limitation copy
- billing disabled state must be explicit and support-safe

## Validation

For each major public web refresh:

- run web unit tests
- run Playwright Chromium smoke for auth, city, list, optimization, receipt
- capture responsive screenshots for mobile and desktop widths
- verify no horizontal overflow
- verify icon-only actions have labels/tooltips

