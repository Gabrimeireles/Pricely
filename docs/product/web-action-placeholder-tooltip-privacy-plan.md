# Web Action Placeholder, Tooltip, and Monetary Privacy Plan

Date: 2026-06-17
Issue: #372

## Principles

- Empty states must be action-oriented. If a user has no data yet, the state should
  explain the next useful action, such as "Envie sua primeira nota fiscal" or
  "Saiba como funciona".
- Disabled or deferred actions must explain why they are unavailable and what unlocks
  them.
- Tooltips should clarify icons, status badges, sensitive operational terms, truncated
  technical labels, and destructive actions. They should not replace visible labels for
  primary workflows.
- Monetary information is sensitive. Users and admins need a persistent hide/show
  control for prices, savings, paid totals, token value-adjacent metrics, and billing
  diagnostics.

## Action Placeholder Inventory

### Public Web

- Home contextual states in `web/src/public/public-pages.tsx`
  - No city selected: offer "Selecionar cidade" and explain city-scoped pricing.
  - Location denied: show "Saiba como ativar" and keep manual city/CEP fallback.
  - No stores in radius: offer "Ampliar raio" once radius editing exists; until then
    route to city/global mode guidance.
  - Loading data: use skeleton and explain what is being loaded.
- Receipts page in `web/src/public/public-pages.tsx`
  - Never submitted a receipt: show "Envie sua primeira nota fiscal", "Saiba como
    funciona", and "O reward depende de validação".
  - Submitted waiting manual release: show next action and expected admin review state.
  - Failed/rejected/duplicate receipt: show recovery action and support-safe reason.
- Lists/profile page in `web/src/public/public-pages.tsx`
  - No lists: show "Crie sua primeira lista".
  - No estimated savings yet: show "Otimize uma lista para ver economia estimada".
  - Billing disabled: keep "Premium indisponivel" but add "Saiba por que".
- Checklist page in `web/src/public/public-pages.tsx`
  - Completed checklist without receipt: show "Envie a nota desta compra".
  - No paid total captured: explain optional field and privacy.
- List editor in `web/src/public/public-pages.tsx`
  - Product not found: currently mapped by T221, but placeholder should explain
    "Solicitar produto para o catalogo".
  - Empty item list: focus product search and show examples.
- Optimization result in `web/src/public/public-pages.tsx`
  - Processing/no result: show "Recalcular", "Voltar para lista", and what status means.
  - No unavailable items: show positive empty state.
  - No store plan: show "Resultado por cidade" or "Sem parada definida".
  - Evidence/action sections: show what happens when there are no receipts behind a
    price.

### Admin Web

- Admin overview in `web/src/dashboard/dashboard-pages.tsx`
  - No pending receipts: show "Sem notas para revisar" plus "Ver como chegam notas".
  - No failed jobs: show "Sem falhas recentes" plus health explanation.
  - No low-trust offers: show "Sem ofertas críticas".
- Admin users in `web/src/dashboard/dashboard-pages.tsx`
  - User with no receipts/lists/locations: show support-safe next actions.
  - Billing disabled: explain that premium is admin-managed for MVP.
- Admin receipts in `web/src/dashboard/dashboard-pages.tsx`
  - Empty queue: show "Nenhuma nota pendente" and expected route from shopper receipt
    submission.
  - Receipt with no extracted items: show "Aguardando extração" or "Reprocessar".
  - Missing maker action: explain what action can be taken.
- Admin processing jobs in `web/src/dashboard/dashboard-pages.tsx`
  - Empty jobs: show "Nenhum job recente" and monitored queues.
  - Job actions disabled: explain status requirements for retry/cancel/review.

## Tooltip Inventory

### Required Shared Tooltips

- Icon-only buttons: sidebar trigger, theme toggle, location button, notifications,
  share, remove items, external-link buttons, refresh/reprocess buttons.
- Status badges: queue status, trust/confidence, freshness, reward status, city
  activation, receipt moderation, availability.
- Sensitive/technical terms: confidence score, freshness, reward pending, billing
  disabled, token balance, manual release, quarantine, moderation, CNPJ, NFC-e, EAN,
  technical IDs.
- Destructive/admin operations: reject receipt, delete product, delete variant,
  deactivate city/product, cancel job, revoke premium.
- Truncated labels: product variants, establishment names, user email, job/resource IDs.

### Implementation Notes

- Prefer a small design-system helper such as `InfoTooltip` or `WithTooltip` in
  `web/src/components/design-system/`.
- Use existing `web/src/components/ui/tooltip.tsx` primitives.
- Do not add tooltips to every text label. Use them where the action/status is compact,
  icon-only, operationally risky, or materially ambiguous.

## Monetary Privacy Inventory

### Public Web Monetary Values

- Home offers: price and "Economize" cards.
- Offer explorer/detail: offer price, regional average, alternative prices.
- Profile/list summary: accumulated estimated savings, tokens/free plan counters when
  treated as value, premium state.
- Checklist: expected total, expected item prices, paid total.
- Optimization result: estimated cost, savings, item prices, store totals, selected
  offer prices, price evidence, comparison math.
- Receipt submission: unit price and reward/token outcomes.

### Admin Monetary Values

- Admin overview: global estimated savings, offer prices, low-trust price diagnostics.
- Catalog/offers: base price, promotional price, effective price, historical/current
  offer prices.
- Receipt processing: extracted line item prices, suspicious price changes, reward
  status.
- User operations: token grants, premium status, billing disabled/payment diagnostics.
- List operations and queue detail: estimated cost, estimated savings, paid totals.

## Recommended Privacy Behavior

- Add a global monetary visibility preference in the web context with persistence in
  `localStorage`.
- Default to visible for now to avoid surprising current users, but make the toggle
  obvious in the sidebar/account area.
- Mask monetary values with a stable placeholder such as `R$ •••` while preserving
  layout width and tabular-number alignment.
- Keep non-sensitive counts visible unless they are explicitly value-adjacent in a user
  account context.
- Add tests ensuring hidden values are not rendered as text in public/profile/result and
  admin offer/receipt/list views.

## Dependencies

- T219 should happen before final action-placeholder polish because it removes existing
  dead actions.
- T220-T224 can proceed independently from tooltip/privacy work.
- The monetary privacy layer should be implemented before broad screenshot QA so
  screenshots can verify both visible and hidden modes.
