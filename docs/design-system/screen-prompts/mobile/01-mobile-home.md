# Prompt: Mobile Home

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely mobile app home.

Viewport:
- Native mobile viewport, 390px wide.
- Flutter implementation target.

Scenario:
- User is signed in.
- City: Sao Paulo, SP.
- Localizacao salva.
- Coverage preview: 8 stores inside 5 km.
- Active list: "Compra da semana", 12 items.
- Latest savings: R$ 18,40.
- Receipt: waiting manual release.

Screen goal:
Make the home screen a next-action hub for shopping, not a marketing page.

Required content:
- Top account/city summary.
- Compact local coverage preview.
- Next action card.
- Active list continuation.
- Latest optimization/savings summary.
- Receipt status summary.
- Bottom navigation.
- Primary thumb-zone CTA.

Required states:
- location denied
- no city selected
- no active list
- receipt processing
- offline/backend error

Visual rules:
- Use mobile-native spacing and touch targets.
- Avoid long prose blocks.
- Use structured evidence/status chips.
- Keep text inside containers at 390px.

Implementation notes:
Map likely components to:
- mobile/lib/features/home/presentation/mobile_home_screen.dart
- mobile/lib/core/widgets/app_scaffold.dart
```

