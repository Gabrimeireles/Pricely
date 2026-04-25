# Mobile Product UX Requirements Checklist: Grocery Shopping Optimizer

**Purpose**: Validate requirements quality for the mobile product additions before planning or implementation.
**Created**: 2026-04-15
**Feature**: `specs/001-grocery-optimizer/spec.md` plus `docs/product/mobile-mvp-spec-addendum.md`

## Requirement Completeness

- [ ] CHK001 Are login/account requirements defined with clear user value and account-dependent features? [Gap]
- [ ] CHK002 Are supported city requirements specified for manual selection, location permission, and unsupported-city states? [Completeness, Gap]
- [ ] CHK003 Are dashboard content requirements defined for featured products, cheapest products today, local promotions, freshness, and city context? [Completeness, Gap]
- [ ] CHK004 Are user receipt upload and manual contribution requirements separated from automated online fiscal invoice parsing? [Clarity, Gap]
- [ ] CHK005 Are profile value metrics specified, including savings, lists created, optimized lists, and receipts contributed? [Completeness, Gap]
- [ ] CHK006 Are invalid-promotion report requirements specified for offer cards and result views? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK007 Are the three optimization modes named consistently as Local, Global unique, and Global full across product, UI, and API requirements? [Consistency, Ambiguity]
- [ ] CHK008 Is "products in destaque" defined with selection criteria such as freshness, savings potential, store coverage, or editorial/admin curation? [Clarity, Gap]
- [ ] CHK009 Is "cheapest today" quantified by city, source freshness, product category, and confirmed price evidence? [Clarity, Gap]
- [ ] CHK010 Is "supported city" defined with required store coverage or minimum data threshold before promotion surfaces are enabled? [Clarity, Gap]

## Scenario Coverage

- [ ] CHK011 Are first-use flows defined for login, city selection, location denial, and unsupported city fallback? [Coverage, Gap]
- [ ] CHK012 Are receipt upload states defined for queued, reading, sanitizing, ready for review, partial, and failed outcomes? [Coverage, Gap]
- [ ] CHK013 Are product sanitization review scenarios defined for confirmed, likely, partial, unresolved, and user-corrected matches? [Coverage, Gap]
- [ ] CHK014 Are stale-data and expired-promotion scenarios defined for dashboard offers and optimization results? [Edge Case, Gap]
- [ ] CHK015 Are offline or poor-network scenarios defined for draft lists, cached results, receipt uploads, and reporting actions? [Coverage, Gap]

## Non-Functional Requirements

- [ ] CHK016 Are accessibility requirements specified for mobile touch targets, font scaling, contrast, status labels, and non-color indicators? [Coverage, Gap]
- [ ] CHK017 Are performance requirements defined for list creation, dashboard loading, receipt status updates, and optimization result rendering? [Clarity, Gap]
- [ ] CHK018 Are privacy requirements defined for location data, uploaded receipts, account data, and savings history? [Completeness, Gap]
- [ ] CHK019 Are observability requirements defined for report submissions, receipt processing, product match corrections, and city coverage gaps? [Completeness, Gap]

## Dependencies & Assumptions

- [ ] CHK020 Are assumptions documented for what data sources are available in MVP versus post-MVP AI/scraping/flyer ingestion? [Assumption]
- [ ] CHK021 Are LLM-assisted product matching requirements bounded by evidence, confidence, and review gates? [Clarity, Gap]
- [ ] CHK022 Are admin/review dependencies defined for reported offers and low-confidence product matches? [Dependency, Gap]

