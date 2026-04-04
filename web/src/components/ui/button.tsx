import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '../../lib/utils';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-transparent px-4 py-2 text-sm font-semibold',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
