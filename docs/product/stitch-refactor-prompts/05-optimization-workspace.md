# Stitch Prompt: Optimization Workspace

Create the `/otimizacao/:listId` pre-run optimization workspace.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
The user chooses the optimization mode and understands requirements before running optimization.

Required sections:
- Summary of list: name, city, item count, location precision, radius.
- Mode cards in shopper language:
  - "Uma loja perto de mim"
    - single store inside local radius;
    - requires precise saved coordinates;
  - "Menor preco perto de mim"
    - item-by-item inside local radius;
    - requires precise saved coordinates;
  - "Menor total na cidade"
    - item-by-item by city;
    - does not claim proximity.
- Each mode shows:
  - eligibility status;
  - expected tradeoff;
  - required data;
  - why it may be disabled.
- Coverage preview:
  - active stores in city;
  - stores inside radius only when precise location exists;
  - CEP fallback explanation.
- Primary action: Rodar otimizacao.
- Secondary: Editar lista.

Important copy:
- "Raio padrao: 5 km"
- "Distancia so e calculada com coordenadas salvas"
- "CEP mantem contexto da cidade, mas nao promete proximidade"

Visual constraints:
- Cards can compare modes, but no nested cards.
- Disabled modes must be visually clear and actionable.

