# Web Sidebar Shell Extraction

Task: issue #368, PR branch `codex/web-fixed-sidebar-shell`.

## Expected

- Public and admin routes use sidebar navigation instead of topbar/header navigation.
- Sidebar, sidebar header, sidebar footer, and page header are present on every extracted screen.
- Header may contain shell status and sidebar trigger, but no navigation links.
- Public context controls move to the sidebar: city, location, theme, session.
- Admin actions move to the sidebar footer: theme, user, public link.

## Smoke Extraction

Command:

```bash
npm run e2e -- --project=chromium
```

Screens extracted by `web/e2e/shell-layout.spec.ts`:

- `docs/design-system/screen-extractions/web-public-home-sidebar.png`
- `docs/design-system/screen-extractions/web-admin-queue-sidebar.png`

Observed public home:

- Path: `/`
- Sidebar navigation labels: Inicio, Ofertas, Cidades, Minhas listas, Notas fiscais
- `header nav` count: 0
- Sidebar header present: yes
- Sidebar footer present: yes
- Page header present: yes

Observed admin queue:

- Path: `/dashboard/fila`
- Sidebar navigation labels: Visao geral, Regioes, Estabelecimentos, Produtos, Ofertas, Operacoes de listas, Usuarios, Notas fiscais, Fila e saude
- `header nav` count: 0
- Sidebar header present: yes
- Sidebar footer present: yes
- Page header present: yes

## Functional State

- Public pages keep city selection, location dialog, theme toggle, sign-in/sign-out entry points, and route navigation.
- Admin pages keep protected access, admin route navigation, theme toggle, user identity, and public-area link.
- Existing shopper/admin smoke flows still pass after the shell refactor.
