# Stitch Prompt: Admin Shell and Overview

Create the admin shell and `/dashboard` overview.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
Admins need an action-first operations surface, not a metrics-only dashboard.

Required shell:
- Sidebar nav:
  - Overview;
  - Regioes;
  - Estabelecimentos;
  - Produtos;
  - Ofertas;
  - Listas;
  - Usuarios;
  - Notas fiscais;
  - Fila;
- Header with environment/status and link back to public app.
- Responsive admin nav.

Overview required content:
- Action queue cards:
  - receipts waiting manual release;
  - failed processing jobs;
  - stale offers;
  - low-trust offers;
  - quarantined receipts;
  - catalog image gaps;
  - city coverage issues.
- Each card shows count, severity, owner/action and icon action.
- Recent operations feed with human-readable labels before raw IDs.
- Health summary for API/queue/worker.

Visual constraints:
- Operational command center.
- No "go to link" text; use icon actions with labels/tooltips.
- Hide raw IDs behind detail affordances.

