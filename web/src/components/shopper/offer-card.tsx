import { CheckCircle2Icon, MapPinIcon } from 'lucide-react';

import { StatusBadge } from '@/components/design-system';
import { Card } from '@/components/ui/card';
import type { Offer } from '@/app/shopper-data';

export function OfferCard({ offer, onClick }: { offer: Offer; onClick?: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="lift grid cursor-pointer gap-3 rounded-2xl p-4"
    >
      <div className="flex gap-3.5">
        <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--ds-neutral-soft)]">
          <img src={offer.image} alt={offer.title} className="size-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold leading-tight">{offer.title}</div>
          <div className="text-[13px] text-foreground">{offer.pack}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="size-3" /> {offer.store} · {offer.distance}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="font-heading text-[23px] font-bold tabular-nums leading-none">{offer.price}</div>
          <div className="mt-1 text-[11px] text-primary">Preço otimizado</div>
        </div>
        <div className="rounded-xl border border-[var(--ds-savings-border)] bg-[var(--ds-savings-soft)] px-2.5 py-1 text-right tabular-nums">
          <div className="text-[10px] text-[var(--ds-savings)]">Economize</div>
          <div className="font-bold text-[var(--ds-savings)]">{offer.save}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
        <StatusBadge family="trust" status={offer.trust}>
          {offer.trust === 'high' ? 'Alta' : 'Média'} confiança {offer.score}
        </StatusBadge>
        <StatusBadge tone="savings" icon={CheckCircle2Icon}>
          Validado
        </StatusBadge>
      </div>
    </Card>
  );
}
