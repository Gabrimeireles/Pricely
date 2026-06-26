# Web Design-System Components

Implementation-facing component layer for the Pricely design system.

Use these components before adding screen-local badge, evidence, price, or queue
patterns.

```tsx
import {
  EvidenceModule,
  PriceRow,
  StatusBadge,
} from '@/components/design-system';
```

## Components

- `StatusBadge`: semantic status chips for trust, receipt, queue, reward, city,
  freshness, and severity states.
- `EvidenceModule`: shopper-facing offer confidence block.
- `PriceRow`: product/variant/store price row with source metadata.
- `NextActionStrip`: public shopper workflow prompt.
- `StickyActionBar`: safe-area-aware sticky action container.
- `AdminActionQueueItem`: admin operational queue row.
- `TechnicalDisclosure`: disclosure for raw IDs, payloads, and debug metadata.

## Theme

Semantic CSS variables live in `web/src/index.css` and are defined for both `:root`
and `.dark`:

- `--ds-primary`
- `--ds-savings`
- `--ds-location`
- `--ds-warning`
- `--ds-critical`
- `--ds-neutral-*`

The existing `ThemeProvider` toggles `.dark` on `document.documentElement`, so these
components automatically switch between light and dark mode.

