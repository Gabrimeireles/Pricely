import * as React from 'react';
import { ArrowRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NextActionStripProps = React.ComponentProps<'section'> & {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  icon?: React.ReactNode;
};

function NextActionStrip({
  className,
  description,
  eyebrow,
  icon,
  primaryAction,
  secondaryAction,
  title,
  ...props
}: NextActionStripProps) {
  return (
    <section
      data-slot="next-action-strip"
      className={cn(
        'rounded-lg border border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)] p-4 text-sm',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)]">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <div className="text-xs font-medium text-[var(--ds-primary)]">
                {eyebrow}
              </div>
            ) : null}
            <div className="text-pretty font-heading text-base font-semibold text-foreground">
              {title}
            </div>
            {description ? (
              <div className="mt-1 text-pretty text-muted-foreground">
                {description}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {secondaryAction}
          {primaryAction ?? (
            <Button>
              Continuar
              <ArrowRightIcon />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export { NextActionStrip };
export type { NextActionStripProps };
