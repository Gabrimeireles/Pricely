import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type PricelyBrandMarkProps = {
  className?: string;
  compact?: boolean;
  to?: string;
};

function PricelyBrandMark({
  className,
  compact = false,
  to = '/',
}: PricelyBrandMarkProps) {
  const content = (
    <>
      <span
        className={cn(
          'font-heading text-[2rem] font-bold leading-none tracking-normal text-primary',
          compact && 'text-[1.65rem]',
        )}
      >
        pricely
      </span>
      <ShoppingCartIcon
        aria-hidden="true"
        className={cn(
          'size-9 stroke-[2.4] text-primary',
          compact && 'size-7',
        )}
      />
    </>
  );

  if (!to) {
    return (
      <div
        aria-label="Pricely"
        className={cn('inline-flex items-center gap-2', className)}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      aria-label="Pricely"
      className={cn('inline-flex items-center gap-2 rounded-md', className)}
      to={to}
    >
      {content}
    </Link>
  );
}

export { PricelyBrandMark };
export type { PricelyBrandMarkProps };
