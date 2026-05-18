# Stitch Prompt: Shopping Checklist

Create the `/listas/:listId/checklist` shopping checklist screen.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
The user is inside the store using the app while shopping. It must be fast, thumb-friendly and clear.

Required sections:
- Header summary: list name, city, optimized mode, estimated total.
- Progress: checked items / total.
- Group items by establishment when optimization selected multiple stores.
- Each checklist item:
  - checkbox;
  - product image;
  - selected variant;
  - quantity;
  - expected price;
  - store;
  - trust badge;
  - report wrong price action.
- Completion state:
  - when all items checked, prompt to conclude list;
  - optional total paid input;
  - CTA to send receipt after completion.
- Price mismatch report:
  - mark that product price is not the one shown in app;
  - optional actual price;
  - optional note.

Sticky action bar:
- mobile: bottom progress + conclude/checklist action;
- desktop: right or bottom action rail.

Visual constraints:
- Large touch targets.
- Minimal typing during shopping.
- No clutter near checkbox.

