# Pricely System Summary for Stitch

Pricely is a grocery price optimization platform for Brazilian shoppers.

The product helps a user:
- choose a supported city;
- optionally save precise location or CEP fallback;
- create reusable grocery lists with generic products and variant intent;
- optimize the list by city or by local radius;
- inspect why each item was selected;
- shop with a checklist;
- report when an in-store price does not match the app;
- submit NFC-e/receipt data;
- earn points and optimization credits only after receipt data is trusted and processed.

Admin users:
- manage cities, establishments, catalog products, variants, offers and users;
- review receipt-processing queues manually before automatic processing is enabled;
- inspect extracted receipt payloads, item matching, missing-product maker actions and price changes;
- monitor stale offers, low-trust offers, failed jobs, quarantined receipts, catalog image gaps and city coverage issues;
- manually activate premium and add optimization credits while billing remains disabled.

Current MVP decisions:
- billing is disabled for now;
- premium can be granted by admin only;
- receipt processing is manual by default;
- automatic receipt processing is future mode;
- local optimization only promises distance when user has explicit saved coordinates;
- CEP fallback keeps city context but must not claim proximity;
- default local radius is 5 km;
- web/admin/backend are the current priority;
- mobile will be refactored after the web/admin operating flow is solid.

Core routes to cover:
- `/`
- `/ofertas`
- `/ofertas/:offerId`
- `/cidades`
- `/listas`
- `/listas/:listId`
- `/listas/:listId/checklist`
- `/otimizacao/:listId`
- `/notas`
- `/entrar`
- `/criar-conta`
- `/dashboard`
- `/dashboard/regioes`
- `/dashboard/estabelecimentos`
- `/dashboard/produtos`
- `/dashboard/ofertas`
- `/dashboard/listas`
- `/dashboard/usuarios`
- `/dashboard/notas`
- `/dashboard/fila`
- `/dashboard/fila/:jobId`

Global UX direction:
- app workspace first, marketing second;
- compact, operational, data-rich UI;
- no oversized landing-page hero inside logged-in flows;
- no decorative orbs, bokeh or generic SaaS gradients;
- cards only for repeated objects, modals and framed tools;
- no nested cards;
- 8px radius for cards and controls;
- icon buttons for repeated actions;
- visible focus, touch targets at least 44px on mobile;
- text must fit in every viewport;
- prices use tabular numbers;
- actions should stay close to the user workflow, using sticky action bars where useful.

Visual identity:
- official icon: `web/src/assets/pricely-icon.png`;
- primary teal/emerald;
- lime for positive/success;
- amber for warning/pending;
- coral/red for critical/failure;
- neutral surfaces with calm contrast;
- restrained professional grocery SaaS, not flyer/retail-chaotic.

