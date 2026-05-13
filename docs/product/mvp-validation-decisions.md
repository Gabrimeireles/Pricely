# MVP Validation Decisions

**Date**: 2026-05-13
**Scope**: Spec Kit checklist unblock for the Grocery Shopping Optimizer MVP.

This document records product and security decisions confirmed before continuing the
UX refactor phase. These decisions validate the requirement direction; implementation
continues through the open tasks in `specs/001-grocery-optimizer/tasks.md`.

## City and Coverage States

- `active`: visible to shoppers; may show establishments, offers, and optimization
  surfaces.
- `activating`: visible to shoppers; shows an activation placeholder, no offer claims,
  and contribution/contact CTAs.
- `inactive`: hidden from normal shopper selectors; visible to admins.
- A visible city may have zero active establishments. The UI must show that state as
  activation or coverage collection, not as a broken empty list.
- City creation remains admin-only. Shoppers may request support for a city through a
  contact/request flow.

## Shared Account Behavior

- Web and mobile use the same account, lists, active city, optimization history,
  tokens, premium state, and receipt/reward history.
- Admin accounts behave as normal shopper accounts on mobile. Admin-only dashboards
  and privileged actions remain web/admin capabilities.

## Location Policy

- Establishments must support address, CEP, latitude, and longitude.
- Users may provide geolocation, with CEP/manual city as fallback.
- Default coverage radius is 5 km.
- The product must not make proximity or distance claims until location-aware backend
  filtering and explanation fields are implemented.

## Optimization Modes and Result Math

- `local`: city/local-context optimization; becomes radius-aware after location work
  is complete.
- `global_unique`: chooses one eligible establishment for the list when possible.
- `global_full`: chooses the cheapest eligible offer item by item, even across stores.
- Item-level savings compare the selected offer against the second cheapest eligible
  alternative.
- City or regional average is shown only as secondary context and must not be mixed
  into savings copy unless the arithmetic is true.
- When the user requested any variant, optimization may persist the selected variant
  for the current optimized checklist while preserving the original "any variant"
  intent for future re-optimization.

## Receipt Processing and Rewards

- Web receipt submissions enter `waiting_manual_release` by default.
- Admins manually release receipts to processing during the MVP.
- `RECEIPT_PROCESSING_MODE=automatic` remains a future escape hatch and must be tested
  separately from the default manual mode.
- Mobile will submit NFC-e QR URLs to the same backend queue and show submitted,
  waiting release, processing, and reward validated states.
- Rewards start as processing/pending when a receipt is submitted and are validated
  only after useful, correctly processed receipt data passes quality scoring.
- Duplicate, fraudulent, rejected, or low-quality receipts must not update offers or
  grant rewards.

## Trust and Offer Evidence

- Shopper copy should use `Confianca da oferta`, not raw technical trust-factor text.
- Evidence copy must distinguish source type: admin/manual seed, receipt-derived, or
  other approved source.
- Receipt evidence increases trust when recent, non-duplicated, and quality-scored.
- Trust decays when an offer has not been validated again for a long period.
- Zero receipt support should be phrased as `sem validacoes por nota fiscal ainda`
  with separate source context, never as "0 notas fiscais confiaveis".

## Billing, Premium, and Tokens

- Billing remains disabled until the billing phase is explicitly resumed.
- Admins may manually activate premium and grant extra optimization tokens.
- Premium users bypass free-token consumption subject to fair-use/abuse controls.
- Free users receive two optimization tokens per month by default.
- Token grants, consumption, refunds, admin adjustments, and receipt rewards must use
  the append-only token ledger.
- Premium-active UI must not explain the free-plan limit as if it applies to the
  current user.

## Security Decisions

- Session refresh and logout must clear stale account and entitlement state.
- Mobile token storage must use platform secure-storage expectations.
- Admin mutations must be audited with actor id, target id, action, and timestamp.
- Users cannot self-promote or alter entitlement source fields.
- Entitlement changes come only from explicit admin actions or verified billing events.
- Stripe webhook implementation remains blocked while billing is disabled; when
  resumed, webhook signatures and persisted event ids are required before trusted
  entitlement changes.

## MVP Execution Priority

- Finish web/admin/backend MVP first.
- Mobile UX and QR receipt submission continue, but must not block web/admin/backend
  finalization unless they touch shared contracts.
- QR-code online fiscal lookup, scraping, flyer ingestion, and LLM-only matching
  remain post-MVP or assistive features behind deterministic evidence and review
  gates.
