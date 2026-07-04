import { useEffect, useRef, useState } from 'react';
import { CheckCircle2Icon, SearchIcon, ShieldCheckIcon } from 'lucide-react';

import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { fetchRegionOffers } from '@/app/api';
import { usePricely } from '@/app/pricely-context';
import type { Offer } from '@/app/shopper-data';

import { OfferCard } from '@/components/shopper/offer-card';
import { PageHead } from '@/components/shopper/section';
import { useLocationCtx } from './shopper-shell';

const CATEGORY_LABELS: Record<string, string> = {
  mercearia: 'Mercearia 🧂',
  hortifruti: 'Hortifruti 🥦',
  bebidas: 'Bebidas 🥤',
  laticinios: 'Laticínios 🥛',
  proteinas: 'Proteínas 🥚',
  limpeza: 'Limpeza 🧹',
  higiene: 'Higiene 🪥',
  padaria: 'Padaria 🍞',
};

function categoryLabel(raw: string) {
  return CATEGORY_LABELS[raw.toLowerCase()] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

function priceStr(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

function OfferDetail({ offer, onClose }: { offer: Offer; onClose: () => void }) {
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
                {offer.trust === 'high' ? 'Alta' : offer.trust === 'medium' ? 'Média' : 'Baixa'} confiança {offer.score}
              </StatusBadge>
              <StatusBadge tone="savings" icon={CheckCircle2Icon}>Validado</StatusBadge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            ['Preço', offer.price, 'text-primary'],
            ['Economia', offer.save || '—', 'text-[var(--ds-savings)]'],
            ['Loja', offer.store, 'text-foreground'],
            ['Bairro', offer.distance, 'text-foreground'],
          ] as const).map(([k, v, c]) => (
            <div key={k} className="rounded-xl bg-muted/60 px-3.5 py-2.5">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className={cn('font-bold tabular-nums', c)}>{v}</div>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">Fechar</Button>
      </DialogContent>
    </Dialog>
  );
}

export function OffersPage() {
  const { city, radius } = useLocationCtx();
  const { cityId, cities } = usePricely();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cat, setCat] = useState('Todas');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const regionSlug = cityId ?? cities[0]?.id;
    if (!regionSlug) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    fetchRegionOffers(regionSlug, {
      pageSize: 100,
      category: cat !== 'Todas' ? cat : undefined,
    })
      .then((r) => {
        if (controller.signal.aborted) return;
        const mapped = r.offers.map((o): Offer => ({
          id: o.id,
          title: o.displayName,
          pack: o.packageLabel,
          image: o.imageUrl ?? '',
          store: o.storeName,
          distance: o.neighborhood,
          price: priceStr(o.priceAmount),
          save: o.savingsVsComparison != null ? priceStr(o.savingsVsComparison) : '',
          trust: o.confidenceLevel,
          score: o.confidenceLevel === 'high' ? 95 : o.confidenceLevel === 'medium' ? 75 : 50,
          category: o.category,
        }));
        setOffers(mapped);
        if (r.filters?.categories && r.filters.categories.length > 0) {
          setCategories(r.filters.categories);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [cityId, cities, cat]);

  const filtered = offers.filter((o) => {
    return !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.store.toLowerCase().includes(search.toLowerCase());
  });

  const allCats = ['Todas', ...categories];

  return (
    <div>
      <PageHead
        title="Ofertas"
        subtitle={`Comparadas por nota fiscal em ${city.name} · raio de ${radius} km`}
        actions={
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto ou loja…"
              className="h-[38px] rounded-xl border border-border bg-card pl-9 pr-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        }
      />

      {allCats.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {allCats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                'h-[34px] rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors',
                cat === c
                  ? 'border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)] text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-[var(--ds-neutral-border)]',
              )}
            >
              {c === 'Todas' ? 'Todas' : categoryLabel(c)}
            </button>
          ))}
        </div>
      )}

      <Card className="mb-5 flex items-center gap-3 rounded-2xl p-4 px-5">
        <ShieldCheckIcon className="size-[18px] text-[var(--ds-savings)]" />
        <span className="text-[13.5px]">
          <strong>Por que confiar?</strong> Cada preço vem de notas fiscais validadas — quanto mais evidência, maior a confiança da oferta.
        </span>
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-[14px] text-muted-foreground">
          {search ? `Nenhuma oferta encontrada para "${search}".` : cat !== 'Todas' ? `Nenhuma oferta em ${categoryLabel(cat)} no momento.` : 'Nenhuma oferta disponível no momento.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => <OfferCard key={o.id} offer={o} onClick={() => setDetail(o)} />)}
        </div>
      )}

      {detail && <OfferDetail offer={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
