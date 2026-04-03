# Data Model: Grocery Shopping Optimizer

## ShoppingList

- **Purpose**: Represents a user-created grocery planning session.
- **Fields**:
  - `id`: Unique identifier
  - `name`: User-visible label for the list
  - `mode`: Optimization mode (`multi_market`, `local_market`, `global_store`)
  - `preferredStoreId`: Optional selected store for local optimization
  - `locationHint`: Optional geographic or user-defined location context
  - `status`: Draft, ready, optimized, or stale
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last modification timestamp
- **Relationships**:
  - Has many `ShoppingListItem`
  - Has many `OptimizationResult`
- **Validation Rules**:
  - `name` must be present
  - `mode` must be one of the supported optimization modes
  - `preferredStoreId` is required when local optimization is explicitly store-bound

## ShoppingListItem

- **Purpose**: Represents a requested grocery item inside a shopping list.
- **Fields**:
  - `id`: Unique identifier
  - `shoppingListId`: Parent list reference
  - `requestedName`: Raw user-entered product name
  - `normalizedName`: Best normalized identity when available
  - `quantity`: Requested quantity
  - `unit`: Optional quantity unit
  - `preferredBrand`: Optional brand hint
  - `resolutionStatus`: Unresolved, matched, partially matched, unavailable
  - `notes`: Optional user notes
- **Relationships**:
  - Belongs to `ShoppingList`
  - May link to one or more `ProductMatch`
- **Validation Rules**:
  - `requestedName` must be present
  - `quantity` must be positive when provided

## ReceiptRecord

- **Purpose**: Stores structured data extracted from a supermarket receipt.
- **Fields**:
  - `id`: Unique identifier
  - `storeId`: Store reference
  - `purchaseDate`: Purchase timestamp
  - `sourceType`: Manual entry, image parse, imported record
  - `rawSourceReference`: Original file or source handle
  - `parseStatus`: Parsed, partial, failed
  - `confidenceScore`: Overall extraction confidence
- **Relationships**:
  - Belongs to `Store`
  - Has many `ReceiptLineItem`
- **Validation Rules**:
  - `storeId` must be present for valid optimization use
  - `purchaseDate` must be present when available from source data

## ReceiptLineItem

- **Purpose**: Represents one purchased product line from a receipt.
- **Fields**:
  - `id`: Unique identifier
  - `receiptRecordId`: Parent receipt reference
  - `rawProductName`: Raw extracted text
  - `normalizedName`: Normalized comparison name
  - `brand`: Optional detected brand
  - `packageSize`: Optional extracted size descriptor
  - `quantity`: Purchased quantity
  - `unitPrice`: Observed price for one unit or pack
  - `currency`: Currency code
  - `matchConfidence`: Product matching confidence
- **Relationships**:
  - Belongs to `ReceiptRecord`
  - May link to one or more `ProductMatch`
- **Validation Rules**:
  - `rawProductName` and `unitPrice` must be present for comparison use
  - `unitPrice` must be non-negative

## ProductMatch

- **Purpose**: Tracks known equivalence or normalization mappings between variant product
  names and a canonical grocery identity.
- **Fields**:
  - `id`: Unique identifier
  - `canonicalName`: Chosen comparable product identity
  - `alias`: Variant observed product name
  - `brand`: Optional brand discriminator
  - `sizeDescriptor`: Optional normalized size/package descriptor
  - `confidenceScore`: Confidence in equivalence
  - `source`: Historical inference, confirmed user correction, rule-based normalization
  - `lastSeenAt`: Last observed usage
- **Relationships**:
  - May connect `ReceiptLineItem` and `ShoppingListItem`
- **Validation Rules**:
  - `canonicalName` and `alias` must be present
  - Low-confidence matches must not be promoted as confirmed equivalents automatically

## Store

- **Purpose**: Represents a supermarket candidate for optimization.
- **Fields**:
  - `id`: Unique identifier
  - `name`: Store name
  - `locationLabel`: Human-readable location
  - `latitude`: Optional coordinate
  - `longitude`: Optional coordinate
  - `isActive`: Whether the store is considered during optimization
  - `lastDataRefreshAt`: Freshness indicator
- **Relationships**:
  - Has many `ReceiptRecord`
  - Has many `StoreOffer`
- **Validation Rules**:
  - `name` must be present

## StoreOffer

- **Purpose**: Represents a product offer at a specific store derived from trusted data.
- **Fields**:
  - `id`: Unique identifier
  - `storeId`: Store reference
  - `canonicalName`: Normalized comparable product identity
  - `displayName`: User-visible product name
  - `price`: Latest trusted price
  - `quantityContext`: Pack or quantity context
  - `availabilityStatus`: Available, unavailable, uncertain
  - `confidenceScore`: Price and availability confidence
  - `sourceReceiptLineItemId`: Source evidence reference
  - `observedAt`: Observation timestamp
- **Relationships**:
  - Belongs to `Store`
  - May reference `ReceiptLineItem`
- **Validation Rules**:
  - `price`, `storeId`, and `canonicalName` must be present for optimization use
  - `availabilityStatus` must be explicit

## OptimizationResult

- **Purpose**: Represents a generated recommendation outcome for a shopping list.
- **Fields**:
  - `id`: Unique identifier
  - `shoppingListId`: Parent list reference
  - `mode`: Optimization mode used
  - `recommendedStoreId`: Optional best single store
  - `totalEstimatedCost`: Total estimated cost
  - `savingsComparedToAlternative`: Optional savings metric
  - `coverageStatus`: Complete, partial
  - `generatedAt`: Result timestamp
  - `explanationSummary`: Human-readable trade-off explanation
- **Relationships**:
  - Belongs to `ShoppingList`
  - Has many `OptimizationSelection`
- **Validation Rules**:
  - `mode` and `totalEstimatedCost` must be present
  - Result must not include fabricated selections for unresolved items

## OptimizationSelection

- **Purpose**: Represents the chosen offer for a specific shopping list item within an
  optimization result.
- **Fields**:
  - `id`: Unique identifier
  - `optimizationResultId`: Parent result reference
  - `shoppingListItemId`: Requested item reference
  - `storeOfferId`: Selected offer reference when resolved
  - `selectionStatus`: Selected, unavailable, unresolved
  - `estimatedCost`: Selected item cost
  - `confidenceNotice`: Optional explanation when confidence is limited
- **Relationships**:
  - Belongs to `OptimizationResult`
  - Belongs to `ShoppingListItem`
  - May belong to `StoreOffer`
- **Validation Rules**:
  - `selectionStatus` must be explicit
  - `storeOfferId` is required when `selectionStatus` is `selected`

## State Transitions

- `ShoppingList.status`: `draft -> ready -> optimized -> stale`
- `ReceiptRecord.parseStatus`: `parsed | partial | failed`
- `ShoppingListItem.resolutionStatus`: `unresolved -> matched | partially_matched | unavailable`
- `OptimizationResult.coverageStatus`: `complete | partial`
