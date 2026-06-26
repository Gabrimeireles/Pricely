# Stitch Prompt: Offers, Offer Detail and Cities

Create a connected set of public web screens for `/ofertas`, `/ofertas/:offerId` and `/cidades`.

Use `00-system-summary.md` and `00-design-system.md`.

Offers explorer requirements:
- Group by product/variant, not duplicate product cards.
- Cheapest eligible establishment first.
- Establishment filter.
- City selector.
- Store alternatives disclosure: "ver outras lojas".
- Show variant image, price, store, trust, freshness and source.
- Empty states for city in activation and collecting data.

Offer detail requirements:
- Product image and selected variant;
- best price;
- city average as information;
- alternative establishments list;
- trust/evidence module;
- last validation;
- availability;
- CTA to add to list.

Cities screen requirements:
- supported cities grouped by live, activating, collecting data;
- active stores count;
- request city inclusion/contact form;
- placeholder for cities without active establishments;
- clear message when no offers are available yet.

Visual constraints:
- Dense marketplace explorer, not ecommerce product page.
- No repeated duplicate cards for same product.
- Strong filters but compact.

