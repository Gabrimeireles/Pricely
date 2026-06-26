import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ActionPlaceholderProps = React.ComponentProps<typeof Card> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
};

function ActionPlaceholder({
  children,
  className,
  description,
  icon,
  primaryAction,
  secondaryAction,
  title,
  ...props
}: ActionPlaceholderProps) {
  return (
    <Card
      className={cn('border-dashed border-border/80 bg-card/80', className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--ds-location-soft)] text-[var(--ds-location)]">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {primaryAction || secondaryAction ? (
        <CardContent className="flex flex-wrap gap-2 pt-0">
          {primaryAction ? (
            <Button asChild size="sm">
              {primaryAction}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button asChild size="sm" variant="outline">
              {secondaryAction}
            </Button>
          ) : null}
        </CardContent>
      ) : null}
      {children ? <CardContent className="pt-0">{children}</CardContent> : null}
    </Card>
  );
}

export { ActionPlaceholder };
export type { ActionPlaceholderProps };
