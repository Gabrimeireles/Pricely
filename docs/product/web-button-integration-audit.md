# Web Button Integration Audit

Date: 2026-06-17
Issue: #370

## Scope

Audited app-facing TSX surfaces under:

- `web/src/public/`
- `web/src/dashboard/`
- `web/src/components/design-system/`
- `web/src/routes/`

Excluded shadcn/Radix primitive internals and test-only files.

## Inventory Summary

AST extraction found 136 button-like actions:

- 57 route/navigation actions via `Button asChild`, `Link`, or `a`
- 9 form submit actions
- 55 explicit click handlers
- 13 no-handler candidates
- 2 disabled placeholders
- 1 explicit noop handler

The candidates below are the actions that need product decisions, existing-feature
wiring, or new Spec Kit tasks.

## Candidate Map

| Surface | Button | Current state | Existing support | Classification |
| --- | --- | --- | --- | --- |
| `web/src/public/public-pages.tsx:1256` | Location state action (`Abrir configurações`) | Renders a button with no handler | Location permission and fallback flows exist, but browsers do not expose a universal settings opener | Existing feature needs UI correction |
| `web/src/public/public-pages.tsx:2525` | `Comprar Premium` / `Premium indisponível` | Disabled placeholder | Billing is intentionally disabled; mapped to Phase 19 tasks T141-T148, especially T146 | Already specified, no new task |
| `web/src/public/public-pages.tsx:3482` | Share list icon | No handler | No public share link/export feature found | New feature gap |
| `web/src/public/public-pages.tsx:3860` | `Adicionar produto não encontrado` | No handler | Public catalog search and admin catalog exist, but no shopper missing-product request queue exists | New feature gap |
| `web/src/public/public-pages.tsx:4103` | Notifications bell | No handler | No notification preference, alert, or delivery feature found | New feature gap |
| `web/src/public/public-pages.tsx:4306` | Optimization-result tabs | Visual active state only, no tab state | Result data already contains optimized items, unavailable items, store plan, and savings analysis | Existing data needs UI wiring |
| `web/src/public/public-pages.tsx:4319` | `Exibir: Todos os itens` | No handler | Result item data exists; no filter/dropdown behavior exists | Existing data needs UI wiring |
| `web/src/public/public-pages.tsx:4490` | `Ver evidência` | No handler | `ShopperEvidenceModule` already exists and is rendered for selected rows | Existing feature needs UI wiring |
| `web/src/public/public-pages.tsx:5075` | `Ver no mapa` | No handler | Establishment coordinates/distance exist, but no map/deep-link route UX exists | New feature gap |
| `web/src/dashboard/dashboard-pages.tsx:5176` | Job `Tentar novamente` | Disabled unless failed, no handler | Receipt reprocess exists; generic processing-job retry does not | New feature gap |
| `web/src/dashboard/dashboard-pages.tsx:5184` | `Marcar como revisado` | No handler | No processing-job reviewed state or endpoint found | New feature gap |
| `web/src/dashboard/dashboard-pages.tsx:5187` | `Cancelar job` | No handler | No processing-job cancellation endpoint or queue cancellation policy found | New feature gap |
| `web/src/components/design-system/admin-action-queue-item.tsx:60` | Default `Ver detalhe` | Fallback button has no handler | Real usages pass an integrated `action`; fallback should not render a dead CTA | Component contract cleanup |
| `web/src/components/design-system/app-sidebar-shell.tsx:514` | Location dialog `Confirmado` | Explicit noop handler | Selected city/location state already exists; button should close dialog or be removed | Existing feature needs UI wiring |
| `web/src/components/design-system/evidence-module.tsx:111` | Default `Enviar nota` | Fallback button has no handler | Real receipt submission route exists; component should receive an integrated action or render no fallback | Component contract cleanup |
| `web/src/components/design-system/next-action-strip.tsx:61` | Default `Continuar` | Fallback button has no handler | Callers should provide a route/action; fallback should not render a dead CTA | Component contract cleanup |

## Existing-Feature Wiring Recommendations

- Replace the location settings placeholder with explanatory copy plus the existing
  retry/location setup action where appropriate.
- Make the location dialog confirmation close the dialog after a valid city is selected,
  or remove the button if the select itself persists immediately.
- Convert optimization result tabs and item filters into local UI state over the
  already-present result arrays.
- Use `ShopperEvidenceModule` for per-item evidence expansion instead of a dead
  `Ver evidência` button.
- Tighten design-system component defaults so reusable components do not emit
  non-functional fallback CTAs.

## New Feature Gaps

These do not currently have a complete feature behind the button:

1. Shareable shopping-list links or exports.
2. Shopper missing-product request intake and admin triage.
3. User notification preferences and alert delivery.
4. Map/deep-link route view for optimized store plans.
5. Generic processing-job retry, reviewed, and cancellation operations.

The corresponding Spec Kit tasks were added to
`specs/001-grocery-optimizer/tasks.md` as Phase 28.
