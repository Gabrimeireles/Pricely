# Design System: Pricely MVP UX Refactor

**Web/Admin Desktop Project ID:** `8872616086150863294`

**Mobile Project ID:** `1457528815500978003`

**Deprecated mixed Project ID:** `6992023142009606802`

Use the web/admin desktop project for screens `01` through `14`.

Use the mobile project for screens `15` through `18`.

## 1. Visual Theme & Atmosphere

Pricely should feel like a reliable grocery operations workspace: compact, local, pragmatic and evidence-first.

The interface is not a supermarket flyer, not a generic SaaS landing page and not a decorative consumer app. It is a calm operational tool for shoppers and admins who need to scan prices, trust evidence, finish shopping tasks and act quickly.

The visual atmosphere is:

- **Operational:** first viewport should expose current task, city/location context and next action.
- **Evidence-driven:** prices, trust factor, receipt evidence and freshness are visible where decisions are made.
- **Warm but restrained:** grocery context appears through product thumbnails, local city/store language and useful status colors, not decorative illustrations.
- **Dense but breathable:** layouts should fit real workflows without hiding important state behind marketing copy.

## 2. Color Palette & Roles

- **Deep Pricely Teal `#0F766E`:** primary actions, active navigation, saved precise location, trusted/evidence-ready states.
- **Dark Teal `#115E59`:** hover/pressed primary action, high-emphasis text accents.
- **Soft Teal Surface `#E6F4F1`:** subtle selected backgrounds, trusted evidence panels, location-ready highlights.
- **Lime Success `#84CC16`:** savings, completed checklist, reward granted, healthy coverage.
- **Soft Lime `#ECFCCB`:** success background for validated rewards and completed states.
- **Amber Warning `#F59E0B`:** pending processing, activation, CEP fallback, stale offers, permission denied.
- **Soft Amber `#FEF3C7`:** warning/pending backgrounds.
- **Coral Critical `#F9735B`:** failed jobs, rejected receipts, price mismatch, destructive warnings.
- **Soft Coral `#FFE4DE`:** critical background.
- **Neutral Base `#F8FAF9`:** page background.
- **White Surface `#FFFFFF`:** cards, forms, tables and repeated object containers.
- **Muted Surface `#EEF4F1`:** section bands, grouped rows and subtle contrast panels.
- **Readable Text `#17211F`:** primary text.
- **Muted Text `#64716D`:** secondary descriptions, helper copy and metadata.
- **Soft Border `#D7E2DE`:** low-emphasis container borders.

Avoid dominant purple, purple-blue gradients, beige/brown-heavy palettes and highly saturated retail-sale red.

## 3. Typography Rules

Use a clear sans-serif system optimized for dense operational reading.

- **Headings:** semibold, compact, direct. Avoid oversized hero typography inside app workflows.
- **Body:** 16px minimum on mobile, clear line-height, no negative letter spacing.
- **Labels:** compact but legible; use uppercase sparingly for metadata labels.
- **Prices and numeric metrics:** tabular numeric treatment; prices must align visually in rows and cards.
- **Long text:** break into short operational copy. Do not use instructional paragraphs inside core workflow screens unless they prevent a real user mistake.

## 4. Component Styling

### App Shell

- Persistent top shell with Pricely icon and primary navigation.
- Public shell includes a compact city/location/radius context strip.
- Admin shell uses a sidebar with route groups and an action-first header.
- Mobile shell uses bottom navigation and a compact top context summary.

### City / Location / Radius Strip

This is a core system component and must appear across shopper flows.

It supports these states:

- **City-only:** city selected, no distance claim.
- **Precise coordinates:** distance-aware local optimization allowed; show default 5 km radius.
- **CEP fallback:** city context available, but explicitly no proximity claim.
- **Permission denied:** explain fallback action.
- **Unsupported geolocation:** show manual/CEP fallback.

Never claim "nearby", "within radius" or show distance unless precise coordinates are saved.

### Cards

- Use cards for repeated objects: shopping lists, offers, receipt submissions, admin jobs, users, products.
- Radius: 8px.
- Do not put cards inside cards.
- Cards should have clear title, key status, one primary action and icon actions for secondary operations.
- Product/offer cards should include image thumbnails when available.

### Action Lanes

Use action lanes to express workflow progression:

`Create list -> Optimize -> Shop checklist -> Submit receipt`

Each step should show:

- status;
- next action;
- disabled reason if blocked;
- concise helper copy.

### Buttons

- Primary button: teal background, white text.
- Secondary button: neutral/white surface with soft border.
- Destructive button: coral semantics only when the action is destructive.
- Icon-only buttons require accessible label/tooltip.
- Repeated actions should use icons when familiar: edit, delete, open, copy, upload, scan, filter.

### Tables

Use tables for admin operations.

Rules:

- human-readable owner/list/store/status appears before technical IDs;
- raw IDs are hidden behind detail/copy affordances;
- rows include status chips and icon actions;
- large admin tables must support search/filter states.

### Evidence Modules

Evidence modules appear in optimization results, offer detail and admin decision traces.

Required data when available:

- trust factor;
- source type: admin/manual/receipt;
- receipt evidence count;
- freshness/last validation;
- confidence notice;
- selected variant;
- second-cheapest eligible comparison;
- city average as separate information;
- distance only with precise saved coordinates.

Use shopper language. Do not expose raw decision codes.

### Sticky Action Bars

Use sticky action bars for:

- list editor save/optimize;
- optimization result checklist/reoptimize;
- checklist completion and optional paid total;
- mobile primary actions.

Sticky actions must not obscure content.

### Empty States

Empty states must be specific:

- no city selected;
- city activating;
- city collecting data;
- no active establishments;
- no offers for selected filter;
- no receipt submissions;
- no pending admin tasks.

Avoid generic "nothing here" copy.

## 5. Flow Rules

### Public Shopper Flow

The main shopper path is:

1. Choose city and optional location.
2. Create reusable list.
3. Add generic products and variant intent.
4. Run optimization.
5. Review item decisions and trust evidence.
6. Shop with checklist.
7. Report wrong price if needed.
8. Conclude list with optional total paid.
9. Submit receipt.
10. Reward moves from pending to granted only after quality scoring.

### Optimization Modes

Use shopper-facing mode names:

- **Uma loja perto de mim:** single store inside local radius; requires precise coordinates.
- **Menor preco perto de mim:** item-by-item inside local radius; requires precise coordinates.
- **Menor total na cidade:** city-level item-by-item; no proximity claim.

Always show disabled reasons when local modes cannot run.

### Receipt Rewards

Receipt reward states:

- received;
- waiting manual release;
- processing;
- reward pending;
- reward granted;
- ineligible;
- disabled/review;
- rejected.

Never promise points or credits before quality scoring says the receipt is useful and eligible.

## 6. Responsive Behavior

### Desktop

- Use two or three columns when it improves scanning.
- Keep primary action near the current workflow.
- Admin screens can use dense tables.

### Mobile

- One primary action at a time.
- Bottom sticky primary action.
- Large touch targets of at least 44px.
- List rows become compact cards.
- Tables become stacked rows.
- No horizontal overflow.

## 7. Accessibility

- WCAG AA contrast.
- Focus states visible.
- No status by color alone.
- Form labels visible.
- Error messages near fields.
- Icon-only buttons have labels/tooltips.
- Avoid layout shift during loading.
- Respect reduced motion.

## 8. Do / Don't

### Do

- Keep screens task-first.
- Use real grocery product imagery when available.
- Show trust/evidence next to decisions.
- Keep local/distance claims precise.
- Use compact status chips.
- Use tabular prices.

### Don't

- Do not build marketing heroes for app workflows.
- Do not use decorative orbs or abstract blobs.
- Do not duplicate the same product as multiple offer cards when it should be grouped.
- Do not show raw IDs as primary UI.
- Do not say "0 notas fiscais confiaveis"; use "Ainda sem nota fiscal aceita apoiando este preco".
- Do not mention free-plan copy to premium users.
