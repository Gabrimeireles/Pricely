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
