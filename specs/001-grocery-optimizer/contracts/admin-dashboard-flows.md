# Admin Dashboard Flows

## Purpose

Describe the main admin-facing workflows supported by the responsive web dashboard.

## Views

### Price Overview

- Show current known prices by item and store
- Filter by store, item, date range, and confidence state
- Highlight stale or low-confidence price data

### Item Catalog View

- Show normalized items and linked aliases
- Surface unresolved or low-confidence matches for review
- Display latest observed store offers and source evidence

### Shopping List View

- Show submitted shopping lists and latest optimization outcomes
- Display optimization mode, total estimated cost, coverage, and missing items
- Allow drill-down into selected item/store decisions

### Queue and Processing Health

- Show receipt processing job status, retries, failures, and throughput summaries
- Surface recent parsing and normalization errors with timestamps

## UX Rules

- All dashboard screens must remain usable on desktop, tablet, and mobile widths
- Dense data views must preserve readability through progressive disclosure rather than
  overwhelming the screen
- Every metric or record shown in the dashboard should be traceable back to a backend
  source object or processing event
