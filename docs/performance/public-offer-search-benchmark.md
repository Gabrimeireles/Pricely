# Public offer search benchmark

Date: 2026-06-25

## Goal

Measure the public offer text search before enabling PostgreSQL `pg_trgm`.
The production query searches six fields across offers, products, variants, and
establishments with case-insensitive `contains` filters.

## Dataset

- PostgreSQL 17
- 1 region
- 100 establishments
- 50,000 catalog products
- 50,000 variants
- 500,000 active offers
- Parallel query execution disabled for stable comparisons

The benchmark used `EXPLAIN (ANALYZE, BUFFERS)` against an isolated temporary
cluster. It did not use project or homolog data.

## Results

| Plan | Selective `cafe` | Common `produto` |
| --- | ---: | ---: |
| Relational `OR`, B-tree indexes | 844 ms | 476 ms |
| Relational `OR`, six trigram indexes | 814 ms | 468 ms |
| Candidate union, no trigram indexes | 281 ms | Not selected |
| Candidate union, six trigram indexes | 195 ms | 1,464 ms |

The six trigram indexes occupied 43 MB alongside a 124 MB offer table.

## Decision

Do not enable `pg_trgm` yet.

The original relational `OR` prevents PostgreSQL from using the trigram indexes,
so adding indexes alone provides no material improvement. A candidate-first
query is roughly 3x faster without an extension. Trigram indexes improve the
selective candidate query by another 30%, but make broad candidate expansion
expensive and require extension lifecycle support that the former `db push`
deployment did not provide.

The implemented strategy:

1. Queries candidate IDs concurrently from each searchable entity.
2. Uses indexed ID filters when every candidate set is at most 5,000 rows.
3. Falls back to the existing relational search for high-cardinality terms.
4. Preserves the existing response and URL contracts.

Versioned Prisma migrations are now available. If the runtime evaluation below
crosses its threshold, add the extension and indexes in a custom migration and
repeat this benchmark with production-like cardinality before enabling them.

## Runtime evaluation

Authenticated administrators can inspect `GET /admin/metrics/public-search`.
The backend keeps a rolling window of search samples and reports p50, p95,
fallback rate, and strategy counts.

The response recommends reevaluating `pg_trgm` only when both conditions hold:

1. At least `PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES` searches were recorded.
2. The rolling p95 exceeds `PUBLIC_SEARCH_P95_TARGET_MS`.

Defaults are 100 samples and 750 ms over a 500-sample window. A recommendation
is an investigation trigger, not permission to create indexes automatically.
The benchmark must be repeated before adding the extension migration.
