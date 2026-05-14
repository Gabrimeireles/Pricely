# Stitch Prompt: Optimization Result

Create the completed optimization result screen.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
The shopper must trust the recommendation and understand each item decision.

Required top summary:
- total estimated cost;
- total estimated savings;
- mode used;
- city;
- location/radius context;
- coverage status;
- primary actions: Abrir checklist, Reotimizar, Editar lista.

Required item decision module:
For each item show:
- original list item;
- selected variant;
- establishment;
- neighborhood;
- selected price;
- savings vs second cheapest eligible offer;
- city average as separate informational metric, not as savings comparison;
- source label: admin/manual/receipt;
- receipt evidence count;
- freshness/last validation;
- trust factor;
- trust explanation in shopper language;
- distance only when precise location exists;
- status: selected, unavailable, needs review.

Actions per item:
- Reportar preco errado;
- Enviar nota;
- Ver outras lojas.

Important copy:
- Avoid "0 notas fiscais confiaveis".
- Use "Ainda sem nota fiscal aceita apoiando este preco" when evidence count is zero.
- Do not expose raw decision codes.

Visual constraints:
- Evidence should be a compact module, not a giant table.
- Price typography must be tabular.
- Mobile should collapse each item into an expandable decision card.

