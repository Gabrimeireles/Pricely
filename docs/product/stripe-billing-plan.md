# Stripe Billing Plan

## Current State

Stripe checkout, subscriptions, token packs, and payment webhooks are intentionally
disabled. The product can show premium state, but purchase actions must remain disabled
until Phase 19 starts.

## Preconditions

- Internal entitlement and optimization-token ledger tests stay green.
- Monthly free refill behavior is validated locally.
- Failed optimization refunds are idempotent.
- Security checklist covers webhook replay and entitlement source-of-truth rules.

## Planned Billing Scope

- Stripe Customer mapped to a Pricely user account.
- Premium subscription status synchronized into `UserEntitlement`.
- Webhook event persistence with idempotency keys.
- Checkout sessions for web only at first.
- Mobile shows read-only entitlement state until store policy decisions are reviewed.
- Free users receive two optimization tokens per month by default.
- Seeded admin users may be premium for local and homolog validation.

## Disabled UX Rule

Premium purchase buttons may be visible as disabled controls with copy explaining that
billing is not available yet. They must not open checkout, collect payment data, or
create placeholder subscriptions.

## Phase 19 Entry Criteria

- Backend, web, mobile, and workflow-security CI jobs are green on `homolog`.
- Token ledger tests cover grant, consume, refund, idempotent retry, premium bypass,
  and insufficient-token rejection.
- Monthly refill behavior has been validated locally.
- Security checklist covers webhook replay, role escalation, and entitlement source
  boundaries.
