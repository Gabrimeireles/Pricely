# Research: Grocery Shopping Optimizer

## Decision 1: Replace MongoDB with PostgreSQL + Prisma

- **Decision**: Use PostgreSQL as the primary application database and Prisma as the
  relational data access and migration layer.
- **Rationale**: The replanned product now depends on explicit relationships between
  users, roles, regions, establishments, products, offers, shopping lists, historical
  optimization runs, and admin CRUD. PostgreSQL fits these constraints better than the
  previous semi-structured MongoDB design.
- **Alternatives considered**:
  - Continue with MongoDB: rejected because the product now depends on stronger
    relations, admin querying, and activation-state rules that are cleaner in SQL.
  - Use raw SQL without an ORM: rejected because Prisma provides schema readability,
    migration support, and a safer iteration path for the MVP team.

## Decision 2: Keep one shared account model with role-based access control

- **Decision**: Use a single `UserAccount` model across mobile and web, with server-side
  roles such as `customer` and `admin`.
- **Rationale**: This keeps identity and list ownership consistent while allowing the
  same person to act as both shopper and admin without duplicating accounts.
- **Alternatives considered**:
  - Separate admin and customer account tables: rejected because it would fragment list
    ownership and profile state.
  - Expose admin features on mobile too: rejected because the MVP intentionally keeps
    mobile focused on shopper behavior.

## Decision 3: Run optimization only in the backend

- **Decision**: Keep optimization execution authoritative in the backend and expose
  queued processing state plus result retrieval to clients.
- **Rationale**: The optimizer depends on shared, current catalog and price data. It
  also needs consistent auditability, retry control, and operational visibility.
- **Alternatives considered**:
  - Run optimization locally on mobile: rejected because it would duplicate critical
    business logic, increase stale-data risk, and weaken diagnostics.
  - Run optimization synchronously in API requests: rejected because it would couple UX
    latency to heavier compute and reduce resilience under spikes.

## Decision 4: Model regions explicitly and separate public visibility from store activity

- **Decision**: Introduce an explicit `Region` entity with `implantationStatus` and an
  active-establishment count derived from related establishments.
- **Rationale**: Public UX rules now depend on whether a region is visible in selectors
  and whether it currently has active establishments. Those are different concerns and
  should not be inferred ad hoc from raw store rows alone.
- **Alternatives considered**:
  - Infer visible regions purely from establishments: rejected because it cannot
    represent `activating` versus `inactive` cleanly.

## Decision 5: Keep establishment identity in one MVP table

- **Decision**: Model each supermarket unit as one `Establishment` record containing
  brand name, unit name or neighborhood context, region, city, CNPJ, and `isActive`.
- **Rationale**: This supports branch-level differentiation without introducing a
  separate supermarket-chain table before it is operationally necessary.
- **Alternatives considered**:
  - Add `StoreChain` and `StoreUnit` tables immediately: rejected for MVP because it
    increases modeling complexity before chain-level analytics are required.

## Decision 6: Use a canonical product catalog plus establishment-specific offers

- **Decision**: Maintain a single canonical `Product` catalog and attach current
  establishment-specific `ProductOffer` records to it.
- **Rationale**: This matches the product promise: one product identity, multiple
  possible places and prices to buy it. It also supports the frontend modal that lists
  all known prices for a product.
- **Alternatives considered**:
  - Store product names independently per establishment: rejected because it makes
    optimization and comparison unreliable.

## Decision 7: Preserve queue-backed receipt processing, but keep QR-code online lookup out of MVP

- **Decision**: Keep the backend ready to persist translated receipt records and queue
  receipt-related processing, but explicitly defer QR-code-based online invoice lookup
  beyond the MVP.
- **Rationale**: Receipt persistence remains useful for later enrichment and audit, but
  online QR retrieval adds integration risk and is not necessary to unlock the first
  catalog-admin workflow.
- **Alternatives considered**:
  - Make receipt ingestion central to MVP data entry: rejected because admin CRUD is a
    safer first operational path.
  - Drop receipt support entirely: rejected because the architecture should remain ready
    for this input source later.

## Decision 8: Expand admin reporting beyond price visibility

- **Decision**: The admin dashboard backend will return operational metrics for active
  users, optimization throughput, queue health, processing failures, and catalog
  coverage in addition to core CRUD data.
- **Rationale**: Admins need both management actions and operational visibility from the
  same restricted surface.
- **Alternatives considered**:
  - Price-only dashboard: rejected because it would leave the operational side blind.

## Decision 9: Keep structured logs and severity-oriented error handling mandatory

- **Decision**: Standardize backend logs around structured records with explicit
  severity (`info`, `warn`, `error`) and contextual metadata for requests, jobs, and
  data operations.
- **Rationale**: The replanned backend now has more asynchronous and admin-sensitive
  workflows, which require clear production diagnostics.
- **Alternatives considered**:
  - Basic console logging: rejected because it weakens queue diagnostics and audit
    trails.
