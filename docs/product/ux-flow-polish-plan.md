# UX Flow Polish Plan

## Context

Post-release audit found the product functionally stable but still carrying UX and UI
friction across public web, admin web, and mobile surfaces.

The next delivery unit focuses on:

- fixing PT-BR copy and encoding regressions
- reducing cognitive load in list creation and optimization
- strengthening dashboard readability and visual hierarchy
- consolidating duplicated mobile flows
- improving shopping-mode and offer-detail clarity

## Delivery Goals

1. Keep all validated backend behavior intact.
2. Improve readability and confidence without widening product scope.
3. Preserve the city-first, account-shared, optimization-backed product model.
4. Bring web and mobile closer to the Stitch intent already captured in the repo.

## Scope

### Public Web

- fix broken PT-BR strings and encoding artifacts
- strengthen landing hierarchy with concrete product workflow proof
- keep city selector count-aware and more explicit
- make list creation feel staged instead of overloaded
- clarify optimization mode trade-offs before processing
- improve checklist and product-detail readability

### Admin Web

- strengthen KPI hierarchy
- group operational content more clearly
- make dashboard overview more visual and less table-first
- reduce ambiguity in region, establishment, product, and offer management flows

### Mobile

- remove drift between home/list/result surfaces
- keep one active list flow instead of parallel patterns
- make brand preference configuration clearer
- improve offer-detail, checklist, and optimization readability

## Non-Goals

- no backend domain expansion
- no new optimization strategy
- no new public business capability

## Validation Standard

- backend test suite remains green
- web test suite remains green
- mobile analyze, test, and debug build remain green
- docker compose stack continues to boot correctly
- key user flows remain smoke-tested after the polish
