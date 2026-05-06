# Application Security Checklist

## Auth and Sessions

- [ ] Protected APIs reject unauthenticated requests.
- [ ] User-scoped reads and writes enforce the authenticated user id.
- [ ] Session refresh and logout behavior do not expose stale account state.
- [ ] Mobile token storage is validated against platform secure-storage expectations.

## RBAC and Admin Boundaries

- [ ] Admin routes require an admin role from the backend, not a client flag.
- [ ] Admin mutations are audited with actor id, target id, and timestamp.
- [ ] User accounts cannot self-promote or alter entitlement source fields.
- [ ] Admin diagnostics avoid exposing CPF, names, addresses, or raw receipt text.

## Payments and Entitlements

- [ ] Stripe checkout is disabled until Phase 19 starts.
- [ ] Webhook endpoints verify signatures before parsing trusted state.
- [ ] Webhook event ids are persisted for replay protection.
- [ ] Entitlement changes are derived from billing events or explicit admin actions.
- [ ] Token consume/refund/grant operations are idempotent and append-only.

## Injection and Input Handling

- [ ] SQL access goes through Prisma or parameterized queries.
- [ ] Malformed UUIDs and IDs return controlled errors.
- [ ] HTML injection payloads are escaped in user-facing and admin surfaces.
- [ ] Receipt OCR text is sanitized before persistence or display.
- [ ] File upload metadata is validated for size, type, owner, and deletion path.

## CI and Release Gates

- [ ] GitHub Actions use least-privilege permissions.
- [ ] Pull request workflows do not use privileged untrusted triggers.
- [ ] Backend, web, and mobile tests pass before phase PR merge.
- [ ] Release rollback and seed reset steps are documented before production rollout.
