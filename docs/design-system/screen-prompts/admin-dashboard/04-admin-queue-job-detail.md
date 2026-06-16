# Prompt: Admin Queue Job Detail

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely admin queue job detail.

Viewport:
- Desktop admin, 1366px wide.
- Include responsive notes.

Scenario:
- Queue: receipts.
- Job type: receipt.extract.
- Status: failed after retry.
- Resource: receipt for Mercado Centro.
- Owner: Cliente Pricely.
- Failure reason available.
- Related receipt moderation status: quarantined.

Screen goal:
Let an operator understand job failure context and choose the right next action.

Required content:
- Admin sidebar.
- Job status summary.
- Human-readable owner/resource context.
- Timeline: queued, running, failed, retrying.
- Failure reason panel.
- Related receipt/card.
- Actions: retry, open receipt, mark reviewed.
- Technical payload/log disclosure.
- Correlation/debug metadata hidden until expanded.

Required states:
- queued job
- running job
- completed job
- failed job
- retry action success/failure

Visual rules:
- Human-readable context before raw job IDs.
- Critical severity for failed state.
- Technical details remain accessible but secondary.
- Use tabular numbers for attempts/timing.

Implementation notes:
Map likely components to:
- web/src/dashboard/dashboard-pages.tsx
- web/src/dashboard/dashboard-pages.spec.tsx
```

