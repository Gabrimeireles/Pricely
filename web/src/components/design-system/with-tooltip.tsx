import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type WithTooltipProps = {
  children: React.ReactElement;
  label: React.ReactNode;
  side?: React.ComponentProps<typeof TooltipContent>['side'];
};

function WithTooltip({ children, label, side = 'top' }: WithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { WithTooltip };
export type { WithTooltipProps };
