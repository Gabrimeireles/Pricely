# Stitch Prompt: Public Home Workspace

Create the new Pricely public home/workspace screen.

Use `00-system-summary.md`, `00-design-system.md` and the shell from `01-public-shell-location.md`.

Screen purpose:
After login, the first screen should tell the shopper what to do next. It is not a marketing landing page.

Required sections:
- Top summary: active city, location precision, saved lists, available optimization credits, premium status.
- Next-action lane:
  - Criar lista
  - Otimizar lista
  - Continuar checklist
  - Enviar nota fiscal
- "Sua proxima compra" panel with one recommended list/action.
- "Cobertura da cidade" module showing active stores, offers with evidence, and activation/collecting states.
- "Rewards de notas" module showing pending and validated rewards.
- "Premium" module:
  - If premium active: show premium active, unlimited optimizations or credits, support/admin managed.
  - Do not mention free plan copy for premium users.
  - Billing disabled copy should be concise and not look broken.

State variants to include in the same screen:
- new user with no lists;
- active user with pending checklist;
- premium active user;
- city in activation with no offers.

Visual constraints:
- Workspace first viewport.
- Primary action near current user task.
- Dense but readable.

