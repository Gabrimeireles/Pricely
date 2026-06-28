import { useState } from 'react';
import { CheckCircle2Icon, PlusIcon, ShieldCheckIcon, StoreIcon } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { OFFERS, type Offer } from '@/app/shopper-data';

import { OfferCard } from '@/components/shopper/offer-card';
import { PageHead } from '@/components/shopper/section';
import { useLocationCtx } from './shopper-shell';

const CATS = ['Todas', 'Grãos', 'Laticínios', 'Bebidas', 'Limpeza', 'Hortifrúti'];

function OfferDetail({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const compares: [string, string, boolean][] = [
    [offer.store, offer.price, true],
    ['Carrefour V. Mariana', 'R$ 27,40', false],
    ['Extra Paulista', 'R$ 28,90', false],
  ];
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Detalhe da oferta</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-[var(--ds-neutral-soft)]">
            <img src={offer.image} alt={offer.title} className="size-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-heading text-lg font-bold">{offer.title}</div>
            <div className="text-[13.5px] text-muted-foreground">{offer.pack}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge family="trust" status={offer.trust}>
                {offer.trust === 'high' ? 'Alta' : 'Média'} confiança {offer.score}
              </StatusBadge>
              <StatusBadge tone="savings" icon={CheckCircle2Icon}>Validado por nota</StatusBadge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            ['Preço otimizado', offer.price, 'text-primary'],
            ['Você economiza', offer.save, 'text-[var(--ds-savings)]'],
            ['Loja', offer.store, 'text-foreground'],
            ['Distância', offer.distance, 'text-foreground'],
          ] as const).map(([k, v, c]) => (
            <div key={k} className="rounded-xl bg-muted/60 px-3.5 py-2.5">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className={cn('font-bold tabular-nums', c)}>{v}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 text-[13.5px] font-semibold">Comparar em outras lojas</div>
          {compares.map(([s, pr, best], i) => (
            <div key={s} className={cn('flex items-center gap-2.5 py-2.5', i && 'border-t border-border')}>
              <StoreIcon className="size-[15px] text-muted-foreground" />
              <span className="flex-1 text-[13.5px]">{s}</span>
              {best ? <StatusBadge tone="savings">Melhor</StatusBadge> : null}
              <span className="font-bold tabular-nums">{pr}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5">
          <Button
            variant="default"
            className="flex-1 bg-[#134e48] hover:bg-[#0f3f3a]"
            onClick={() => {
              onClose();
              toast.success('Adicionado à lista', { description: offer.title });
            }}
          >
            <PlusIcon className="size-4" /> Adicionar à lista
          </Button>
          <Button variant="outline" onClick={onClose}>Ver no mapa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OffersPage() {
  const { city, radius } = useLocationCtx();
  const [cat, setCat] = useState('Todas');
  const [detail, setDetail] = useState<Offer | null>(null);

  return (
    <div>
      <PageHead
        title="Ofertas"
        subtitle={`Comparadas por nota fiscal em ${city.name} · raio de ${radius} km`}
        actions={
          <Tabs defaultValue="savings">
            <TabsList>
              <TabsTrigger value="savings">Maior economia</TabsTrigger>
              <TabsTrigger value="price">Menor preço</TabsTrigger>
              <TabsTrigger value="trust">Mais confiável</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              'h-[34px] rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors',
              cat === c
                ? 'border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)] text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-[var(--ds-neutral-border)]',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <Card className="mb-5 flex items-center gap-3 rounded-2xl p-4 px-5">
        <ShieldCheckIcon className="size-[18px] text-[var(--ds-savings)]" />
        <span className="text-[13.5px]">
          <strong>Por que confiar?</strong> Cada preço vem de notas fiscais validadas — quanto mais evidência, maior a confiança da oferta.
        </span>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {OFFERS.map((o) => <OfferCard key={o.id} offer={o} onClick={() => setDetail(o)} />)}
      </div>

      {detail ? <OfferDetail offer={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}
