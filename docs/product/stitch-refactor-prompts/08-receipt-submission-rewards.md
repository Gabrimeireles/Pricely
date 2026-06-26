# Stitch Prompt: Receipt Submission and Rewards

Create the `/notas` public receipt submission screen.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
A shopper submits an NFC-e URL/QR code/manual MVP item entry and sees the manual-processing queue and reward status clearly.

Required sections:
- Submission form:
  - QR code or NFC-e URL field;
  - access key field if useful;
  - establishment;
  - purchase date;
  - CNPJ;
  - manual MVP item row with product, quantity, price;
  - submit action.
- Status timeline:
  - Nota recebida;
  - Aguardando liberacao manual;
  - Em processamento;
  - Qualidade validada;
  - Reward concedido.
- Reward module:
  - pending points/optimization credit only when eligible;
  - granted points/credit after processing;
  - no reward promise for duplicate, rejected, suspicious, low-confidence.
- History list:
  - receipt submitted date;
  - store;
  - processing status;
  - reward status;
  - action to view details when available.

Important copy:
- "Reward em processamento" for pending eligible.
- "Reward validado" for granted.
- "Sem reward por duplicidade ou dados insuficientes" for ineligible.
- Manual processing must feel intentional, not broken.

Visual constraints:
- Use timeline/status chips.
- Do not overpromise rewards before quality scoring.

