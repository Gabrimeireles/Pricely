# Stitch Prompt: Mobile Receipt QR and Rewards

Create mobile receipt QR scan and rewards screens.

Use `00-system-summary.md` and `00-design-system.md`.

Required flow:
- QR code scanner entry;
- paste NFC-e URL fallback;
- submitted confirmation;
- waiting manual release;
- processing;
- reward pending;
- reward granted;
- duplicate/rejected/low-confidence states.

Important:
- Rewards are only promised when quality scoring says eligible.
- Manual queue should feel intentional.
- Show points and optimization credit after validation.

Mobile constraints:
- scanner first, form fallback second;
- clear status timeline;
- bottom CTA to return to list/checklist.

