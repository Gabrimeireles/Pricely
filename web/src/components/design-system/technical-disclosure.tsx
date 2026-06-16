import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type TechnicalDisclosureProps = React.ComponentProps<'details'> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
};

function TechnicalDisclosure({
  children,
  className,
  description,
  title = 'Detalhes tecnicos',
  ...props
}: TechnicalDisclosureProps) {
  return (
    <details
      data-slot="technical-disclosure"
      className={cn(
        'group rounded-lg border border-border/80 bg-muted/30 text-sm',
        className,
      )}
      {...props}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 font-medium marker:hidden">
        <span>
          {title}
          {description ? (
            <span className="ml-2 font-normal text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t p-3 text-muted-foreground">{children}</div>
    </details>
  );
}

export { TechnicalDisclosure };
export type { TechnicalDisclosureProps };
