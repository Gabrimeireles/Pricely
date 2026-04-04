# Quickstart: Grocery Shopping Optimizer

## Goal

Verify the end-to-end planning flow for receipt ingestion, product normalization,
shopping optimization, landing-page delivery, and admin visibility using the agreed
NestJS backend, Flutter mobile app, Vite/React web app, local MongoDB, Redis, and
Terraform-aware project structure.

## Prerequisites

- Local MongoDB instance running
- Local Redis instance running
- NestJS backend dependencies installed
- Flutter SDK installed and device or emulator available
- Web application dependencies installed
- Feature branch `001-grocery-optimizer` checked out

## Backend Setup

1. Start MongoDB and Redis locally.
2. Configure backend environment values for local database access, Redis access, and
   app settings.
3. Start the NestJS backend in local development mode.
4. Start the backend worker process for BullMQ-backed jobs if separate from the API
   process.
5. Confirm the backend can connect to MongoDB and Redis and exposes the grocery
   optimization API.

## Mobile Setup

1. Configure the Flutter app to point to the local backend environment.
2. Start the Flutter app on a simulator, emulator, or physical device.
3. Confirm the app boots to the shopping list flow and can persist local draft data.

## Web Setup

1. Configure the Vite/React app to point to the local backend environment.
2. Start the web app in development mode.
3. Confirm the landing page renders responsively on mobile and desktop widths.
4. Confirm the admin dashboard loads and can retrieve item, price, and list views from
   the backend.

## Manual Verification Flow

1. Create a new shopping list with at least five grocery items.
2. Import or enter sample receipt data from at least two supermarkets.
3. Confirm the receipt ingestion workflow enqueues background processing and surfaces
   progress or status correctly.
4. Verify receipt entries are parsed into structured products with prices, quantities,
   stores, and dates.
5. Review normalized product matches and confirm unresolved items are clearly flagged.
6. Run Multi-Market Optimization and verify:
   - Each resolved item uses the cheapest confirmed store offer
   - Total estimated cost is shown
   - Savings versus single-store alternatives are shown
   - Store breakdown is displayed
7. Run Local Optimization for a chosen store and verify:
   - Recommendations are constrained to the selected store
   - Missing items are surfaced clearly
   - Total estimated cost is updated accordingly
8. Run Global Store Optimization and verify:
   - One best single store is highlighted
   - Total estimated cost is shown
   - Savings difference versus multi-market option is explained
9. Open the admin dashboard and verify:
   - Price history views load
   - Item and list visibility is available for administration workflows
   - Responsive layout remains usable on tablet and mobile widths
10. Put the mobile app into a limited-connectivity or offline state and verify:
   - Existing shopping lists remain accessible
   - Recent optimization results remain viewable
   - User actions that require sync provide clear feedback rather than silent failure

## Expected Outcomes

- No fabricated prices or availability appear in any optimization mode
- Users can understand recommendation trade-offs without technical explanation
- Optimization outputs remain responsive and consistent across flows
- Parsing, normalization, queue, and optimization failures are observable and actionable
- Landing page and admin dashboard remain responsive and mobile ready
