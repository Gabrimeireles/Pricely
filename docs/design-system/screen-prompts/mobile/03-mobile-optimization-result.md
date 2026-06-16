# Prompt: Mobile Optimization Result

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely mobile optimization result.

Viewport:
- Native mobile viewport, 390px wide.
- Flutter implementation target.

Scenario:
- Total estimated cost: R$ 142,80.
- Estimated savings: R$ 18,40.
- Mode: menor preco perto de mim.
- Local radius: 5 km.
- Store plan includes two stores.
- First item has trust score 82/100 and 4 accepted receipts.
- One item unavailable.

Screen goal:
Show the optimized plan and evidence in a compact mobile-native format.

Required content:
- Summary top block with total, savings, mode, coverage.
- Local radius/coverage note.
- Store plan cards.
- Item cards with selected variant, quantity, price, distance.
- Evidence block: Confianca da oferta, source, trust score, receipt count, freshness.
- Unavailable item section.
- Sticky CTA: abrir checklist.
- Secondary action: recalcular.

Required states:
- queued/running
- stale result
- low confidence
- no local coverage
- failed optimization

Visual rules:
- Avoid long paragraph evidence.
- Use compact chips and rows.
- Distance only when available.
- Prices use tabular numbers.

Implementation notes:
Map likely components to:
- mobile/lib/features/optimization/presentation/multi_market_result_screen.dart
- mobile/lib/features/optimization/domain/optimization_result.dart
```

