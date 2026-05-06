# Pino Logging Plan

## Purpose

Pricely uses structured backend logs to debug API requests, background jobs, receipt
processing, optimization runs, and admin actions without exposing personal data.

## Standards

- Use `nestjs-pino` for HTTP request logs.
- Keep `x-request-id` as the correlation key for every HTTP response and log line.
- Use `LOG_LEVEL` for runtime verbosity. Production defaults to `info`; local
  development can use pretty single-line logs.
- Log domain errors at `warn`, expected client HTTP errors at `warn`, and unexpected
  server failures at `error`.
- Include stable identifiers when available: `userId`, `shoppingListId`,
  `optimizationRunId`, `processingJobId`, `receiptRecordId`, `regionId`, and
  `establishmentId`.

## Redaction Rules

Backend logs must never include secrets or receipt personal data. The shared logging
configuration redacts authorization headers, cookies, API keys, passwords, tokens,
CPF fields, names, and address fields. Receipt services must sanitize payloads before
persistence and avoid logging raw OCR/provider text.

## Module Adoption

1. HTTP edge: keep `LoggingModule` global and preserve request id propagation.
2. Auth/users: log account lifecycle events by user id/email only when needed for
   diagnostics; never log password input or hashes.
3. Optimization/jobs: log queue state transitions with run and job ids.
4. Receipts: log processing state and issue codes only; never log raw receipt text,
   CPF, customer name, or address.
5. Admin: log write actions with admin user id and resource id.

## Validation

- Unit tests cover request id propagation and redaction configuration.
- Error filter tests cover stable error classification and request id response shape.
- Future production rollout should sample logs from staging before enabling broad
  receipt ingestion.
