# Mobile Security and Privacy Notes

## Token Storage

- Auth tokens must remain in the existing secure storage path; do not persist tokens in
  logs, analytics events, screenshots, or plain preferences.
- Logout must clear local session state and any cached profile entitlement state.
- Network errors should not expose token values or backend authorization headers.

## Entitlement Display

- Premium/free state is read-only on mobile until billing policy and Phase 19 payment
  implementation are complete.
- Disabled purchase controls must not open web checkout, collect payment details, or
  imply that payment has been configured.
- Token balances are display data from the backend; the client must not calculate or
  mutate entitlement state locally.

## Receipt Image Handling

- Receipt images and PDFs are user-provided only.
- Raw receipt files must be treated as private, access-controlled, and deletable when
  upload support is enabled.
- OCR output must be sanitized before persistence and before any mobile display.
- Mobile UI must communicate that price intelligence is based on user-provided receipts
  and show timestamps for receipt-derived prices.

## Validation Notes

- Add mobile tests around logged-out state, free entitlement state, premium entitlement
  state, and disabled checkout behavior before enabling billing.
- Add receipt-upload privacy tests before exposing camera/gallery upload broadly.
