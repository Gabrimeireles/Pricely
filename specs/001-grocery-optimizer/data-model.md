# Data Model: Grocery Shopping Optimizer

## UserAccount

- **Purpose**: Shared identity used across mobile and web for both customers and admins.
- **Fields**:
  - `id`: Unique identifier
  - `email`: Login identity
  - `passwordHash`: Credential hash
  - `displayName`: User-visible name
  - `role`: `customer` or `admin`
  - `status`: `active`, `suspended`
  - `lastLoginAt`: Last sign-in timestamp
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Has many `ShoppingList`
  - Has many `OptimizationRun`
  - May have many `ReceiptRecord`
- **Validation Rules**:
  - `email` must be unique
  - `role` must be explicit and server-enforced

## Region

- **Purpose**: Publicly selectable city/coverage unit with activation state.
- **Fields**:
  - `id`: Unique identifier
  - `slug`: Stable API-facing identifier
  - `name`: Public display name
  - `stateCode`: Region state code
  - `countryCode`: Defaults to `BR`
  - `implantationStatus`: `active`, `activating`, `inactive`
  - `publicSortOrder`: Display order hint
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Has many `Establishment`
- **Derived Fields**:
  - `activeEstablishmentCount`: Count of related active establishments
- **Validation Rules**:
  - `slug` must be unique
  - `inactive` regions are excluded from public dropdowns

## Establishment

- **Purpose**: One specific supermarket unit or branch.
- **Fields**:
  - `id`: Unique identifier
  - `brandName`: Brand or supermarket network name
  - `unitName`: Specific unit label or branch identifier
  - `cnpj`: Unique Brazilian tax identifier
  - `cityName`: Human-readable city name
  - `neighborhood`: Neighborhood or district
  - `addressLine`: Optional address detail
  - `regionId`: Parent region reference
  - `isActive`: Whether the unit is available to public and optimization queries
  - `openedAt`: Optional record timestamp
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Belongs to `Region`
  - Has many `ProductOffer`
  - Has many optional `ReceiptRecord`
- **Validation Rules**:
  - `cnpj` must be unique
  - `brandName`, `regionId`, and `cityName` must be present

## CatalogProduct

- **Purpose**: Generic comparable grocery item chosen first by shoppers before any brand
  restriction is applied.
- **Fields**:
  - `id`: Unique identifier
  - `slug`: Stable identifier
  - `name`: Generic comparable name, such as `Arroz tipo 1 1kg`
  - `category`: Grocery category
  - `defaultUnit`: Typical unit or package family
  - `imageUrl`: Optional representative image
  - `isActive`: Whether the product is visible for search and optimization
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Has many `CatalogProductAlias`
  - Has many `ProductVariant`
  - Has many `ShoppingListItem`
- **Validation Rules**:
  - `slug` must be unique
  - `name` should remain generic enough to compare variants fairly

## CatalogProductAlias

- **Purpose**: Maps noisy or generic user/receipt text to a base comparable product.
- **Fields**:
  - `id`: Unique identifier
  - `catalogProductId`: Parent base product reference
  - `alias`: Variant text
  - `sourceType`: `rule`, `admin`, `receipt`
  - `confidenceScore`: Alias confidence
  - `createdAt`: Creation timestamp
- **Relationships**:
  - Belongs to `CatalogProduct`
- **Validation Rules**:
  - `alias` must not silently promote low-confidence equivalence to confirmed truth

## ProductVariant

- **Purpose**: Specific branded or packaging-level variant that can actually be sold and
  priced by establishments.
- **Fields**:
  - `id`: Unique identifier
  - `catalogProductId`: Parent base product reference
  - `slug`: Stable identifier
  - `displayName`: Specific name such as `Arroz Tipo 1 Camil 1kg`
  - `brandName`: Optional but preferred brand
  - `variantLabel`: Optional line, type, or flavor detail
  - `packageLabel`: Packaging context such as `1 kg`
  - `imageUrl`: Optional real product image
  - `isActive`: Whether the variant is available for offers and selection
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Belongs to `CatalogProduct`
  - Has many `ProductOffer`
- **Validation Rules**:
  - `catalogProductId` and `displayName` are required
  - Variants should remain specific enough for real-world shelf differentiation

## ProductOffer

- **Purpose**: Current establishment-specific offer for one concrete product variant.
- **Fields**:
  - `id`: Unique identifier
  - `catalogProductId`: Parent base product reference
  - `productVariantId`: Parent variant reference
  - `establishmentId`: Parent establishment reference
  - `displayName`: Public product label for this offer
  - `packageLabel`: Unit or package context
  - `priceAmount`: Current known price
  - `currencyCode`: Currency code
  - `availabilityStatus`: `available`, `unavailable`, `uncertain`
  - `confidenceLevel`: `high`, `medium`, `low`
  - `sourceType`: `admin`, `receipt`, `flyer`, `site`
  - `sourceReference`: Human-readable evidence label
  - `observedAt`: When the price was observed
  - `expiresAt`: Optional expiration timestamp
  - `isActive`: Whether this current offer is eligible for public and optimization use
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Belongs to `CatalogProduct`
  - Belongs to `ProductVariant`
  - Belongs to `Establishment`
- **Validation Rules**:
  - `catalogProductId`, `productVariantId`, `establishmentId`, `priceAmount`, and
    `observedAt` are required for active offers
  - Inactive establishments must not produce public-active offers

## ShoppingList

- **Purpose**: User-owned reusable grocery list.
- **Fields**:
  - `id`: Unique identifier
  - `userId`: Owner account reference
  - `name`: List title
  - `preferredRegionId`: Optional default region for optimization
  - `status`: `draft`, `ready`, `archived`
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Belongs to `UserAccount`
  - Has many `ShoppingListItem`
  - Has many `OptimizationRun`
- **Validation Rules**:
  - List can exist without any optimization run

## ShoppingListItem

- **Purpose**: Requested grocery item within a shopping list.
- **Fields**:
  - `id`: Unique identifier
  - `shoppingListId`: Parent list reference
  - `catalogProductId`: Optional chosen base product reference
  - `lockedProductVariantId`: Optional exact chosen variant reference
  - `brandPreferenceMode`: `any`, `preferred`, `exact`
  - `preferredBrandNames`: Optional accepted brands
  - `requestedName`: Raw user text
  - `quantity`: Requested quantity
  - `unitLabel`: Optional unit label
  - `notes`: Optional user note
  - `purchaseStatus`: `pending`, `purchased`
  - `purchasedAt`: Optional in-store completion timestamp
  - `resolutionStatus`: `unresolved`, `matched`, `partial`, `missing`
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Relationships**:
  - Belongs to `ShoppingList`
  - May belong to `CatalogProduct`
  - May belong to `ProductVariant`
  - Has many `OptimizationSelection`
- **Validation Rules**:
  - `requestedName` must be present
  - `quantity` must be positive when provided
  - `exact` brand preference requires `lockedProductVariantId`
  - `preferred` brand preference should include one or more preferred brand names when
    the user actually constrained the choice

## OptimizationRun

- **Purpose**: One backend-owned execution of an optimization request.
- **Fields**:
  - `id`: Unique identifier
  - `shoppingListId`: Parent list reference
  - `userId`: Requesting user reference
  - `mode`: `local`, `global_unique`, `global_full`
  - `regionId`: Region used for the run
  - `preferredEstablishmentId`: Optional establishment for local mode
  - `jobId`: Related processing job identifier
  - `status`: `queued`, `running`, `completed`, `failed`
  - `totalEstimatedCost`: Optional result total
  - `estimatedSavings`: Optional result savings
  - `coverageStatus`: `complete`, `partial`, `none`
  - `summary`: Human-readable trade-off explanation
  - `createdAt`: Creation timestamp
  - `completedAt`: Completion timestamp
- **Relationships**:
  - Belongs to `ShoppingList`
  - Belongs to `UserAccount`
  - Has many `OptimizationSelection`
  - May belong to `ProcessingJob`
- **Validation Rules**:
  - Historical runs must remain queryable even when newer runs exist

## OptimizationSelection

- **Purpose**: Item-level decision inside an optimization run.
- **Fields**:
  - `id`: Unique identifier
  - `optimizationRunId`: Parent run reference
  - `shoppingListItemId`: Parent list item reference
  - `productOfferId`: Chosen offer when resolved
  - `status`: `selected`, `review`, `missing`
  - `estimatedCost`: Optional line total
  - `confidenceNotice`: Optional user-facing explanation
- **Relationships**:
  - Belongs to `OptimizationRun`
  - Belongs to `ShoppingListItem`
  - May belong to `ProductOffer`
- **Validation Rules**:
  - `productOfferId` is required when `status` is `selected`

## ProcessingJob

- **Purpose**: Tracks queued background work for optimization and optional receipt flows.
- **Fields**:
  - `id`: Unique identifier
  - `queueName`: Queue identity
  - `jobType`: `optimization`, `receipt_processing`
  - `resourceType`: Related domain resource type
  - `resourceId`: Related domain resource identifier
  - `status`: `queued`, `running`, `completed`, `failed`, `retrying`
  - `attemptCount`: Current attempts
  - `failureReason`: Optional failure message
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
  - `finishedAt`: Completion timestamp
- **Relationships**:
  - May reference `OptimizationRun`
  - May reference optional `ReceiptRecord`
- **Validation Rules**:
  - State transitions must be explicit and observable

## ReceiptRecord *(optional MVP support)*

- **Purpose**: Persist translated receipt data when receipt ingestion is used.
- **Fields**:
  - `id`: Unique identifier
  - `userId`: Submitting user reference
  - `establishmentId`: Related establishment reference
  - `sourceType`: `manual_entry`, `image_parse`
  - `parseStatus`: `queued`, `parsed`, `partial`, `failed`
  - `purchaseDate`: Optional purchase timestamp
  - `rawReference`: Optional file or external reference
  - `createdAt`: Creation timestamp
- **Relationships**:
  - Belongs to `UserAccount`
  - Belongs to `Establishment`
- **Validation Rules**:
  - QR-code-based online invoice lookup remains out of MVP scope

## State Transitions

- `Region.implantationStatus`: `activating -> active -> inactive`
- `Establishment.isActive`: `true <-> false`
- `ShoppingList.status`: `draft -> ready -> archived`
- `ShoppingListItem.resolutionStatus`: `unresolved -> matched | partial | missing`
- `ShoppingListItem.purchaseStatus`: `pending -> purchased`
- `OptimizationRun.status`: `queued -> running -> completed | failed`
- `ProcessingJob.status`: `queued -> running -> completed | failed | retrying`
- `ReceiptRecord.parseStatus`: `queued -> parsed | partial | failed`
