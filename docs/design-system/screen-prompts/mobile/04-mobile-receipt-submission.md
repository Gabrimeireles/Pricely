# Prompt: Mobile Receipt Submission

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely mobile receipt submission.

Viewport:
- Native mobile viewport, 390px wide.
- Flutter implementation target.

Scenario:
- User finished shopping.
- App offers QR/NFC-e URL submission and manual item entry.
- Submitted receipt waits for manual release.
- Reward is pending validation.

Screen goal:
Make receipt contribution feel useful and honest before reward is granted.

Required content:
- Entry tabs or segmented control: QR/NFC-e, manual.
- QR/NFC-e URL field.
- Manual store/date/CNPJ fields.
- Manual item rows.
- Submission status timeline:
  - enviada
  - aguardando liberacao manual
  - liberada para processamento
  - validada
- Reward pending state.
- Explanation that credits are granted only after validation.
- Sticky submit CTA.

Required states:
- invalid URL
- manual field error
- duplicate receipt
- rejected receipt
- low confidence
- reward granted

Visual rules:
- Do not promise reward upfront.
- Use receipt/moderation/reward chips.
- Keep form labels visible.
- Error messages near fields.

Implementation notes:
Map likely components to:
- mobile/lib/features/receipts/presentation/receipt_submission_screen.dart
- mobile/lib/features/receipts/application/receipt_flow_controller.dart
```

