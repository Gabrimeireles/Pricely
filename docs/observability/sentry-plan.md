# Sentry Instrumentation Plan

## Scope

Sentry is planned for release and error telemetry across backend, web, and mobile.
This document defines the integration contract before adding SDKs.

## Backend

- Capture unhandled NestJS exceptions after the HTTP exception filter classifies the
  response.
- Attach `requestId`, environment, release version, route, and authenticated user id
  when available.
- Do not attach request bodies for receipt, auth, billing, or admin write endpoints.
- Use sampling for high-volume queue errors and group by stable domain error codes.

## Web

- Capture route-level errors, failed API flows, and uncaught React exceptions.
- Attach release, environment, route id, and request id from failed API responses.
- Do not capture form values, tokens, receipt payloads, or billing identifiers.

## Mobile

- Capture Flutter framework errors and failed API flows.
- Attach release, platform, route/screen name, and API request id when available.
- Do not capture receipt images, OCR text, account tokens, or device contact data.

## Release Metadata

Use the same release identifier across backend, web, and mobile for one deployable
bundle. CI should provide it from the commit SHA until tagged releases exist.

## Rollout

1. Add SDKs disabled by default.
2. Enable in staging with low sample rates.
3. Verify redaction with synthetic auth, receipt, and billing failures.
4. Enable production after incident triage ownership is documented.
