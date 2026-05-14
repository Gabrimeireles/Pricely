# Stitch Prompt: Admin Users

Create `/dashboard/usuarios`.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
Admin can inspect users and perform support operations while billing is disabled.

Required table/list columns:
- user name/email;
- role;
- city/locality;
- list count;
- optimization count;
- receipt submissions;
- premium status;
- available optimization credits;
- last payment placeholder/status;
- last activity.

Actions:
- view user details;
- make premium;
- add optimization credits;
- revoke premium if needed;
- inspect lists/receipts/optimization history.

Important copy:
- Billing is disabled; premium is support/admin managed.
- Do not show checkout actions.

Visual constraints:
- Use dense table on desktop.
- Mobile uses stacked user rows.
- Raw IDs hidden behind detail drawer.

