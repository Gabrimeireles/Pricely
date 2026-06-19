# Prompt: Public Web Protected Auth Required

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely protected public-web state for a logged-out
visitor trying to access a screen that requires an account.

Viewport:
- Desktop web, 1366px wide.
- Include mobile behavior notes for 390px width.

Scenario:
- User is logged out.
- User opened a protected route such as "Minhas listas" or "Notas fiscais".
- City context may be selected or pending.
- The app should show useful next actions instead of an empty page.

Screen goal:
Explain exactly why account access is needed, keep the user oriented in the
product, and provide safe alternatives that work without login.

Required content:
- Public app shell matching the approved home reference:
  - Pricely brand mark and wordmark.
  - Sidebar navigation.
  - Header with city/location context, notification icon, and account action.
- Main panel title variants:
  - "Entre para salvar suas listas" for lists.
  - "Entre para acompanhar suas notas fiscais" for receipts.
- Primary CTA: "Entrar agora".
- Secondary CTA: "Criar conta".
- Tertiary text/button to continue public browsing:
  - "Ver ofertas da cidade"
  - "Selecionar cidade" opens the shared city selector; do not link this CTA
    to `/cidades`.
  - "Ver cidades e lojas" may link to `/cidades` only when the intent is to
    browse supported coverage.
- Action-oriented placeholders:
  - If no lists: "Crie sua primeira lista para comparar precos por loja."
  - If no receipts: "Envie sua primeira nota fiscal para acompanhar a validacao."
  - "Saiba como funciona" link/button for receipts and saved lists.
- Mini preview of what will appear after login, using skeleton/placeholder data
  rather than fake personal values.

Required states:
- no selected city
- selected city available
- protected route for lists
- protected route for receipts
- submit/loading after clicking login
- auth error returned from login

Visual rules:
- Do not leave a mostly empty page.
- Do not show monetary savings, receipt totals, list counts, or personal metrics
  for logged-out users.
- Avoid alarmist copy; this is a normal account step.
- Use compact evidence/status badges only when they explain state.
- Keep the sidebar and header fixed and consistent with the home shell.

Implementation notes:
Map likely components to:
- web/src/public/public-pages.tsx
- web/src/public/public-shell.tsx
- web/src/components/design-system/
- web/src/components/ui/*
```
