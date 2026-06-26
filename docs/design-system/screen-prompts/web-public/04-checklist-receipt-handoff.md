# Prompt: Public Web Checklist And Receipt Handoff

Use with `../00-shared-context.md`.

```text
Create only one screen: Pricely public web in-store checklist.

Viewport:
- Mobile web first, 390px wide.
- Include desktop behavior notes.

Scenario:
- User is shopping from an optimized list.
- 9 of 12 items marked purchased.
- One item has reported shelf price mismatch.
- All items can lead to optional paid total and receipt submission.

Screen goal:
Make checklist completion naturally lead to receipt contribution without forcing it.

Required content:
- Compact list/store context.
- Grouped checklist by store.
- Purchased toggle per item.
- Selected variant and expected price.
- Price mismatch affordance.
- Optional reported price/note state.
- Completion panel when all items are checked.
- Optional paid total field.
- CTA: concluir lista.
- CTA after completion: enviar nota fiscal.

Required states:
- no optimized result
- all purchased
- mismatch reported
- receipt handoff skipped
- save purchased state failed

Visual rules:
- Thumb-friendly.
- Sticky bottom action.
- No horizontal overflow.
- Do not promise reward until receipt validation.

Implementation notes:
Map likely components to:
- web/src/public/public-pages.tsx
- web/src/public/checklist-page.spec.tsx
```

