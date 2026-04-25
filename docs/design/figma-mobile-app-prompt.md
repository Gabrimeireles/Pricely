# Pricely Figma Design Prompt

Use this prompt in a Figma-capable design AI, Stitch, or similar UI generator.

```text
Role: You are a senior mobile product designer creating a production-ready Figma design system and app prototype for Pricely, a responsible grocery savings app.

Context:
Pricely helps users create grocery shopping lists and optimize them using real supermarket price evidence. The MVP cannot reliably parse online fiscal invoices automatically. It should support user-submitted receipts, manual/product evidence, supported cities, location-aware offers, and transparent confidence labels. The product must never show unknown prices or low-confidence matches as confirmed facts.

Primary user value:
Help shoppers save money on groceries while understanding the trade-off between convenience and maximum savings.

Core optimization modes:
1. Local: optimize the whole list inside the nearest or selected store.
2. Global unique: choose the best single store for the whole list, anywhere within supported city data.
3. Global full: choose the best offers item-by-item, independent of store, even if the user must visit multiple stores.

Visual direction:
- Style: fresh precision, responsible consumer utility, modern grocery intelligence.
- Mood: trustworthy, local, practical, bright, data-aware, not playful to the point of losing credibility.
- Avoid: generic grocery green-only palette, purple gradients, fintech dark navy, beige/cream/sand dominance, excessive glassmorphism, decorative blobs, and fake promotional hype.
- Color palette:
  - Primary teal: #0F766E
  - Data blue: #2563EB
  - Savings lime: #84CC16
  - Report/error coral: #F43F5E
  - Uncertainty amber: #F59E0B
  - Ink: #18221F
  - Muted text: #3F4D48 / #6B7A75
  - Surface: #F7FAF8 and #FFFFFF
  - Dark mode base: #071311
- Typography: native mobile type. Use SF Pro in Figma and annotate Android mapping to Roboto. Use tabular numbers for prices.
- Shape: 8px radius for buttons and cards. Use pill chips only for filters/status.
- Layout: mobile-first, touch-first, Material 3 compatible with iOS HIG respect.

Design system requirements:
- Create color variables for brand, semantic status, surfaces, text, and borders.
- Create typography styles for Display, Title, Body, Label, Caption, and Price.
- Create reusable components with variants:
  - Primary/secondary/destructive buttons
  - Text field/search field
  - City selector
  - Bottom navigation
  - Product offer card
  - Store card
  - Savings summary card
  - Optimization mode segmented control
  - Confidence/status badge
  - Receipt upload card
  - Report promotion dialog/bottom sheet
  - Empty, loading, error, offline, and stale-data states

Mobile screens to design:
1. Onboarding
   - Communicate the promise: save on groceries with transparent price evidence.
   - Ask for city or location permission without blocking manual city selection.
   - Explain that supported cities determine available offers.

2. Login / account creation
   - Email/social login options.
   - Minimal friction.
   - Explain why account is useful: savings history, lists, receipt contribution, profile metrics.

3. Home dashboard
   - Current supported city and location status at top.
   - Products in destaque.
   - Cheapest products today.
   - Local promotions near the user.
   - Clear data freshness labels such as "Atualizado hoje", "Dados parciais", or "Pouca confiança".
   - CTA to create a shopping list.

4. Shopping list builder
   - Add grocery items quickly.
   - Support quantity/unit.
   - Show unresolved or partially matched items.
   - Let user choose optimization mode: Local, Global unique, Global full.
   - Keep primary "Optimize list" action in thumb zone.

5. Store/city selection
   - Supported city selector.
   - Nearby stores list when location is allowed.
   - Fallback manual selection.
   - Unsupported city state with waitlist/contribution CTA.

6. Optimization result: Local
   - One selected/nearest store.
   - Total estimated cost.
   - Missing items shown clearly.
   - Savings versus non-optimized or alternative known store when available.
   - Confidence labels and source traceability.

7. Optimization result: Global unique
   - Best single store highlighted.
   - Explain why it was chosen.
   - Show coverage and missing items.
   - Compare against Global full savings difference.

8. Optimization result: Global full
   - Best item-by-item offers across stores.
   - Store breakdown and number of stops.
   - Savings highlight.
   - Convenience warning if many stores are involved.

9. Receipt upload / contribution
   - Upload image/PDF or enter receipt manually.
   - Status stages: uploaded, queued, reading, sanitizing, ready for review, failed.
   - Make clear that user submissions improve local data.

10. Product sanitization review
   - Show raw receipt/product name.
   - Show suggested clean product name.
   - Show confidence and allow correction.
   - Do not present AI suggestions as confirmed without user or rule confidence.

11. Report "not on promotion"
   - Available from every offer card.
   - Bottom sheet or dialog with reason choices:
     - price changed
     - product unavailable
     - store does not honor promotion
     - wrong product match
   - Confirmation state and undo/snackbar.

12. Profile / value dashboard
   - Total saved using Pricely.
   - Number of lists optimized.
   - Receipts contributed.
   - Most saved categories.
   - Supported city and location settings.
   - Account/security/settings.

Interaction and accessibility requirements:
- Minimum touch target: 44pt iOS / 48dp Android.
- Body text 16-17pt/sp minimum.
- Do not rely on color alone for status.
- Include dark mode variants.
- Include loading, empty, offline, stale-data, and partial-result states.
- Use haptics/micro-interactions only for meaningful feedback: optimization complete, report submitted, upload complete.
- Respect reduced motion.

Content voice:
Use concise Brazilian Portuguese product copy. Avoid technical explanations. Be transparent about uncertainty.
Examples:
- "Economia estimada"
- "Dados confirmados"
- "Alguns itens precisam de revisão"
- "Essa cidade ainda não está coberta"
- "Promoção reportada"
- "Melhor preço confirmado"

Output:
Create a Figma-ready mobile design system and high-fidelity prototype frames for the screens above. Include both light and dark mode tokens, component variants, and annotations for developer handoff in Flutter Stacked with Dart.
```

## Short Iteration Prompt

Use this after the first design is generated:

```text
Refine the Pricely mobile app design to make price confidence, data freshness, supported city status, and savings proof more visually explicit. Preserve the existing visual system. Improve thumb-zone placement, reduce cognitive load on optimization result screens, and add missing empty/offline/stale-data states. Keep all touch targets accessible and avoid decorative visual noise.
```

