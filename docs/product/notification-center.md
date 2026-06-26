# Notification Center

The current engagement channel is the authenticated in-app notification center.

## Supported events

- Relevant price drops for products present in active saved lists.
- Receipt processing outcomes and reward validation.
- Optimization completion and terminal failure.

## Preferences

Users can disable all in-app notifications or control price, receipt, and
optimization categories independently.

## Deferred channels

Email and push fields are persisted as disabled capabilities. Enabling either
channel requires provider configuration, verified destination ownership,
delivery/retry tracking, unsubscribe handling, and quiet-hour policy. No
external delivery is attempted in this phase.

## Phase 35 delivery plan

Phase 35 keeps the in-app center as the source of truth and adds outbound delivery
as a controlled fan-out layer.

### Email

- Store a verified email destination per user before delivery is enabled.
- Queue email delivery from the persisted notification record instead of sending
  inline from business flows.
- Include unsubscribe/category controls that map back to existing notification
  preferences.
- Track delivery attempts, provider message id, terminal failure, and retryable
  failure reason without storing provider payloads that may contain personal data.

### Push

- Register mobile device tokens per authenticated user and platform.
- Allow multiple active devices per user, with last-seen timestamps and explicit
  revocation on logout or token refresh.
- Send only compact notification metadata to the push provider; fetch sensitive
  details from the authenticated API after the app opens.
- Respect category preferences and future quiet-hour windows before enqueueing.

### Quiet hours and retries

- Add a per-user quiet-hour window with timezone.
- Defer non-critical notifications during quiet hours; allow critical account or
  receipt-result notifications only if product policy explicitly allows them.
- Use bounded exponential retry for provider failures and stop retrying after a
  terminal provider response.
- Expose delivery state in admin diagnostics before enabling automatic external
  sends broadly.

### Release validation

- CI and Release Readiness should validate both `homolog` and `master`.
- Deploy Homolog Server remains scoped to `homolog` and manual dispatch only.
