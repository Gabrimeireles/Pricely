# Stitch Prompt: Admin Catalog, Offers and Establishments

Create admin screens for `/dashboard/produtos`, `/dashboard/ofertas`, `/dashboard/estabelecimentos` and `/dashboard/regioes`.

Use `00-system-summary.md` and `00-design-system.md`.

Catalog requirements:
- product list with image, name, category, variant count, alias count, offer count;
- search/filter;
- dedicated variant management view/tab;
- variants searchable/collapsible;
- variant image visible;
- edit/add variant actions.

Offers requirements:
- show variant image first;
- store, city, price, base/promotional price, availability;
- source type;
- trust factor;
- receipt evidence count;
- freshness;
- stale/low-confidence flags.

Establishments requirements:
- unit name, city, neighborhood, address, CEP, CNPJ;
- latitude/longitude status;
- active/inactive;
- offer count and receipt count;
- coverage radius readiness.

Regions requirements:
- live, activating, collecting-data, inactive statuses;
- active store count;
- offer coverage;
- city inclusion requests.

Visual constraints:
- Admin data tables, but readable.
- Images improve scanning.
- Hide long IDs behind details.

