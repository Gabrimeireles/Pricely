# Phase 18: Monetization Plan

## Recommendation

Use a hybrid freemium model:

- Free users receive a small monthly optimization-token allowance.
- Premium users pay a recurring subscription for unlimited list optimizations under
  fair-use limits.
- Extra one-off token packs can be added later for users who do not want a recurring
  plan.

This is stronger than a pure token model for Pricely because the core value is repeated
weekly or monthly grocery savings. Users need to experience real savings before paying,
but heavy users and households need predictability instead of thinking about every
optimization as a micro-purchase.

## Why This Model Fits Pricely

- Optimization has a real marginal cost: pricing data lookups, queue work, matching,
  and future AI/OR computations.
- The app can show a clear value equation: "you saved R$ X this month" versus a premium
  price.
- Free tokens create a product-led trial without hiding the product behind a hard
  paywall.
- Premium unlimited keeps the main shopper workflow simple.
- Token packs give a fallback for low-frequency users who reject subscriptions.

## Market Signals Used

- Stripe supports credit-based and usage-based billing patterns for prepaid or
  promotional credits, which maps cleanly to optimization tokens:
  https://docs.stripe.com/billing/subscriptions/usage-based/billing-credits
- Stripe also documents credit-based pricing as a usage-based billing use case:
  https://docs.stripe.com/billing/subscriptions/usage-based/use-cases/credits-based-pricing-model
- RevenueCat's 2025 subscription report highlights hybrid monetization, combining
  subscriptions with consumable purchases, as an important subscription-app strategy:
  https://www.revenuecat.com/state-of-subscription-apps-2025/
- Grocery and comparison-shopping businesses commonly combine multiple revenue streams
  such as subscriptions, advertising, affiliate/referral revenue, sponsored placement,
  and retailer partnerships:
  https://sacra.com/research/instacart/
  https://wecantrack.com/insights/how-do-comparison-sites-make-money/

## Initial Plan Tiers

### Free

- Monthly token refill, capped so users cannot hoard unlimited free runs.
- Enough tokens to optimize one or two realistic shopping lists per month.
- Can earn bonus tokens by sharing valid receipts or reporting offer corrections after
  abuse controls exist.
- Shows exact savings delivered by previous optimizations and explains what premium
  unlocks only when the user hits a natural limit.

### Premium

- Recurring monthly and yearly plans.
- Unlimited optimization runs with fair-use controls.
- Priority optimization queue later if queue load becomes material.
- Price alerts, promo alerts, saved comparison history, household sharing, and richer
  checklist/offline features can become premium benefits.

### Token Packs

- Optional second phase.
- Good for users who only do a large monthly shop and do not want a subscription.
- Must be backed by a ledger, not a mutable counter, so refunds, grants, chargebacks,
  and failed optimizations stay auditable.

## Technical Architecture

### Data Model

- Add `UserEntitlement` or `SubscriptionEntitlement` for plan state:
  `free`, `premium`, `trialing`, `past_due`, `cancelled`.
- Add `OptimizationTokenLedger` as append-only rows:
  `grant`, `consume`, `refund`, `expire`, `admin_adjustment`.
- Add `OptimizationTokenGrant` or scheduled refill metadata:
  `periodStart`, `periodEnd`, `expiresAt`, `source`.
- Add idempotency keys tied to optimization run IDs so retries do not double-charge a
  token.
- Keep a derived balance only as a cached projection. The ledger remains the source of
  truth.

### Optimization Flow

1. User requests optimization.
2. Backend checks premium entitlement.
3. If not premium, backend atomically reserves or consumes one token in the same logical
   command that creates the optimization run.
4. If the run fails before producing a user-visible result, backend refunds the token
   through a ledger entry.
5. Re-running the same list creates a new optimization run and consumes a new token
   unless the request is an idempotent retry of the same run.

### Billing

- Start with internal entitlements and ledger so product behavior is testable before
  payment integration.
- Add Stripe subscriptions for premium.
- Add Stripe credit/usage-based billing only after the internal ledger rules are stable.
- For mobile store distribution, account for App Store and Play Store subscription
  requirements before routing mobile users to web billing.

## Product Rules

- Never show fake savings by summing repeated optimizations of the same list. Continue
  using latest completed optimization per list for accumulated savings.
- Show "premium pays for itself" only when real savings in the user's city/list support
  it.
- Keep sponsored offers visually distinct from organic cheapest offers.
- Do not let retailer monetization override optimization ranking unless the UI labels it
  clearly.

## Metrics

- Free token activation rate.
- Optimization-to-list-created rate.
- Token limit hit rate.
- Premium conversion after first real saving.
- Premium churn by delivered savings.
- Average compute cost per optimization.
- Refund rate for failed optimizations.
- Receipt contribution rate and fraud rate.

## Open Decisions

- Free monthly token count.
- Premium fair-use threshold.
- Whether bonus receipt tokens launch before or after abuse scoring.
- Whether annual premium includes extra benefits beyond discount.
- Whether B2B retailer analytics waits until the consumer optimization product is
  trusted and privacy-reviewed.
