# Pricely Design System Foundation

Status: foundation draft for issue #323.

## Purpose

This is the source of truth for the next Pricely UI generation cycle. It is not a
snapshot of the current UI and it is not a Stitch export. It uses the current repo,
roadmap, homolog behavior, seed scenarios, and Stitch/AI exploration as inputs, then
defines a new product system that can be implemented consistently across:

- public web app
- mobile shopper app
- web admin dashboard

## Product Thesis

Pricely is an evidence-first grocery savings product. It helps people decide what to
buy, where to buy it, and whether the app has enough proof to trust the price.

The interface should feel:

- practical, local, and financially useful
- compact enough for repeated grocery use
- explicit about confidence, freshness, location, and receipt evidence
- warm enough for shoppers, disciplined enough for operations

The interface must not feel like:

- a supermarket flyer
- a generic purple SaaS template
- a banking dashboard
- a decorative marketing site
- a raw admin console

## Inputs And Precedence

When sources conflict, use this precedence:

1. Product facts from the repo and backend contracts.
2. Current roadmap and completed task state in `specs/001-grocery-optimizer/tasks.md`.
3. Homolog/seed behavior and validated MVP flows.
4. This design system.
5. Stitch or other AI-generated visual references.
6. Legacy layout choices in current screens.

Stitch references are useful for visual exploration, but they are not implementation
truth. Generated screens must be reconciled back into this system before coding.

## Brand Principles

- Evidence before persuasion: every recommended price needs source, freshness, and
  confidence context.
- City before proximity: do not imply nearby-store precision unless the backend has
  saved location, radius coverage, and distance-aware results for that flow.
- Savings only when provable: use savings highlights only when the comparison rule is
  explicit.
- Operations are part of trust: admin tools must expose why data is blocked, stale,
  low-confidence, or pending review.
- One workflow, many surfaces: web and mobile should tell the same shopper story:
  choose city, build list, optimize, shop, contribute receipt.

## Color Tokens

Use semantic roles first. Hex values are canonical for design specs; implementation
may map them to OKLCH/Tailwind tokens if contrast is preserved.

| Token | Hex | Role |
| --- | --- | --- |
| `brand.primary` | `#0F766E` | Primary action, selected state, trusted recommendation |
| `brand.primaryHover` | `#115E59` | Primary hover/pressed |
| `brand.savings` | `#65A30D` | Proven savings, positive deltas |
| `brand.location` | `#2563EB` | Location, city, radius, informational state |
| `brand.warning` | `#D97706` | Partial coverage, stale data, pending review |
| `brand.critical` | `#E11D48` | Rejected, destructive, expired, failed |
| `brand.neutralText` | `#18221F` | Primary text |
| `brand.mutedText` | `#5F6F69` | Secondary/help text |
| `surface.base` | `#F7FAF8` | Page background |
| `surface.raised` | `#FFFFFF` | Cards, sheets, forms, rows |
| `surface.subtle` | `#EDF5F2` | Soft grouped region |
| `surface.selected` | `#DDF3EE` | Selected state background |
| `border.default` | `#DDE8E4` | Standard border |
| `border.strong` | `#B9CCC5` | Emphasis border |
| `dark.base` | `#071311` | Dark page background |
| `dark.raised` | `#10201D` | Dark raised surface |

Rules:

- Do not use color alone for status. Pair color with text and/or icon.
- Keep accent usage limited to one dominant accent per view.
- Avoid gradients as a system primitive. Do not use purple/blue gradients.
- Use `brand.savings` only for proven savings, not generic success.
- Use `brand.warning` for uncertainty, not for errors.

## Typography

Web:

- Use the existing Manrope/Inter stack unless a deliberate brand typography change is
  approved.
- Use tabular numbers for prices, savings, counts, queue metrics, and trust scores.
- Use `text-balance` for headings and `text-pretty` for longer explanatory copy.
- Do not use negative letter spacing.

Mobile:

- Use platform-native Material/Flutter typography.
- Respect user font scaling.
- Avoid fixed-height text containers.
- Keep price and trust values readable at small viewport widths.

Scale:

| Role | Web | Mobile |
| --- | --- | --- |
| Display | 32-40px semibold | 30-34sp semibold |
| Page title | 24-30px semibold | 22-26sp semibold |
| Section title | 18-22px semibold | 18-20sp semibold |
| Body | 15-16px regular | 15-17sp regular |
| Compact label | 12-14px medium | 12-14sp medium |
| Price emphasis | 20-32px semibold tabular | 20-30sp semibold tabular |

## Shape, Spacing, And Density

- Default radius: 8px.
- Status badges may be pill-shaped.
- Avoid nested cards.
- Use cards for repeated entities: offers, products, list items, receipts, jobs.
- Use unframed page sections or full-width bands for page-level grouping.
- Touch targets: 44px minimum web/mobile, 48dp preferred on mobile.
- Dense admin surfaces may use compact rows, but actions must remain keyboard and
  screen-reader accessible.

Spacing rhythm:

- 4px: icon/text micro gaps
- 8px: compact vertical grouping
- 12px: badge/metadata row gaps
- 16px: card padding on mobile and dense admin
- 24px: section spacing
- 32px+: major page breaks

## Core Components

### App Shell

Public web and mobile shells must keep city/location context visible without blocking
the main workflow. Admin shell must prioritize navigation, identity, and operational
status.

Required states:

- signed out
- signed in customer
- signed in admin
- city selected
- no city selected
- location permission denied
- location saved with coverage preview
- backend unavailable

### Buttons

- Primary: one per decision area.
- Secondary: outline or tonal.
- Destructive: critical token plus confirmation for irreversible actions.
- Icon-only buttons require `aria-label` and tooltip on web.
- Use lucide icons on web when available.

### Status Badge

Required status families:

- city: `active`, `activating`, `collecting_data`, `hidden`
- offer freshness: `fresh`, `aging`, `stale`, `expired`
- trust: `high`, `medium`, `low`, `unknown`
- receipt: `accepted`, `pending_review`, `duplicate`, `quarantined`,
  `rejected`, `low_confidence`
- queue: `queued`, `running`, `retrying`, `failed`, `completed`
- reward: `eligible_pending`, `granted`, `disabled`, `rejected`

### Evidence Module

Every optimized recommendation should be able to render an evidence module with:

- selected variant and package
- requested brand rule
- store and neighborhood
- selected price
- comparison basis
- source label
- trust score and trust label
- receipt/observation count
- freshness age
- confidence notice
- user action: report issue or upload receipt

### Price Row

Price rows must include:

- product or variant name
- package/unit
- store
- price
- freshness/confidence
- source when used for decisions

Do not show an optimized price as a naked number.

### Empty State

Every empty state needs:

- a specific reason
- one primary next action
- no blame language

Examples:

- no city: choose a city
- no local coverage: increase radius or use city-wide mode
- no trusted offers: contribute receipt or browse city offers
- no admin queue items: show healthy state and link to monitoring history

## Interaction Rules

- Use segmented controls for optimization modes.
- Use tabs for switching related views inside one surface.
- Use tables for admin comparison, but provide stacked cards on narrow screens.
- Use sticky action bars for long shopper forms and mobile checkout-like flows.
- Show errors next to the action or field that caused them.
- Use skeletons for loading states that reserve layout.
- Do not add decorative animations. If motion is needed, animate only opacity or
  transform and keep interaction feedback below 200ms.

## Content Rules

Preferred PT-BR vocabulary:

- `Confianca da oferta`
- `Validado por nota fiscal`
- `Origem operacional`
- `Cobertura local`
- `Modo cidade`
- `Perto de mim`
- `Aguardando revisao`
- `Liberado para processamento`

Avoid:

- `trust factor` in shopper UI unless paired with translated label
- `0 notas fiscais confiaveis`
- proximity claims before coverage preview/distance is available
- reward promises before receipt quality validates the outcome

## Platform Relationship

Web public and mobile share the same mental model, but not the same layout.

- Web public: better for planning, comparison, list editing, and review.
- Mobile: better for shopping, location, receipt QR/manual entry, and quick status.
- Admin dashboard: separate operational product, not a public-web variant.

## AI UI Generation Contract

Any ChatGPT, Stitch, Claude, or other generated UI must follow this contract:

1. Generate components first, screens second.
2. Do not generate web, mobile, and admin in one mixed canvas.
3. Use real Pricely entities and states from this repo.
4. Include loading, empty, error, permission, and partial-data states.
5. Preserve the shopper workflow: city -> list -> optimize -> shop -> receipt.
6. Preserve the admin workflow: detect issue -> inspect evidence -> act -> verify.
7. Return implementation notes mapping each generated component to repo files.

