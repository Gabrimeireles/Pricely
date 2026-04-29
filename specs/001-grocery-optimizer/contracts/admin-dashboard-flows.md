# Admin Dashboard Flows

## Purpose

Describe the restricted web workflows supported by the admin dashboard backend.

## Views

### Overview Metrics

- Show active-user indicators, optimization throughput, queue health, catalog coverage,
  and recent failures
- Support summary cards and drill-down friendly payloads
- Keep every metric traceable to backend records or processing events

### Region Management

- Show all regions including `inactive` ones
- Show implantation status and count of active establishments
- Allow activate, deactivate, and activating-state transitions

### Establishment Management

- Show store units with brand, unit identity, city, neighborhood, region, CNPJ, and
  `isActive`
- Allow create, update, activate, and deactivate
- Support filtering by region and active state

### Product Catalog View

- Show canonical products and linked aliases
- Surface unresolved or low-confidence aliases for review
- Allow create, update, activate, and deactivate

### Product Offer Management

- Show current price offers by product and establishment
- Highlight stale, inactive, low-confidence, or unavailable entries
- Allow create, update, activate, and deactivate

### Shopping List and Optimization Visibility

- Show submitted shopping lists, owners, last optimization mode, latest run state, total
  estimated cost, and missing-item coverage
- Allow drill-down into item-level optimization decisions

### Queue and Processing Health

- Show optimization job status, retries, failures, and throughput summaries
- Surface receipt-processing diagnostics when that capability is used
- Provide timestamps, reasons, and related resource references

## UX Rules

- All dashboard screens must remain usable on desktop, tablet, and mobile widths
- Dense data views must preserve readability through progressive disclosure rather than
  overwhelming the screen
- Every metric or record shown in the dashboard should be traceable back to a backend
  source object or processing event
- Admin CRUD screens must expose activation state explicitly rather than hiding inactive
  records
