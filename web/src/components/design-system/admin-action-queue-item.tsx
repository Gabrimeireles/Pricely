import * as React from 'react';
import { ArrowRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/design-system/status-badge';
import { cn } from '@/lib/utils';

type AdminActionQueueItemProps = Omit<React.ComponentProps<'article'>, 'title'> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  severity?: 'critical' | 'warning' | 'info' | 'healthy';
  context?: React.ReactNode;
  age?: React.ReactNode;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  severityTooltip?: React.ReactNode;
};

function AdminActionQueueItem({
  action,
  age,
  className,
  context,
  description,
  meta,
  severity = 'info',
  severityTooltip,
  title,
  ...props
}: AdminActionQueueItemProps) {
  return (
    <article
      data-slot="admin-action-queue-item"
      className={cn(
        'grid gap-3 rounded-lg border border-border/80 bg-card p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            family="severity"
            status={severity}
            tooltip={
              severityTooltip ??
              'Prioridade operacional calculada para orientar a triagem desta fila.'
            }
          />
          {age ? (
            <span className="text-xs text-muted-foreground">{age}</span>
          ) : null}
        </div>
        <div className="mt-2 truncate font-medium text-foreground">{title}</div>
        {description ? (
          <div className="mt-1 text-pretty text-muted-foreground">
            {description}
          </div>
        ) : null}
        {context || meta ? (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {context ? <span>{context}</span> : null}
            {meta ? <span>{meta}</span> : null}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 justify-end">
        {action ?? (
          <Button size="sm" variant="outline">
            Ver detalhe
            <ArrowRightIcon />
          </Button>
        )}
      </div>
    </article>
  );
}

export { AdminActionQueueItem };
export type { AdminActionQueueItemProps };
