import * as React from 'react';
import { InfoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type InfoTooltipProps = {
  label: React.ReactNode;
  side?: React.ComponentProps<typeof TooltipContent>['side'];
  className?: string;
  triggerLabel?: string;
};

function InfoTooltip({
  className,
  label,
  side = 'top',
  triggerLabel = 'Saiba como funciona',
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={triggerLabel}
          className={cn('size-7 text-muted-foreground', className)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <InfoIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

export { InfoTooltip };
export type { InfoTooltipProps };

