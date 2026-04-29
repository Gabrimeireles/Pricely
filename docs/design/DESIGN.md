# Design System: Pricely

## 1. Visual Theme & Atmosphere

Pricely should feel like a responsible grocery savings companion: clear, practical, local, and financially useful without looking like a bank app. The visual language is **fresh precision**: bright enough for daily supermarket use, structured enough for price comparison, and calm enough to make trust and data quality feel explicit.

The app should avoid luxury, crypto, fintech darkness, and generic green-only grocery styling. It should feel modern and consumer-friendly, with a clean mobile-first layout, strong price hierarchy, and visible confidence/status signals for every recommendation.

## 2. Color Palette & Roles

| Token | Hex | Role |
| --- | --- | --- |
| `brand.teal` | `#0F766E` | Primary brand action, selected optimization mode, trusted recommendation |
| `brand.blue` | `#2563EB` | Location, supported city, data freshness, informational links |
| `brand.lime` | `#84CC16` | Savings highlights and positive deltas |
| `brand.coral` | `#F43F5E` | Report action, expired promotion warning, destructive confirmation |
| `brand.amber` | `#F59E0B` | Uncertain price, partial match, low confidence notice |
| `neutral.950` | `#18221F` | Primary text |
| `neutral.700` | `#3F4D48` | Secondary text |
| `neutral.500` | `#6B7A75` | Muted helper text |
| `neutral.100` | `#E7EFEC` | Dividers and subtle borders |
| `surface.base` | `#F7FAF8` | Main light background |
| `surface.raised` | `#FFFFFF` | Cards, sheets, forms, list rows |
| `surface.tint` | `#E8F7F3` | Soft selected/active background |
| `surface.dark` | `#071311` | OLED-aware dark mode background |

Rules:

- Savings are lime only when the app can prove the saving from known data.
- Amber is reserved for uncertainty, stale data, partial matches, or assumptions.
- Coral is reserved for user reports, expired promotions, destructive actions, and hard errors.
- Do not use color alone. Pair status color with icon, label, or badge text.

## 3. Typography Rules

Use platform-native typography for the Flutter app:

- iOS: SF Pro Text and SF Pro Display.
- Android: Roboto / Material 3 type scale.
- Figma: use SF Pro as the primary design font and annotate Android exports to map to Roboto.

Type hierarchy:

- Display: 32-34sp/pt, bold, used sparingly for dashboard savings and onboarding promise.
- Title: 22-24sp/pt, semibold, used for screen titles and result summaries.
- Body: 16-17sp/pt, regular, line height 1.45-1.6.
- Label: 13-14sp/pt, medium, used for chips, badges, tabs, and compact metadata.
- Price figures: tabular numbers where available.

Typography must support Dynamic Type/font scaling. Avoid fixed-height text containers.

## 4. Component Stylings

**Buttons:** Filled primary buttons use `brand.teal`, 48dp/pt minimum height, 8px corner radius, and clear pressed states. Secondary buttons use outline or tonal treatment. Report buttons use coral text or icon with confirmation when the action can affect offer trust.

**Cards/Containers:** Use white raised surfaces with 8px radius for repeated product, offer, store, and list cards. Avoid cards inside cards. Use section backgrounds only when grouping meaningfully, not as decoration.

**Inputs/Forms:** Search, city selector, grocery item entry, and receipt upload inputs should use filled or outlined Material-like fields with visible labels, helper text, and inline validation.

**Badges:** Use compact badges for `Confirmed`, `Fresh today`, `Partial match`, `Stale`, `Reported`, `Unsupported city`, and optimization mode labels.

**Price Rows:** Product rows should prioritize product name, unit/pack context, store, price, freshness, and confidence. Price must never appear without source or confidence context when used in optimization results.

**Result Summary:** Each optimization result must show:

- Total estimated cost
- Estimated savings
- Store count or selected store
- Coverage: complete or partial
- Data confidence notice
- Next action in thumb zone

## 5. Layout Principles

Mobile-first:

- Bottom navigation for 4 primary destinations: Home, Lists, Upload, Profile.
- Optimization mode choice appears as a segmented/toggle control, not hidden in settings.
- Primary actions live in the lower thumb zone.
- Long product lists use lazy lists with stable rows.
- Empty states must be instructional and actionable.

Recommended destinations:

- Home: local offers, cheapest today, featured stores/products, city context.
- Lists: shopping list creation, drafts, optimization history.
- Upload: receipt upload/manual receipt contribution and status.
- Profile: savings, lists created, contribution history, city, settings.

Dark mode:

- Use true or near-black surfaces for OLED efficiency.
- Avoid bright saturated cards on dark backgrounds.
- Keep chart/status colors accessible and desaturated enough for readability.

## 6. Motion & Micro-Interactions

Use motion to reinforce trust, not to distract:

- Price comparison changes can animate with a short count-up under 400ms.
- Savings confirmation can use a small haptic + check transition.
- Reported promotion state should visibly settle into `Reported` with clear undo/snackbar.
- Upload progress should use staged feedback: queued, reading, sanitizing, available for review.
- Respect reduced motion preferences.

## 7. Accessibility & Responsible UX

- Minimum touch targets: 44pt iOS, 48dp Android.
- Normal text contrast: at least 4.5:1.
- Use explicit labels for price confidence, data freshness, and promotion status.
- Do not imply real-time availability unless data is fresh and confirmed.
- Never represent LLM-inferred product links as confirmed without confidence labeling.
- Always give users a manual correction path for product matches and expired promotions.

