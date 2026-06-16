# Prompt: Public Web List Editor

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely public web list editor.

Viewport:
- Desktop web, 1366px wide.
- Include mobile behavior notes for 390px width.

Scenario:
- User is signed in.
- City: Sao Paulo, SP.
- List title: "Compra da semana".
- Items:
  - Arroz tipo 1, quantity 2, any variant
  - Cafe torrado, quantity 1, preferred brand: Melitta
  - Leite integral, quantity 6, exact variant selected
- Catalog search is open with product suggestions.
- One item has partial match warning.

Screen goal:
Make adding grocery items and brand rules fast, clear, and ready for optimization.

Required content:
- Compact city/list context.
- List title field.
- Catalog-backed product search.
- Quantity/unit controls.
- Brand rule selector: qualquer variante, marcas preferidas, variante exata.
- Item cards with image/fallback, quantity, brand rule, match confidence.
- Inline validation near fields.
- Sticky action area on small screens.
- Primary CTA: salvar e otimizar.
- Secondary CTA: salvar rascunho.

Required states:
- empty list
- product search loading
- no catalog match
- partial match
- save failed

Visual rules:
- No wide dense table for shopper UI.
- Use stable item card dimensions.
- Keep primary action reachable.
- Use warning color only for partial/uncertain match.

Implementation notes:
Map likely components to:
- web/src/public/public-pages.tsx
- web/src/components/ui/input.tsx
- web/src/components/ui/select.tsx
- web/src/components/ui/card.tsx
```

