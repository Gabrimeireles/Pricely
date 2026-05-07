# Optimization Engine Plan

## Objective Functions

- Minimize total basket cost for the selected shopping list and city.
- Support single-store and multi-store modes as explicit user choices.
- Prefer exact product variant matches over cheaper but lower-confidence substitutes.
- Keep travel-cost modeling optional until store-distance data is reliable.

## Constraints

- Only use active offers within the selected region.
- Do not select unavailable, expired, or quarantined receipt-derived prices.
- Respect list item quantity, unit, and normalized product match confidence.
- Keep premium/free entitlement checks outside the solver; the solver receives an
  authorized optimization request.

## Tie-Breakers

1. Higher product-match confidence.
2. More recent observed price timestamp.
3. Higher offer confidence level.
4. Lower number of stores when total basket cost is effectively equal.
5. Stable deterministic ordering by product and store id.

## Infeasibility Rules

- Return a partial result when at least one list item has a valid candidate.
- Mark missing items with explicit unavailable reasons.
- Do not invent substitute prices when catalog or receipt data is missing.
- Surface low-confidence warnings instead of silently optimizing on weak data.

## Explanation Payload

Future persisted explanations should include:

- Selected offer per item.
- Rejected cheaper alternatives and rejection reason.
- Missing/unavailable item reasons.
- Price timestamp and source label.
- Savings comparison against the latest completed run or user expected price when
  available.
- Data-quality warnings for stale, OCR-derived, or low-confidence prices.

## Performance Bounds

- Standard local testing target: typical household lists up to 50 items.
- Solver must have bounded runtime and deterministic fallback behavior.
- Performance tests should cover single-store, multi-store, unavailable-item, and
  conflicting-price scenarios before replacing the current implementation.
