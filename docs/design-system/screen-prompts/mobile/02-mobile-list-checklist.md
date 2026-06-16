# Prompt: Mobile List And Checklist

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely mobile list/checklist screen.

Viewport:
- Native mobile viewport, 390px wide.
- Flutter implementation target.

Scenario:
- List: "Compra da semana".
- 12 items.
- User is in shopping mode.
- Items are grouped by store after optimization.
- Some items are pending, some purchased.
- One item has a price mismatch report.

Screen goal:
Let the shopper use the phone in-store with minimum friction.

Required content:
- Compact list and city context.
- Store group header.
- Item cards with purchased checkbox/toggle.
- Selected variant, expected price, source/confidence chip.
- Price mismatch/report action.
- Completion progress.
- Sticky bottom CTA: concluir compra.
- Optional paid total field when completed.

Required states:
- list not optimized
- all purchased
- save failure
- price mismatch form open
- no network

Visual rules:
- No desktop table.
- Stable row/card dimensions.
- One-handed use.
- Use status color plus text/icon.

Implementation notes:
Map likely components to:
- mobile/lib/features/shopping_lists/presentation/shopping_list_screen.dart
- mobile/lib/features/home/presentation/mobile_home_screen.dart
```

