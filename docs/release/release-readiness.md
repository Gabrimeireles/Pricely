# Release Readiness

## Rollback

- Keep phase branches mergeable into `homolog` before production promotion.
- For backend regressions, revert the phase PR and redeploy the previous known-good
  image or local Docker stack.
- For web/mobile UI regressions, disable the affected entry point through feature flags
  or revert the phase PR before publishing.

## Seed Reset

- Admin seed user must remain deterministic for local and homolog testing.
- Seeded admin entitlement is premium for Phase 18 validation.
- Running seed reset must not create duplicate token grants for the same user and
  period.

## Payment Sandbox

- Stripe remains disabled until Phase 19.
- Checkout buttons must stay disabled and must not call payment APIs.
- Before enabling sandbox billing, webhook signature validation and replay tests must
  exist.

## Observability Checks

- Backend logs should include request/job context and redact sensitive receipt or auth
  data.
- CI must keep backend, web, mobile, and workflow-security jobs green.
- Local Docker remains the validation target until Railway services are provisioned.

## Incident Triage

- Classify incidents by auth/session, entitlement ledger, optimization result, receipt
  privacy, or deployment failure.
- Preserve append-only ledger and sanitized receipt logs for investigation.
- Remove raw receipt files on user deletion or privacy request when file retention is
  enabled.
