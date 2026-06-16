# Prompt: Admin Receipt Processing

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely admin receipt processing queue.

Viewport:
- Desktop admin, 1440px wide.
- Include responsive notes for tablet and mobile web.

Scenario:
- 6 receipt records.
- States include waiting manual release, pending review, duplicate, quarantined,
  rejected, accepted.
- One receipt has reward eligible pending.
- One receipt has low extraction confidence.

Screen goal:
Help an operator decide which receipts need release, reprocess, rejection, or review.

Required content:
- Admin sidebar.
- Top action summary.
- Receipt queue table/card hybrid.
- Status columns: processing, moderation, reward.
- Quality indicators: line count, match confidence, useful data ratio.
- Primary actions: liberar processamento, reprocessar, rejeitar.
- Detail drawer preview with extracted payload and line items.
- Technical IDs hidden in disclosure.

Required states:
- no receipts
- release action success
- release action failure
- destructive reject confirmation
- low confidence detail

Visual rules:
- Actionable rows before raw data.
- Use severity badges.
- Destructive actions require confirmation.
- Keep reward copy pending-safe.

Implementation notes:
Map likely components to:
- web/src/dashboard/dashboard-pages.tsx
- web/src/dashboard/dashboard-pages.spec.tsx
```

