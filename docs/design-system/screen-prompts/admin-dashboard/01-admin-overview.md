# Prompt: Admin Overview

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely admin dashboard overview.

Viewport:
- Desktop admin, 1440px wide.
- Include tablet/mobile responsive notes.

Scenario:
- Admin signed in.
- Active users: 3.
- Active regions: 2.
- Active offers: 42.
- Queued jobs: 2.
- Failed jobs: 2.
- Pending receipts: 3.
- Low-trust offers: 5.

Screen goal:
Make the admin overview an operational command center, not just a metrics page.

Required content:
- Admin sidebar.
- Operator identity.
- Action queue at top.
- Severity grouped cards: critical, warning, info, healthy.
- Queue health summary.
- Receipt moderation summary.
- Offer trust/freshness summary.
- City coverage summary.
- Metrics panel below action queue.

Required states:
- healthy/no action needed
- backend loading skeleton
- metrics unavailable
- high severity failure

Visual rules:
- Dense but breathable.
- Metrics support action hierarchy.
- Raw IDs hidden behind detail affordance.
- Status uses icon + text + color.

Implementation notes:
Map likely components to:
- web/src/dashboard/dashboard-home.tsx
- web/src/dashboard/admin-shell.tsx
- web/src/dashboard/dashboard-pages.tsx
```

