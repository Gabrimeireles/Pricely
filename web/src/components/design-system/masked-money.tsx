import * as React from 'react';

import { useMonetaryPrivacy } from '@/app/monetary-privacy-context';
import { cn } from '@/lib/utils';

type MaskedMoneyProps = React.ComponentProps<'span'> & {
  value: React.ReactNode;
  mask?: string;
};

function MaskedMoney({
  className,
  mask = 'R$ •••',
  value,
  ...props
}: MaskedMoneyProps) {
  const { isMoneyVisible } = useMonetaryPrivacy();

  return (
    <span
      className={cn('tabular-nums', className)}
      data-money-visible={isMoneyVisible ? 'true' : 'false'}
      {...props}
    >
      {isMoneyVisible ? value : mask}
    </span>
  );
}

export { MaskedMoney };
export type { MaskedMoneyProps };

