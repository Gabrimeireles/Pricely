# Stitch Prompt: Admin Lists and Optimization Evidence

Create `/dashboard/listas` and optimization decision detail surfaces.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
Admin can inspect user lists and optimization decisions in human-readable form.

List operations requirements:
- owner;
- list name;
- city;
- item count;
- last optimization mode;
- status;
- elapsed time;
- estimated savings;
- checklist progress;
- detail action.

Optimization detail requirements:
- selected offers;
- rejected alternatives;
- trust decay;
- receipt provenance;
- moderation status;
- source labels;
- distance/radius context;
- true savings math vs second cheapest eligible offer;
- city average as separate metric.

Visual constraints:
- Human labels before technical job/resource IDs.
- Use evidence modules, not raw debug dumps.
- Icon actions for detail/open/copy ID.

