# Stitch Prompt: Admin Receipts and Processing Detail

Create `/dashboard/notas`, `/dashboard/fila` and `/dashboard/fila/:jobId` focused on receipt processing.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
Admin manually releases receipts and inspects processing output before automatic processing exists.

Receipt queue requirements:
- tabs/status filters:
  - waiting manual release;
  - queued;
  - processing;
  - completed;
  - failed;
  - quarantined;
  - duplicate;
- receipt row:
  - submitted by;
  - store;
  - purchase date;
  - confidence;
  - moderation status;
  - reward readiness;
  - release action;
  - detail action.

Detail requirements:
- extracted payload:
  - access key;
  - NFC-e URL;
  - store identity;
  - date;
  - totals;
- line items:
  - raw item;
  - normalized/matched product;
  - maker action for missing product;
  - old price vs new price;
  - price up/down signal;
  - line confidence;
- reward decision:
  - pending, granted, disabled, ineligible;
  - reason.
- processing logs/timeline.

Visual constraints:
- Use readable review layout.
- Do not show raw job IDs as primary labels.
- "Go to link" must become icon action/details.

