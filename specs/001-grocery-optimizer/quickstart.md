# Quickstart: Grocery Shopping Optimizer

## Goal

Verify the end-to-end planning flow for receipt ingestion, product normalization, and
shopping optimization using the agreed NestJS backend, Flutter mobile app, and local
MongoDB stack.

## Prerequisites

- Local MongoDB instance running
- NestJS backend dependencies installed
- Flutter SDK installed and device or emulator available
- Feature branch `001-grocery-optimizer` checked out

## Backend Setup

1. Start MongoDB locally.
2. Configure backend environment values for local database access and app settings.
3. Start the NestJS backend in local development mode.
4. Confirm the backend can connect to MongoDB and exposes the grocery optimization API.

## Mobile Setup

1. Configure the Flutter app to point to the local backend environment.
2. Start the Flutter app on a simulator, emulator, or physical device.
3. Confirm the app boots to the shopping list flow and can persist local draft data.

## Manual Verification Flow

1. Create a new shopping list with at least five grocery items.
2. Import or enter sample receipt data from at least two supermarkets.
3. Verify receipt entries are parsed into structured products with prices, quantities,
   stores, and dates.
4. Review normalized product matches and confirm unresolved items are clearly flagged.
5. Run Multi-Market Optimization and verify:
   - Each resolved item uses the cheapest confirmed store offer
   - Total estimated cost is shown
   - Savings versus single-store alternatives are shown
   - Store breakdown is displayed
6. Run Local Optimization for a chosen store and verify:
   - Recommendations are constrained to the selected store
   - Missing items are surfaced clearly
   - Total estimated cost is updated accordingly
7. Run Global Store Optimization and verify:
   - One best single store is highlighted
   - Total estimated cost is shown
   - Savings difference versus multi-market option is explained
8. Put the mobile app into a limited-connectivity or offline state and verify:
   - Existing shopping lists remain accessible
   - Recent optimization results remain viewable
   - User actions that require sync provide clear feedback rather than silent failure

## Expected Outcomes

- No fabricated prices or availability appear in any optimization mode
- Users can understand recommendation trade-offs without technical explanation
- Optimization outputs remain responsive and consistent across flows
- Parsing, normalization, and optimization failures are observable and actionable
