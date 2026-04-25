# Pricely AI and Data Roadmap

## Principle

AI should improve data ingestion and product matching, but it must not replace evidence. Pricely should use LLMs as assistive components around receipt parsing, product sanitization, flyer reading, and supermarket data enrichment with confidence gates and human correction paths.

## MVP Data Sources

- User-submitted receipts.
- Manual receipt entry.
- Admin-curated store offers.
- Historical product matches and aliases.
- Supported city and store registry.

## Post-MVP AI Opportunities

### 1. Receipt OCR and Product Sanitization

Use OCR to extract receipt lines and an LLM or smaller classification model to propose:

- canonical product name,
- brand,
- pack size,
- unit,
- category,
- likely equivalence group.

Guardrails:

- Never auto-confirm low-confidence matches.
- Keep raw receipt text attached to every proposed match.
- Store model confidence and deterministic match confidence separately.
- Provide user/admin correction UI.

### 2. Promotion Clustering

Cluster offers that likely refer to the same product across different stores and sources.

Useful inputs:

- normalized product name,
- brand,
- size,
- category,
- historical aliases,
- embedding similarity,
- price/unit similarity.

Guardrails:

- Price comparison must normalize unit/pack size.
- Similar names are not enough for equivalence.
- Promotions require freshness and source timestamp.

### 3. Flyer/Pamphlet Reading

Use image extraction and vision models to parse supermarket flyers.

Pipeline:

1. Detect flyer regions and offer cards.
2. Extract product name, price, validity date, store, and unit.
3. Normalize product data.
4. Mark as promotional source with validity window.
5. Route uncertain data to review.

### 4. Supermarket Site Scraping

Use scraping only where legally and technically appropriate.

Pipeline:

1. Acquire page data.
2. Parse product/offers.
3. Validate price, unit, store, timestamp.
4. Deduplicate against existing offers.
5. Flag stale or changed offers.

Guardrails:

- Respect robots, terms, and rate limits.
- Do not rely on scraping as the only source of truth.
- Store source URL and observed timestamp.

### 5. LLM-Assisted Review

Use LLMs to help admins or users understand conflicts:

- "These two items might be the same because..."
- "This price is suspicious compared to recent history."
- "This product line is missing unit information."

The UI must clearly label these as suggestions.

## Agent/Tool Design Notes

Keep AI tools small and workflow-oriented:

- `suggestProductNormalization(rawLine, context)`
- `clusterOfferCandidates(product, city, storeScope)`
- `extractFlyerOffers(imageBatch, storeContext)`
- `explainOptimizationTradeoff(result)`

Each tool should return:

- suggestion,
- confidence,
- evidence used,
- missing fields,
- recommended review action.

Avoid a single opaque "AI optimize everything" tool.

