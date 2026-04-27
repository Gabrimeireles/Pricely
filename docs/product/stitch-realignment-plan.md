# Stitch Realignment Plan

## Objective

Realign web and mobile to the intended Stitch direction, replace temporary admin IA,
stop relying on mock product imagery, and make lists useful both for optimization and
for live shopping inside the supermarket.

## Product Decisions

### 1. Admin Overview

- Keep an overview screen, but make it more visual.
- Add charts for:
  - active users
  - shopping lists created
  - optimization runs over time
  - offers active vs stale
  - coverage by city
- Use stronger color separation for:
  - healthy
  - warning
  - stale/needs review

### 2. Regions vs Establishments

- Do not keep the mixed `Fila e regioes` screen as the primary management surface.
- Split into:
  - `Regioes`: city, state, activation status, active establishment count
  - `Estabelecimentos`: brand, unit, CNPJ, city, active state, region filter
- Queue health belongs with list operations and processing health, not mixed into region
  management.

### 3. Products

- Move away from generic-only products such as `Arroz 1kg`.
- Prefer specific products such as:
  - `Arroz Tipo 1 Camil Culinaria Italiana Pacote 1kg`
- Keep aliases because:
  - receipts are noisy
  - users may type generic names
  - sanitization still needs a canonical path
- Product should evolve toward:
  - slug
  - display name
  - category
  - default unit
  - brand
  - variant/type
  - package size
  - image
  - aliases

### 4. Offers

- `displayName` still makes sense:
  - it is the store-facing merchandising text
  - it may differ slightly from the canonical product name
- `packageLabel` still makes sense:
  - it disambiguates variants and packaging in the offer layer
  - it helps distinguish `500 g`, `1 kg`, `leve 3 pague 2`, etc.
- What must change:
  - show both fields in the admin offer list/detail
  - explain them in the UI
  - do not keep hidden fields with no visible meaning

### 5. Supported Cities

- Treat public regions as city-level operating areas.
- Show only active/activating cities to shoppers.
- Display `Cidade - quantidade de estabelecimentos ativos`.
- Show `0` when visible but still collecting coverage.
- Do not emphasize neighborhood coverage in public shopper views.

### 6. List Creation

- Default city should come from:
  1. saved user city
  2. optional location permission
  3. manual picker
- Do not ask for optimization mode during list creation.
- Users should be able to save a list as a normal shopping list with no optimization.

### 7. List Experience

- Replace text-only rows with richer item cards.
- Each item should support:
  - image
  - product name
  - brand/package context
  - quantity
  - notes
  - purchased toggle
- Add a dedicated in-store checklist mode for web and mobile.

### 8. Product Search in Lists

- Item entry should search real catalog products.
- Users should be able to:
  - search
  - select a generic comparable product first
  - optionally open a brand/variant choice step after that
  - still use generic text when no exact match exists
- Optimization should prefer real selected catalog products over loose text.

### 8a. Brand Preference Model

- Do not force brand choice at the start of item creation.
- Support:
  - `Qualquer marca`
  - `Preferir marcas selecionadas`
  - `Somente esta marca/variante`
- This keeps list building fast while preserving exact-brand behavior for shoppers who
  care about it.
- Optimization and UI should both reflect which rule was chosen for each item.

### 9. Images

- Stop using mock product images in product and list contexts.
- Real catalog images should appear in:
  - product cards
  - offer cards
  - product detail
  - list rows
  - admin products
  - admin offers when useful

## Screen Restructure

### Public Web

- Landing
- Ofertas por cidade
- Detalhe do produto/oferta
- Cidades suportadas
- Entrar / Criar conta
- Minhas listas
- Editar lista
- Resultado da otimizacao
- Modo compra / checklist

### Admin Web

- Visao geral
- Regioes
- Estabelecimentos
- Produtos
- Ofertas
- Operacoes de listas
- Fila e saude

### Mobile

- Inicio
- Ofertas
- Listas
- Checklist de compra
- Recibos/contribuicoes
- Perfil

## Implementation Order

1. Evolve product + offer model for images and specificity.
2. Add catalog-backed product search and purchased-state persistence.
3. Rebuild public city selectors and supported-cities views.
4. Rebuild web list and optimization flows.
5. Split and redesign admin IA.
6. Rebuild mobile to the same interaction model.
