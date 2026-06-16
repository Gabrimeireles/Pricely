# Pricely UI Inventory

Status: foundation draft for issue #323.

## Scope

This inventory maps the current implemented surfaces that the new design system must
cover. It intentionally separates current implementation facts from future design
direction.

## Current Web Stack

- Framework: React + Vite.
- UI base: shadcn/ui components in `web/src/components/ui/`.
- Primitive behavior: Radix/shadcn primitives.
- Icons: lucide-react.
- Styling: Tailwind CSS v4 and CSS variables in `web/src/index.css`.
- Current font stack: Manrope and Inter.
- Current shell split:
  - marketing/public routes in `web/src/marketing/` and `web/src/public/`
  - admin routes in `web/src/dashboard/`
  - routing in `web/src/routes/`
  - API/client state in `web/src/app/`

## Current Mobile Stack

- Framework: Flutter.
- App shell: `mobile/lib/core/widgets/app_scaffold.dart`.
- Main routes and scope: `mobile/lib/app/`.
- Feature modules:
  - auth
  - discovery
  - home
  - location
  - optimization
  - receipts
  - shopping lists
- Backend gateway: `mobile/lib/features/shared/data/pricely_backend_gateway.dart`.

## Current Product Capabilities

The MVP currently supports:

- shared account auth across web/mobile
- public city and offer discovery
- list creation and persisted shopping lists
- optimization modes with backend-owned results
- local coverage preview and distance-aware fields where available
- in-store checklist and purchased state
- receipt submission and manual admin release
- receipt-derived trust evidence
- admin metrics, catalog, offers, users, queue, receipt audit, and list operations
- seed admin/customer accounts and demo coverage

## Current Design Assets And References

Versioned references:

- `docs/design/DESIGN.md`: earlier high-level design direction.
- `docs/product/stitch-ui-ux-alignment.md`: Phase 24 audit and delivery lanes.
- `docs/product/stitch-refactor-prompts/`: prompt library for Stitch generation.
- `web/src/assets/pricely-icon.png`: current official brand icon.

External reference:

- Stitch project provided by product owner:
  `https://stitch.withgoogle.com/projects/14832585887941666492`

Use external references as visual inspiration only. The implementation contract lives
in `docs/design-system/`.

## Current Web Component Inventory

Existing reusable UI components:

- `alert`
- `avatar`
- `badge`
- `breadcrumb`
- `button`
- `card`
- `dialog`
- `field`
- `input`
- `input-group`
- `label`
- `select`
- `separator`
- `sheet`
- `sidebar`
- `skeleton`
- `switch`
- `table`
- `tabs`
- `textarea`
- `toggle`
- `toggle-group`
- `tooltip`

Design-system gap:

- status badge variants are spread across feature code
- evidence modules are partially duplicated
- price rows are not a first-class component
- empty states are not standardized
- sticky mobile action patterns need a shared rule
- admin action queues need shared severity components

## Current Web Public Surfaces

Implemented in `web/src/public/` and `web/src/marketing/`:

- public/marketing home
- sign in/sign up
- supported cities
- offer explorer and offer detail
- list workspace
- list editor
- optimization mode selection/result
- checklist
- receipt submission
- profile/entitlement state
- public shell and route error states

Design-system needs:

- one consistent shopper workflow narrative
- componentized city/location context
- componentized optimization evidence
- standardized receipt status cards
- clearer relationship between public offers and list optimization
- responsive sticky actions for long flows

## Current Admin Surfaces

Implemented in `web/src/dashboard/`:

- admin shell
- overview metrics
- regions
- establishments
- products/catalog
- offers
- users
- list operations
- receipt processing
- queue health and job detail

Design-system needs:

- action-first dashboard hierarchy
- shared severity model for operational issues
- readable technical detail disclosure
- data table/card responsive rules
- evidence trace components for optimization and receipts
- consistent icon-only actions and tooltips

## Current Mobile Surfaces

Implemented in `mobile/lib/features/`:

- auth screen
- home screen
- city/market discovery
- shopping list screen
- optimization result screen
- receipt submission screen
- location controller and coverage preview states

Design-system needs:

- mobile tokens mapped from the canonical design system
- bottom navigation and sticky action rules
- compact city/location/radius summary
- list item card standard
- mobile evidence module standard
- receipt state standard
- light/dark parity guidance

## Data States To Design

Public and mobile:

- signed out
- signed in customer
- city missing
- city active
- city activating
- city collecting data
- location permission denied
- location saved
- coverage preview has stores
- coverage preview has no stores
- list empty
- list has matched items
- list has partial matches
- optimization queued/running/completed/failed/stale
- complete coverage
- partial coverage
- unavailable item
- receipt waiting manual release
- receipt queued/running/completed/failed
- reward pending/granted/disabled

Admin:

- no metrics
- healthy operation
- stale offers
- low-trust offers
- failed jobs
- queued jobs
- pending receipts
- quarantined receipts
- rejected receipts
- missing catalog media
- inactive establishments
- premium manually granted

## Known Visual Risks

- Too many badge color implementations are local to screens.
- Current public web has moments that still feel like adjacent pages instead of one
  guided shopping workflow.
- Current mobile result screens expose trust evidence as text rather than structured
  evidence.
- Admin metrics and actions can compete for hierarchy.
- Some legacy copy still uses technical or unaccented labels because of previous
  encoding constraints.

## Recommended Implementation Order

1. Create shared semantic status tokens and status badge rules.
2. Extract web evidence, price row, empty state, and action strip components.
3. Apply system to public web shopper flow.
4. Apply system to admin operational dashboard.
5. Map the same vocabulary to Flutter widgets and theme.
6. Add visual/smoke validation for key surfaces.

