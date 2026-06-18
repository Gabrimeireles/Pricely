# Prompt: Public Web Login and Register

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely public web authentication entry.

Viewport:
- Desktop web, 1366px wide.
- Include mobile behavior notes for 390px width.

Scenario:
- User is logged out.
- Selected city may exist, but account is required to save lists, reuse monthly
  shopping, submit receipts, and keep preferences across web and mobile.
- The user can switch between "Entrar" and "Criar conta" without leaving the
  screen.

Screen goal:
Make authentication feel like a continuation of the shopper workflow, not a
generic account wall.

Required content:
- Public app shell matching the approved home reference:
  - Pricely brand mark and wordmark.
  - Sidebar navigation.
  - Header with city/location context, notification icon, and account action.
- Login panel with email, password, forgot password link, submit action, and
  "Criar conta" switch.
- Register panel variant with name, email, password, confirm password, terms
  acknowledgement, submit action, and "Ja tenho conta" switch.
- Context panel explaining what the account unlocks:
  - salvar listas
  - continuar no celular
  - receber status de nota fiscal
  - preservar cidade/localizacao
- Trust copy that does not mention payments or rewards.

Required states:
- empty fields
- invalid email
- wrong password
- email already registered
- loading submit
- backend unavailable
- successful login redirecting back to the requested screen

Visual rules:
- Compact form, no marketing hero.
- Use one primary action per panel.
- Do not use nested cards.
- Keep form labels visible, not placeholder-only.
- Password visibility toggle must have tooltip/accessibility label.
- Error text must appear near the relevant field.

Implementation notes:
Map likely components to:
- web/src/public/public-pages.tsx
- web/src/public/public-shell.tsx
- web/src/components/ui/input.tsx
- web/src/components/ui/button.tsx
- web/src/components/ui/card.tsx
```

