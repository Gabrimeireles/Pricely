# Stitch Prompt: List Editor

Create the `/listas/:listId` and `/listas/nova` web screen.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
The shopper must add products quickly and decide whether each product accepts any variant or is fixed to a variant.

Required sections:
- List metadata: name, city, location/radius preview.
- Product entry:
  - search input;
  - catalog suggestions;
  - quantity controls;
  - unit selector;
  - variant intent segmented control:
    - "Qualquer variante"
    - "Marca/variante especifica"
  - selected variant preview if fixed.
- Current list item rows:
  - product name;
  - quantity;
  - variant intent;
  - selected optimized variant if one exists from last optimization;
  - image thumbnail;
  - edit/remove icon actions.
- Sticky action bar:
  - Salvar lista;
  - Salvar e otimizar;
  - Abrir checklist if saved.

Important behavior copy:
- If original intent is "Qualquer variante", optimization can replace the chosen variant in future runs.
- If user locks a variant, optimization should respect it.

Visual constraints:
- High density but not cramped.
- No nested cards.
- Mobile bottom sticky actions.

