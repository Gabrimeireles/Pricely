# Location-Aware Optimization Plan

## Goal

Make Pricely optimization use offers from receipts and future approved sources while
respecting the shopper's city and, for local modes, the shopper's configured location
and coverage radius.

## Data Sources

Offer candidates may come from:

- User-provided fiscal receipts, primarily NFC-e
- Future supermarket APIs
- Future supermarket site imports or controlled scraping where legally allowed
- Future user-provided product or shelf photos

Receipt-derived offers remain the priority source for the current roadmap. All sources
must preserve offer provenance, observed timestamp, confidence level, and moderation
state.

## Establishment Location Data

Distance-aware optimization needs establishment location data that is more precise than
city name but still operationally maintainable.

Required establishment fields:

- street address
- neighborhood
- city/region
- state
- CEP
- latitude and longitude
- geocoding source
- geocoding precision, such as exact address, CEP centroid, or manual coordinate
- geocoding updated timestamp

Initial implementation can store latitude/longitude directly in PostgreSQL and compute
distance with Haversine in the backend domain layer. If volume or query complexity
increases, move radius filtering to PostGIS while preserving the same API contract.

Seed data should include realistic addresses or CEPs and coordinates for every active
establishment used in location-aware tests.

## Final Optimization Modes

### Local unique

`local_unique` selects the cheapest viable basket from one active establishment inside
the user's coverage radius.

Rules:

- Requires user location preference.
- Requires establishment coordinates.
- Filters establishments by same selected city/region and distance <= coverage radius.
- Selects one establishment for all available items.
- Marks missing items when no confirmed offer exists inside the selected local
  establishment.

### Local multi

`local_multi` selects the cheapest item-level offers across active establishments inside
the user's coverage radius.

Rules:

- Requires user location preference.
- Requires establishment coordinates.
- Filters establishments by same selected city/region and distance <= coverage radius.
- Allows different establishments per item.
- Includes distance per selected establishment in the explanation payload.

### Global multi

`global_multi` selects the cheapest item-level offers across the user's selected
city/region, ignoring proximity ranking.

Rules:

- Requires selected city/region.
- Does not require user location.
- Must not include establishments outside the selected city/region.
- Allows different establishments per item.

## Coverage Radius

Users configure a maximum distance around their location. Before saving the setting,
the UI must show how many active establishments exist inside that area.

The coverage preview must:

- Count only active establishments in the selected city/region.
- Exclude establishments without coordinates.
- Recalculate when the user changes location or radius.
- Avoid storing precise location unless the user saves it.

## Location Widgets

Web and mobile must provide explicit widgets for both permission-based location reading
and manual user selection.

Required widget behavior:

- Offer a "use my current location" action that invokes the platform location
  permission flow.
- Offer manual selection when permission is denied, unavailable, or intentionally
  skipped.
- Let the user choose or edit region/city independently from precise coordinates.
- Let the user adjust the coverage radius before saving.
- Show the active establishment count inside the selected radius before saving.
- Clearly distinguish unsaved preview state from saved account preference.
- Keep global optimization usable with city/region selection even when precise location
  is not configured.

Web implementation should use browser geolocation only after user action. Mobile
implementation should use the platform permission flow and support denied,
restricted, and unavailable states.

## Location Privacy

Location data must be explicit and user-controlled.

Rules:

- Do not infer precise location from receipts.
- Do not infer precise location from CPF, name, address, or IP.
- Do not store CPF, name, or address from receipts.
- Store only the user-configured coordinates, label, region, radius, and coverage
  metadata needed for optimization.
- Allow users to update or remove saved location preferences.

## Explanation Requirements

Optimization results must include:

- Mode used
- City/region used
- Coverage radius for local modes
- Candidate establishment count
- Selected establishment distance for local modes
- Rejected alternatives and reasons
- Missing item reasons when no offer exists in the eligible area

## Implementation Notes

Distance calculation can start with a Haversine implementation in the backend domain
layer. If volume grows, move radius filtering to PostgreSQL indexes or PostGIS without
changing the optimizer contract.
