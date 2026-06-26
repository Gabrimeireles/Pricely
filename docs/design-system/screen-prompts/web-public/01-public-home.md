# Prompt: Public Web Home

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely public web home for a signed-in shopper.

Viewport:
- Desktop-first web screen, 1440px wide.
- Include responsive notes for tablet and mobile.

Scenario:
- User is signed in as a customer.
- Selected city: Sao Paulo, SP.
- Localizacao salva with 5 km coverage preview.
- Coverage preview: 8 active stores inside radius.
- User has one active list: "Compra da semana", 12 items.
- Latest optimization saved R$ 18,40.
- One receipt is waiting manual release.

Screen goal:
Make the first screen answer "what should I do next?" without becoming a marketing
landing page.

Required content:
- Public app shell/header with brand, city/location context, account state.
- Compact next-best-action strip.
- Active list continuation card.
- Local coverage preview.
- Offer preview section with 3 grouped offer cards.
- Receipt status card with "Aguardando liberacao manual".
- Savings summary using tabular numbers.
- Clear primary CTA: continue list or optimize.

Required states to include as small side annotations or variants:
- no selected city
- location permission denied
- no stores in radius
- backend loading skeleton

Visual rules:
- Functional app screen, not marketing hero.
- No oversized decorative hero.
- Use cards for repeated offers/list/receipt only.
- Keep city/location context compact.
- Use evidence/status badges with icon + text.

Implementation notes:
Map likely components to:
- web/src/public/public-pages.tsx
- web/src/public/public-shell.tsx
- web/src/components/ui/*
```

