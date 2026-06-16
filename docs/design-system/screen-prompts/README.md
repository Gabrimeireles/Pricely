# AI Screen Generation Prompts

Use these prompts to create visual screens in ChatGPT, Stitch, Figma, Claude Design,
or another UI generation tool.

Recommended workflow:

1. Open `00-shared-context.md`.
2. Copy the shared context into the design tool.
3. Copy one screen prompt from `web-public/`, `mobile/`, or `admin-dashboard/`.
4. Generate only that one screen.
5. Review the result against `docs/design-system/`.
6. Implement approved screens in Codex with tests.

Do not ask a design tool to generate the whole product at once. Generate components
and screens in small batches so the visual system stays consistent.

## Folders

- `web-public/`: shopper web app screens.
- `mobile/`: Flutter shopper app screens.
- `admin-dashboard/`: operational dashboard screens.

## Output Expectations

Ask the design tool for:

- one screen only
- light and dark mode notes
- loading, empty, error, and partial-data states where relevant
- component names
- responsive notes
- implementation notes that map to the repo

## Approved Source Of Truth

Use these docs as the source of truth:

- `docs/design-system/pricely-design-system.md`
- `docs/design-system/ui-inventory.md`
- `docs/design-system/web-public-guidelines.md`
- `docs/design-system/mobile-guidelines.md`
- `docs/design-system/admin-dashboard-guidelines.md`

