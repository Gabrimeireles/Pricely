import { Link } from 'react-router-dom';

import pricelyIcon from '@/assets/pricely-icon.png';
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
        Pricely
      </span>
      <img
        alt=""
        className={cn(
          'mt-0.5 size-10 scale-[2.15] object-contain',
          compact && 'size-8 scale-[2.1]',
        )}
        src={pricelyIcon}
      />
    </>
  );

  if (!to) {
    return (
      <div
        aria-label="Pricely"
        className={cn('inline-flex items-center gap-2.5', className)}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      aria-label="Pricely"
      className={cn('inline-flex items-center gap-2.5 rounded-md', className)}
      to={to}
    >
      {content}
    </Link>
  );
}

export { PricelyBrandMark };
export type { PricelyBrandMarkProps };
