import * as React from 'react';

import { cn } from '@/lib/utils';

type StickyActionBarProps = React.ComponentProps<'div'> & {
  align?: 'between' | 'end' | 'start';
};

function StickyActionBar({
  align = 'between',
  className,
  ...props
}: StickyActionBarProps) {
  return (
    <div
      data-slot="sticky-action-bar"
      className={cn(
        'sticky bottom-0 z-30 -mx-4 mt-4 border-t bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/85',
        align === 'between' && 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        align === 'end' && 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end',
        align === 'start' && 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start',
        className,
      )}
      {...props}
    />
  );
}

export { StickyActionBar };
export type { StickyActionBarProps };
