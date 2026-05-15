# Stitch Prompt: Design System

Create a design system for the Pricely MVP refactor.

Use the system summary from `00-system-summary.md`.

Design thesis:
Pricely should feel like a reliable grocery operations workspace for shoppers and admins. It should be compact, evidence-driven and warm, with clear status semantics. It must not feel like a marketing landing page, a supermarket flyer or a generic purple/blue SaaS template.

Visual direction:
- Product style: practical grocery SaaS, dense but breathable.
- Mood: trustworthy, local, pragmatic, evidence-first.
- Primary color: deep teal/emerald.
- Success: lime/green.
- Warning/pending: amber.
- Critical/error: coral/red.
- Neutral base: off-white, pale green-gray, white surfaces, dark readable text.
- Light and dark modes are required. Define color tokens for both modes before creating screens.
- Radius: 8px for most UI; pills only for status badges.
- Typography: clear sans-serif, strong tabular numeric treatment for prices, compact labels.
- Shadows: subtle and functional only.
- Icons: use familiar line icons for actions; no emoji UI.
- No decorative orbs, bokeh blobs or abstract illustrations.

Component rules:
- App shell with persistent city/location/radius strip.
- Action lanes for multi-step workflows.
- Repeated cards for grocery lists, products, offers, receipts and admin jobs.
- Data tables for admin operations, but with readable owner/list/status labels before raw IDs.
- Evidence modules for optimization decisions and offers.
- Sticky action bars for list editing, optimization results and checklist.
- Empty states must be useful and state-specific.
- Loading states must reserve space and avoid layout shift.

Responsive rules:
- Desktop uses two or three column operational layouts when useful.
- Mobile prioritizes one primary action at a time, bottom sticky actions and compact summaries.
- No horizontal overflow.
- Touch targets at least 44px.

Accessibility:
- Color contrast must meet WCAG AA.
- Every icon-only action has a label/tooltip.
- Status cannot rely on color alone.
- Form labels must be visible.
- Error messages must be near the relevant field.
