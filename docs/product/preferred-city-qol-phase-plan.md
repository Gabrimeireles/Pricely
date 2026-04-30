# Phase 10: Preferred City Persistence and QoL

## Delivery Unit

This phase is intentionally grouped into a single delivery unit on one phase branch.
The work changes shared auth contracts, persisted user preferences, public web state,
mobile onboarding, and admin catalog media handling at the same time. Splitting these
changes into isolated task branches would create temporary contract drift between
backend, web, and mobile.

## Goals

1. Persist the shopper's chosen city on the shared account.
2. Force city selection after login when the account has no saved city.
3. Let later city changes update the same persisted account preference.
4. Improve the public landing and `/listas` surfaces to communicate value better.
5. Make list creation clearer, denser, and more visual on web and mobile.
6. Improve admin catalog management with media upload, PT-BR labels, activation
   controls, and a dark/light theme switch.

## Scope

### Backend

- Add `preferredRegionId` to `UserAccount`.
- Include preferred city in auth/profile responses.
- Add authenticated endpoint to update the preferred city.
- Store uploaded product and variant media locally and return stable URLs.
- Keep media handling local to the application for now; no external object storage.

### Web Public

- Remove automatic city assignment after login.
- Show a blocking city-selection modal when the authenticated user has no preferred city.
- Move low-value public savings copy out of the landing page.
- Strengthen public landing hero value proposition.
- Rework `/listas` to surface account information in cards.
- Rework list creation with card/table rows, live filtering, and explicit
  save-only vs save-and-optimize actions.

### Web Admin

- Replace unexplained `slug` labels with PT-BR labels and helper text.
- Support upload-based product and variant imagery.
- Replace awkward variant deactivation action placement with a visible `Ativo`
  column and control.
- Add dark/light mode switching and stronger field contrast.

### Mobile

- Add a dedicated city-selection screen after login when the user has no saved city.
- Persist city changes back to the backend.
- Keep city-changing available after onboarding.
- Rework list creation to match the comparable-product-first flow more clearly.

## Validation

- Backend follows test-first for new preference/media behavior.
- Web tests cover city modal, landing copy changes, and list-creation actions.
- Mobile tests cover required city onboarding and persisted city updates.
- Final smoke includes Docker boot plus login -> city choose -> list save -> optimize.
