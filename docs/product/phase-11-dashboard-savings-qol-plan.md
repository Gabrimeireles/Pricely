# Phase 11: Dashboard, Savings, and City-First List QoL

## Delivery Unit

This phase stays grouped on a single phase branch because it changes:

- backend aggregation rules for counts and savings
- public account and landing copy
- list-creation interaction rules on web and mobile
- admin region/product/offer/list/queue surfaces

Splitting these changes would create temporary drift between contracts, computed totals,
and UI expectations.

## Goals

1. Make the admin dashboard clearer in PT-BR and visually easier to scan.
2. Compute establishment counts and savings in the backend, not in the frontend.
3. Remove the weak pre-login savings message and move real savings value to authenticated surfaces.
4. Simplify list creation: either any brand or an exact variant, with real-time comparable-product rows.
5. Keep checklist behavior in checklist/list-followup flows, not in new-list creation.
6. Add auditable history for processed lists and richer queue details for operations.

## Backend Scope

- Return active establishment counts from the backend for admin and public region views.
- Persist and expose per-list estimated savings based on completed optimizations.
- Aggregate estimated savings:
  - per user for authenticated profile and `/listas`
  - globally for landing/social proof
- Expose auditable processed-list history for admin operations.
- Expose richer queue diagnostics, including job identifiers, attempts, and empty-state summaries.

## Web Public Scope

- Improve the top account header alignment and city summary.
- Remove weak public zero-savings framing from landing and pre-login views.
- Show authenticated savings with usage-aware copy only after login.
- Restyle `/listas` cards and list editor with clearer borders and hierarchy.
- Change product selection to:
  - real-time filtered comparable-product list
  - any brand or exact variant only
  - quantity selection inline
  - explicit `Salvar` vs `Salvar e otimizar`
- Keep checklist access on saved-list/checklist views, not on the new-list form.

## Web Admin Scope

- Add PT-BR helper text where technical identifiers are required.
- Replace ambiguous raw `slug` presentation with explainers and better labels.
- Show regions as cards with active-state controls and stronger borders.
- Make theme toggle a single icon button with clear visual affordance.
- Use upload affordances with iconography for variant images.
- Use variant image fallback from the first variant when the base product has none.
- Group offers by original product and allow variant expansion/collapse.
- Add list-operations history and queue-health detail views suitable for auditing.

## Mobile Scope

- Keep city-first behavior and align savings/account copy with authenticated use.
- Refactor list creation so the user picks:
  - comparable product
  - any brand or exact variant
  - quantity
- Remove free-form preferred-brand logic from the UI.
- Keep checklist in follow-up/list usage, not in new-list creation.

## Stitch Alignment

- Reuse the existing Stitch direction for:
  - header compactness and hierarchy
  - richer list cards
  - clearer operations/admin cards
- Limit Stitch-driven changes to component-level refinement, not full-screen rebuilds.

## Validation

- Backend changes follow test-first where server-side aggregation/behavior changes.
- Web and mobile tests cover the new variant-selection flow and copy/state changes.
- Docker-backed smoke must validate:
  - city-first login flow
  - list save and optimize
  - per-user savings
  - global savings
  - admin region/list/queue views
