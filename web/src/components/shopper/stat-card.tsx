import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DELTA_TONE: Record<string, string> = {
  savings: 'text-[var(--ds-savings)]',
  warning: 'text-[var(--ds-warning)]',
  critical: 'text-[var(--ds-critical)]',
  location: 'text-[var(--ds-location)]',
  neutral: 'text-muted-foreground',
};

export function StatCard({
  icon,
  label,
  value,
  delta,
  deltaTone = 'savings',
  sub,
}: {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: keyof typeof DELTA_TONE;
  sub?: ReactNode;
}) {
  return (
    <Card className="flex flex-row items-start gap-3.5 rounded-2xl p-4">
      {icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-neutral-soft)] text-primary [&_svg]:size-[19px]">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-2xl font-bold tabular-nums leading-tight">{value}</span>
          {delta ? (
            <span className={cn('text-sm font-bold tabular-nums', DELTA_TONE[deltaTone])}>{delta}</span>
          ) : null}
        </div>
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </Card>
  );
}
