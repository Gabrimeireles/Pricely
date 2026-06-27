# Notification Center

The current engagement channel is the authenticated in-app notification center.

## Supported events

- Relevant price drops for products present in active saved lists.
- Receipt processing outcomes and reward validation.
- Optimization completion and terminal failure.

## Preferences

Users can disable all in-app notifications or control price, receipt, and
optimization categories independently.

## Outbound channels

Email and push delivery are modeled as queued delivery attempts. Email requires
a verified destination and push requires an active mobile device. Provider sends
remain gated by the delivery worker/provider configuration, while the product
surface can already persist preferences, delivery attempts, unsubscribe state,
device registration, and quiet-hour deferral.

## Phase 35 delivery plan

Phase 35 keeps the in-app center as the source of truth and adds outbound delivery
as a controlled fan-out layer.

**Status (2026-06-26)**: Complete on `homolog` at
`11400cb1a4e39c31bc8f48389bd77fd282ddb8de`. CI, Release Readiness, and Deploy
Homolog Server passed after T269. Email and push remain provider-gated; the
platform now persists preferences, email verification, unsubscribe/category
mapping, push device registration, quiet-hour deferral, delivery attempts,
retry/cancel admin controls, and redacted diagnostics across backend, web, and
mobile coverage.

### Email

- Store a verified email destination per user before delivery is enabled.
- Queue email delivery from the persisted notification record instead of sending
  inline from business flows.
- Include unsubscribe/category controls that map back to existing notification
  preferences.
- Track delivery attempts, provider message id, terminal failure, and retryable
  failure reason without storing provider payloads that may contain personal data.
- Expose admin diagnostics with masked destinations, redacted provider errors,
  manual retry for retryable attempts, and cancellation for queued/retrying
  attempts.

### Push

- Register mobile device tokens per authenticated user and platform.
- Allow multiple active devices per user, with last-seen timestamps and explicit
  revocation on logout or token refresh.
- Send only compact notification metadata to the push provider; fetch sensitive
  details from the authenticated API after the app opens.
- Respect category preferences and future quiet-hour windows before enqueueing.

### Quiet hours and retries

- Add a per-user quiet-hour window with timezone.
- Defer non-critical email and push delivery attempts during quiet hours by
  setting `nextAttemptAt` to the end of the user-local quiet window.
- Keep in-app notifications immediate so users can still see account activity
  after signing in.
- Allow critical account or receipt-result notifications only if product policy
  explicitly allows them.
- Use bounded exponential retry for provider failures and stop retrying after a
  terminal provider response.
- Expose delivery state in admin diagnostics before enabling automatic external
  sends broadly; provider message ids, emails, push token tails, URLs, and long
  tokens must not be shown raw in the dashboard.

### Release validation

- CI and Release Readiness should validate both `homolog` and `master`.
- Deploy Homolog Server remains scoped to `homolog` and manual dispatch only.

## Recommended next phase

Phase 36 should focus on provider-gated outbound delivery hardening rather than
turning on broad sends immediately:

- Add provider adapter contracts for email and push with sandbox-only sends.
- Add worker-level observability for queued, sent, deferred, retrying, failed,
  cancelled, and delivered attempts.
- Add admin filters/search for notification delivery diagnostics once volume grows.
- Add release checklist entries for provider credentials, unsubscribe safety,
  quiet-hour policy, and incident rollback.

If product priority shifts back to UX, the alternate next phase is mobile/web
parity polish for notification preferences, device management, and admin delivery
diagnostics.

## Phase 36 delivery hardening

**Status (2026-06-26)**: Started with provider-neutral delivery contracts and
sandbox adapters. Sandbox delivery can exercise email and push state transitions
without sending to external providers or storing raw provider payloads.

### Provider gating

- Sandbox is the only implemented adapter.
- Email delivery receives a masked destination label and verified destination id.
- Push delivery receives a redacted device-token tail, device id, platform, and
  provider label; raw push tokens are never available to the delivery adapter.
- Provider responses update the delivery attempt as `delivered`, `retrying`, or
  `failed`; in-app notifications remain the canonical record.

### Remaining Phase 36 work

- Bounded scheduler is implemented for due delivery attempts with startup and
  interval ticks, structured logs, no overlapping batches, capped batch size,
  and environment kill switches.
- Admin diagnostics include filters for channel, status, notification type,
  retryability, redacted destination, and general search.
- Release readiness now includes provider credential checks, unsubscribe
  rollback, quiet-hour validation, sandbox smoke, and incident response.
- Release Readiness runs notification delivery release coverage for sandbox
  success, retryable provider failure, terminal provider failure, and quiet-hour
  deferral.

### Worker controls

- `QUEUE_WORKERS_ENABLED=false` disables queue workers and notification delivery
  scheduling in shared worker environments.
- `NOTIFICATION_DELIVERY_WORKER_ENABLED=false` disables only outbound notification
  delivery scheduling.
- `NOTIFICATION_DELIVERY_BATCH_SIZE` controls each due-attempt batch and is capped
  at 100 attempts.
- `NOTIFICATION_DELIVERY_POLL_INTERVAL_MS` controls scheduler cadence and is
  floored at 1000 ms.
