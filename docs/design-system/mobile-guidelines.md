# Mobile UI Guidelines

Status: foundation draft for issue #323.

## Role Of Mobile

The mobile app is the in-store and quick-action surface. It should make it easy to
resume a list, use location, review optimized picks, check items off, and submit a
receipt.

Mobile should not copy desktop layouts. It should use the same design vocabulary with
mobile-native density and touch behavior.

## Navigation Model

Primary destinations:

- Home
- Lists
- Optimize/Results
- Receipts
- Profile

Rules:

- Keep bottom navigation predictable.
- Keep one primary action in thumb reach.
- Use sticky bottom actions on long edit/review/checklist flows.
- Keep city/location context compact.

## Mobile Tokens

Map canonical tokens to Flutter theme:

- primary: `brand.primary`
- secondary/info: `brand.location`
- savings: `brand.savings`
- warning: `brand.warning`
- error/destructive: `brand.critical`
- background: `surface.base`
- card/sheet: `surface.raised`
- dark background: `dark.base`
- dark card/sheet: `dark.raised`

Use Material states for hover/focus/pressed where applicable, but preserve semantic
color meaning.

## Component Guidelines

### Mobile App Scaffold

Required:

- safe-area aware body and bottom navigation
- no text overlap with system UI
- loading/error states that preserve navigation
- compact account/city context

### Mobile City/Location Summary

Shows:

- selected city
- active store count
- saved location status
- radius/coverage preview
- permission denied/unavailable states

Do not show nearby-store claims unless a saved location and backend coverage preview
exist for the flow.

### Mobile List Item Card

Shows:

- product name
- quantity/unit
- brand rule
- selected variant after optimization
- image/fallback when available
- purchased toggle in checklist
- mismatch/report affordance when shopping

### Mobile Evidence Block

Compact structure:

- first row: trust label + score
- second row: source + freshness
- third row: selected variant/package
- optional action: report or upload receipt

Avoid long prose strings where a structured block can fit.

### Mobile Receipt Card

Shows:

- store
- protocol/id shortened where possible
- processing state
- moderation state
- reward state
- next action

Reward copy:

- `Previsto apos validacao` when pending
- `Concedido` only after granted
- disabled/rejected reasons must be visible

### Sticky Action Bar

Use for:

- save list
- optimize list
- finish checklist
- submit receipt
- retry failed action

Rules:

- respect safe area
- one primary action
- optional secondary text/icon action
- no keyboard overlap on forms

## Screen Guidelines

### Home

Primary job: answer "what should I do next?"

Required:

- active city/location summary
- current list continuation
- optimization/result shortcut
- receipt status or contribution prompt
- compact savings/profile summary

### Lists

Required:

- empty state with create action
- saved list cards
- item counts
- last optimization status
- city context

### List Editor

Required:

- catalog search
- quantity controls
- brand rule picker
- item cards
- sticky save/optimize action
- inline error states

### Optimization Result

Required:

- summary total
- store plan
- selected variants
- trust evidence
- unavailable items
- distance only when available
- recalculation action

### Receipts

Required:

- QR/NFC-e URL path
- manual item entry path
- submitted -> waiting release -> processing -> validated states
- reward pending/granted/disabled states

### Profile

Required:

- account identity
- selected city
- contribution/savings stats
- entitlement/token state
- no billing claims unless backend supports action

## Accessibility And QA

- Minimum touch target: 48dp.
- Respect font scaling.
- Use semantic labels for icon-only controls.
- Avoid fixed-height text containers.
- Test light and dark modes.
- Capture widget/screenshot notes for home, list, optimization result, receipt, and
  location denied states until golden tests are formalized.

