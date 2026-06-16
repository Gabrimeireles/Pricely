# Admin Dashboard UI Guidelines

Status: foundation draft for issue #323.

## Role Of Admin Dashboard

The admin dashboard is an operations product. Its job is to expose what needs action,
why it matters, and what the operator can safely do next.

It should not be a decorative analytics page. Metrics support decisions; they are not
the primary goal.

## Admin IA

Primary hierarchy:

1. Operational action queue.
2. Evidence and diagnostics.
3. CRUD/data management.
4. Metrics and trend context.
5. Technical details.

Top-level areas:

- overview
- regions
- establishments
- catalog/products/variants
- offers
- users
- receipts
- queue/jobs
- list/optimization operations

## Layout Rules

- Desktop-first, responsive down to tablet/mobile web.
- Use sidebar navigation for primary admin sections.
- Use cards for action queues and repeated operational items.
- Use tables for dense comparison and CRUD lists.
- Tables must collapse into stacked cards or readable row groups on small widths.
- Put raw IDs behind disclosure, drawer, or detail section.
- Human-readable owner/list/store/status labels come before technical IDs.

## Severity Model

Use one shared severity scale:

| Severity | Meaning | Examples |
| --- | --- | --- |
| `critical` | blocking or data-risking | failed job, rejected suspicious receipt, destructive pending action |
| `warning` | needs review | stale offer, low trust, quarantined receipt, retrying job |
| `info` | context | city activation, coverage gap, manual release pending |
| `healthy` | no action needed | completed job, accepted receipt, active city |

Severity cannot rely on color alone.

## Core Admin Components

### Operations Summary

Shows:

- highest severity count
- primary operational queue
- recent failures
- stale/low-trust offers
- pending receipt reviews
- city coverage gaps

### Action Queue Item

Shows:

- issue title
- severity
- affected entity
- owner/store/city/list context
- age/elapsed time
- next action
- link to detail

### Evidence Trace

Used for optimization, offers, and receipts.

Shows:

- selected offer/decision
- rejected alternatives when available
- source
- trust score/level
- freshness
- receipt provenance
- moderation state
- operator action history

### Admin Data Table

Required:

- readable first column
- status badges
- owner/context columns
- compact numeric columns with tabular numbers
- icon actions with labels/tooltips
- details drawer for raw payloads/IDs

### Technical Detail Disclosure

Use for:

- raw IDs
- job payloads
- receipt extracted payload
- API/resource metadata
- correlation/debug information

Do not make technical identifiers the first-level visual hierarchy.

## Section Guidelines

### Overview

Required:

- action queue first
- metrics second
- queue health summary
- receipt moderation summary
- offer trust/freshness summary
- city coverage summary

### Regions And Establishments

Required:

- activation status
- active establishment count
- address/CEP/geolocation readiness
- shopper-visible state preview
- empty/activation placeholders

### Catalog And Variants

Required:

- product-level view
- variant detail route/tab
- image status
- searchable/collapsible long variant lists
- offer count and stale/low-confidence flags

### Offers

Required:

- product/variant
- establishment
- price
- source
- trust
- freshness
- comparison context
- moderation/report state

### Receipts

Required:

- queue/release status
- moderation status
- reward eligibility
- extracted payload
- line-item match quality
- maker actions for missing products/offers
- clear release/reprocess/reject actions

### Queue And Jobs

Required:

- queue status counts
- failed/retrying jobs first
- owner/resource context
- elapsed time
- retry/failure reason
- detail page with technical data

### Users

Required:

- identity
- role
- entitlement state
- list/location/receipt visibility
- manual premium/credit operations with audit-safe copy

## Interaction Rules

- Destructive actions require confirmation dialog.
- Manual premium, receipt release, reprocess, reject, and destructive catalog changes
  require explicit result feedback.
- Inline validation must appear near the relevant field.
- Loading states should preserve table/card structure.
- Empty states should explain operational health or next setup step.

## Validation

For admin UI changes:

- run web unit tests
- run Playwright admin smoke when behavior changes
- test keyboard access for action rows and dialogs
- verify no horizontal overflow at tablet width
- verify raw IDs are still accessible but not primary

