import * as React from 'react';

import { cn } from '@/lib/utils';

type PriceRowProps = React.ComponentProps<'div'> & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  price: React.ReactNode;
  comparison?: React.ReactNode;
  image?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

function PriceRow({
  actions,
  className,
  comparison,
  image,
  meta,
  price,
  subtitle,
  title,
  ...props
}: PriceRowProps) {
  return (
    <div
      data-slot="price-row"
      className={cn(
        'grid gap-3 rounded-lg border border-border/80 bg-card p-3 text-sm sm:grid-cols-[auto_1fr_auto] sm:items-center',
        className,
      )}
      {...props}
    >
      {image ? (
        <div
          data-slot="price-row-image"
          className="size-12 overflow-hidden rounded-lg bg-muted"
        >
          {image}
        </div>
      ) : null}
      <div className="min-w-0 space-y-1">
        <div
          data-slot="price-row-title"
          className="truncate font-medium text-foreground"
        >
          {title}
        </div>
        {subtitle ? (
          <div
            data-slot="price-row-subtitle"
            className="line-clamp-2 text-sm text-muted-foreground"
          >
            {subtitle}
          </div>
        ) : null}
        {meta ? (
          <div
            data-slot="price-row-meta"
            className="flex flex-wrap items-center gap-1.5"
          >
            {meta}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="text-right">
          <div
            data-slot="price-row-price"
            className="tabular-nums font-semibold text-foreground"
          >
            {price}
          </div>
          {comparison ? (
            <div
              data-slot="price-row-comparison"
              className="text-xs text-muted-foreground"
            >
              {comparison}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div data-slot="price-row-actions" className="shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { PriceRow };
export type { PriceRowProps };
