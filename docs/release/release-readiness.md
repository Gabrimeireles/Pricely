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

## Notification Delivery Gate

Outbound notification delivery must stay provider-gated until the release issue
records all checks below for the promoted SHA:

- Provider credentials are present only in the target environment secret store.
- `QUEUE_WORKERS_ENABLED` and `NOTIFICATION_DELIVERY_WORKER_ENABLED` are set to
  the intended values for the environment.
- `NOTIFICATION_DELIVERY_BATCH_SIZE` and
  `NOTIFICATION_DELIVERY_POLL_INTERVAL_MS` match the release plan.
- Sandbox email and push adapters are the active providers unless the release
  explicitly enables an external provider.
- Email unsubscribe tokens are generated, hashed at rest, and absent from
  production API responses.
- Category-level unsubscribe behavior has been checked for price, receipt, and
  optimization notifications.
- Quiet-hour defaults are documented for the release, including timezone,
  start/end minutes, and expected deferral behavior.
- Admin notification delivery filters can find attempts by channel, status,
  notification type, retryability, destination label, and technical id.

### Sandbox Smoke

Run sandbox notification smoke before enabling broad delivery:

1. Create one notification with a verified email destination and assert a
   sandbox email attempt reaches `delivered`.
2. Create one notification with a registered push device and assert a sandbox
   push attempt reaches `delivered`.
3. Force a retryable sandbox provider failure and assert the attempt becomes
   `retrying` with a future `nextAttemptAt`.
4. Force a terminal sandbox provider failure and assert the attempt becomes
   `failed` with a redacted provider error.
5. Enable quiet hours for a non-critical notification and assert the attempt is
   deferred to the user-local quiet-hour end.
6. Confirm in-app notifications remain visible even when outbound attempts are
   deferred, retrying, failed, or disabled.

Record the admin diagnostics URL or screenshot, the attempt ids, and the
workflow/runbook link in the release issue. Do not record raw email addresses,
push tokens, unsubscribe tokens, or provider payloads.

### Notification Rollback

Use the least disruptive rollback that stops outbound sends first:

1. Set `NOTIFICATION_DELIVERY_WORKER_ENABLED=false`.
2. If the issue affects all workers, set `QUEUE_WORKERS_ENABLED=false`.
3. Redeploy or restart workers so the kill switch is applied.
4. Verify no new attempts move from `queued` or `retrying` to `sending`.
5. Cancel or retry affected attempts from admin only after product owner
   approval.
6. Revert the release SHA only if disabling workers does not stop user impact or
   the app cannot serve in-app notifications safely.

Do not delete delivery attempts during rollback. Keep failed and cancelled rows
for audit, provider reconciliation, and user-support context.

## Incident Triage

- Classify incidents by auth/session, entitlement ledger, optimization result, receipt
  privacy, or deployment failure.
- Preserve append-only ledger and sanitized receipt logs for investigation.
- Remove raw receipt files on user deletion or privacy request when file retention is
  enabled.

### Notification Incidents

Classify notification incidents separately when they involve provider
credentials, unsubscribe safety, quiet-hour violations, delivery volume, retry
loops, or admin action mistakes.

- First response is to disable notification delivery workers, not to purge data.
- Incident payloads may include release, environment, aggregate counts, channel,
  status, provider label, and redacted destination label.
- Incident payloads must not include email addresses, push tokens, unsubscribe
  tokens, provider message bodies, receipt contents, addresses, or search terms.
- User-facing mitigation should prefer in-app notification continuity while
  outbound email/push remains disabled.
