# Stitch Prompt: Lists Workspace

Create the `/listas` web screen for reusable grocery lists.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
The user should see every reusable list, understand its state, and continue the best next action quickly.

Required content:
- Header: "Minhas listas" with city/location context inherited from shell.
- Primary action: Nova lista.
- Next-action strip for the most important list.
- List cards:
  - list name;
  - city;
  - item count;
  - item thumbnails;
  - latest optimization mode and status;
  - estimated savings if available;
  - checklist progress;
  - last updated;
  - next action button: Editar, Otimizar, Ver resultado, Continuar checklist, Enviar nota.
- Empty state for no lists.
- Warning state when selected city has no active stores.

Interaction details:
- Icon actions for edit/delete/share/details.
- No raw IDs.
- Mobile: cards stack, bottom sticky "Nova lista" or next action.

Visual constraints:
- Avoid large hero.
- Make cards scan-friendly.
- Use progress bars and small thumbnails.

