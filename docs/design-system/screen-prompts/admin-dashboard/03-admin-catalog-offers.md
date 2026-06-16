# Prompt: Admin Catalog And Offers

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely admin catalog and offers management.

Viewport:
- Desktop admin, 1440px wide.
- Include responsive notes.

Scenario:
- Catalog has products with variants.
- Some products are missing images.
- Some variants have stale or low-trust offers.
- Offers include receipt-derived and admin-seeded sources.

Screen goal:
Make product, variant, and offer quality easy to inspect and fix.

Required content:
- Admin sidebar.
- Product search/filter.
- Product list with image status, variant count, active offer count.
- Variant detail panel/tab.
- Offer rows with store, price, source, trust, freshness.
- Quality flags: missing image, stale offer, low confidence.
- Actions: edit product, add variant, add offer, review offer.
- Technical metadata hidden behind disclosure.

Required states:
- empty catalog
- no variants
- long variant list
- stale offer warning
- low-trust offer warning
- save validation error

Visual rules:
- Do not show raw IDs as primary labels.
- Variant images visible where available.
- Long lists searchable/collapsible.
- Tables collapse to cards on small widths.

Implementation notes:
Map likely components to:
- web/src/dashboard/dashboard-pages.tsx
- web/src/app/api.ts
```

