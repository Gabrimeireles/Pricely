import { TagIcon } from 'lucide-react';

import { PageHead } from '@/components/shopper/section';

export function CouponsPage() {
  return (
    <div>
      <PageHead title="Cupons" subtitle="Descontos exclusivos nas lojas do seu raio" />
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--ds-neutral-soft)] text-muted-foreground">
          <TagIcon className="size-7" />
        </span>
        <div className="font-heading text-[18px] font-bold">Cupons em breve</div>
        <p className="mt-2 max-w-sm text-[13.5px] text-muted-foreground">
          Estamos preparando cupons exclusivos de lojas parceiras para o seu raio. Volte em breve.
        </p>
      </div>
    </div>
  );
}
