# Prompt: Public Web Optimization Result

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely public web optimization result.

Viewport:
- Desktop web, 1440px wide.
- Include responsive notes for mobile stacked cards.

Scenario:
- List: "Compra da semana".
- Mode: menor preco perto de mim.
- Total estimated cost: R$ 142,80.
- Estimated savings: R$ 18,40 versus next eligible alternatives.
- Coverage: partial, 10 of 12 items matched.
- Local coverage: 8 stores inside 5 km.
- Two store stops.
- One unavailable item.

Required selected item evidence:
- Product: Arroz tipo 1
- Requested rule: qualquer variante
- Selected variant: Camil Arroz tipo 1 1kg
- Store: Mercado Centro, Centro
- Price: R$ 7,90
- Source: Recibo de usuario
- Trust: 82/100, alta
- Evidence: 4 notas fiscais aceitas
- Freshness: validado ha 3d
- Confidence notice: preco observado em recibo recente

Screen goal:
Explain the recommendation without overwhelming the shopper.

Required content:
- Result summary with total, savings, coverage, stores.
- Mode and local coverage context.
- Store plan cards.
- Item-level price rows.
- Evidence module for each selected item.
- Unavailable items section.
- Actions: abrir checklist, reportar preco, enviar nota, recalcular.

Required states:
- queued/running result
- stale result
- low-confidence item
- no local coverage
- failed optimization

Visual rules:
- Do not show naked prices without source/freshness/trust.
- Separate requested brand rule from selected variant.
- Use "Confianca da oferta".
- Use tabular numbers.

Implementation notes:
Map likely components to:
- web/src/public/public-pages.tsx
- web/src/app/types.ts
- web/e2e/mvp-smoke.spec.ts
```

