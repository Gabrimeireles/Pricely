import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-balance">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  onAction,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('mb-3.5 flex items-baseline justify-between', className)}>
      <h2 className="font-heading text-lg font-bold tracking-tight">{children}</h2>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-semibold text-[var(--ds-location)] hover:underline"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
