# Receipt Quality and Reward Plan

## Scope

Receipt-derived prices may improve the price database only after the receipt passes
privacy sanitization, duplicate checks, and contribution scoring. Phase 21 keeps token
rewards planned but disabled until these checks are implemented and tested.

## Trust Levels

- `untrusted`: extraction exists but duplicate, source, or parsing confidence is not
  sufficient for offer updates.
- `pending_review`: receipt is sanitized and plausible, but price changes are unusual
  or conflict with newer trusted data.
- `trusted`: receipt is user-submitted, sanitized, non-duplicated, and all item prices
  are within accepted quality thresholds.
- `rejected`: receipt is duplicated, contains prohibited personal data after
  extraction, fails required structure, or shows implausible item/store data.

## Duplicate Detection

- Access key match when NFC-e key is available.
- Same user, store CNPJ, timestamp, total value, and item fingerprint when no key is
  available.
- Repeated image/PDF upload fingerprint when raw file retention is enabled.
- Duplicate submissions never grant reward tokens.

## Suspicious Price Handling

- Quarantine prices that are far below recent local average or far above recent local
  median until reviewed.
- Do not overwrite existing offer rows directly from low-confidence OCR.
- Keep receipt provenance on any future price contribution so admin review can trace
  the source without exposing personal data.
- Label inferred promotions as possible discounts only; receipts do not provide explicit
  promotion metadata.

## Reward Eligibility

- Reward tokens are disabled until contribution scoring and duplicate tests pass.
- Eligible receipts must be sanitized, non-duplicated, tied to a valid user, and either
  trusted automatically or accepted by review.
- Rewards must use the optimization token ledger with idempotency keys based on receipt
  contribution id.
- Rejected, duplicate, or pending-review receipts must not change token balance.

## Privacy Rules

- Never persist CPF, customer name, address, or raw personal data extracted from receipt
  text.
- Store only allowed fiscal purchase data: product data, EAN/barcode when available,
  prices, store CNPJ/name, timestamp, status, and sanitized processing logs.
- Raw files, if retained, must be private, access-controlled, and deletable.
