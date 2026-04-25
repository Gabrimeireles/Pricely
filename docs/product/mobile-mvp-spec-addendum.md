# Pricely Mobile MVP Spec Addendum

This addendum captures the mobile product direction that is not fully represented in the original grocery optimizer spec.

## Product Positioning

Pricely is a local grocery savings app. It helps users plan what to buy, where to buy it, and how much they saved by using verified or confidence-labeled supermarket data.

The app must be honest about data quality. If a price, promotion, product match, or store availability is uncertain, the UI must show that uncertainty instead of hiding it.

## MVP Scope

### In Scope

- User login/account creation.
- Supported city selection.
- Optional device location permission for nearby stores and local promotions.
- Home dashboard with:
  - products in destaque,
  - cheapest products today,
  - nearby/local offers,
  - city and freshness status.
- Shopping list creation and editing.
- Three optimization modes:
  - Local: nearest or selected store.
  - Global unique: best one-store option.
  - Global full: best item-by-item offers across stores.
- User receipt upload or manual receipt contribution.
- Product parsing/sanitization review for low-confidence data.
- Profile value dashboard with:
  - total savings,
  - lists created,
  - optimized lists,
  - receipts contributed,
  - city/location settings.
- Report flow for offers that are no longer valid or are not promotions.

### Out of Scope for MVP

- Fully automated online fiscal invoice parsing.
- Full web scraping coverage for supermarket sites.
- Automated flyer/pamphlet recognition.
- LLM-only product matching without deterministic validation and confidence gates.
- Real-time stock guarantees.
- National coverage before supported city data is available.

## Core User Journeys

### 1. First Use

1. User opens Pricely.
2. App explains the value: save on groceries with transparent local price evidence.
3. User logs in or creates an account.
4. User selects a supported city or grants location.
5. App opens the dashboard with local offers and a CTA to create a list.

### 2. Create and Optimize a List

1. User creates a shopping list.
2. User adds products with optional quantity/unit.
3. App shows unresolved or partially matched items.
4. User chooses Local, Global unique, or Global full.
5. App returns a result with total cost, savings, stores, missing items, and confidence notices.

### 3. Contribute a Receipt

1. User uploads a receipt image/PDF or enters receipt data manually.
2. App shows status: uploaded, queued, reading, sanitizing, ready for review, or failed.
3. App asks for correction when product matches are uncertain.
4. Accepted data improves store offers and product normalization.

### 4. Report Invalid Offer

1. User opens an offer card.
2. User taps "Reportar promoção".
3. User selects a reason: price changed, unavailable, not honored, wrong match.
4. App marks the offer as reported and lowers trust until reviewed.

## Required Mobile Navigation

Use bottom navigation with four destinations:

- Home
- Lists
- Upload
- Profile

Use stack navigation inside each tab. Preserve tab state when switching tabs. Plan deep links for list results, offers, receipt upload status, and profile savings.

## Data Quality Rules

- A price can be shown as confirmed only when tied to trusted source evidence.
- Product matches must expose confidence: confirmed, likely, partial, unresolved.
- Low-confidence matches require review before they influence optimization as confirmed data.
- Stale data must be labeled with freshness age or a clear warning.
- User reports must affect offer trust and be visible to admin/review workflows.

## Supported Cities

The product must explicitly model supported cities. A user may:

- allow location access,
- manually choose a city,
- view unsupported city messaging,
- contribute receipts even if offer coverage is limited.

Location permission is optional. Manual city selection must always be available.

## Product Sanitization Strategy

Use a deterministic-first pipeline:

1. Normalize casing, accents, spacing, abbreviations, and punctuation.
2. Extract quantity, unit, pack size, and brand hints.
3. Compare against known aliases and historical product matches.
4. Score match confidence.
5. Route uncertain matches to user/admin review.
6. Store corrected matches as future training/evidence data.

LLMs may assist with suggestions, but LLM output must be treated as proposed evidence, not confirmed fact.

## Success Metrics

- Users can create and optimize a normal grocery list in under 2 minutes after login.
- 100% of displayed confirmed prices have source evidence.
- Users can tell which optimization mode they are using without explanation.
- Users can see their total saved amount from profile.
- Users can report an invalid promotion from any offer card in 2 taps plus reason selection.
- Unsupported city state is understandable and does not block account creation or receipt contribution.

