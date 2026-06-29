import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, MapPinIcon, SparklesIcon, StoreIcon, TagIcon } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { CoverageMap } from '@/components/shopper/coverage-map';
import { PageHead, SectionTitle } from '@/components/shopper/section';
import { StatCard } from '@/components/shopper/stat-card';
import { fetchRegionOffers } from '@/app/api';
import { usePricely } from '@/app/pricely-context';

import { useLocationCtx } from './shopper-shell';

type StoreRow = { name: string; neighborhood: string; count: number };

export function StoresPage() {
  const navigate = useNavigate();
  const { city, radius, openCoverage, setRadius } = useLocationCtx();
  const { cityId } = usePricely();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeCount, setStoreCount] = useState(city.stores);

  useEffect(() => {
    const regionSlug = cityId ?? city.id;
    fetchRegionOffers(regionSlug, { pageSize: 100 })
      .then((r) => {
        setStoreCount(r.activeEstablishmentCount);
        const countMap: Record<string, { neighborhood: string; count: number }> = {};
        for (const o of r.offers) {
          if (!countMap[o.storeName]) {
            countMap[o.storeName] = { neighborhood: o.neighborhood, count: 0 };
          }
          countMap[o.storeName].count += 1;
        }
        setStores(
          Object.entries(countMap)
            .map(([name, v]) => ({ name, ...v }))
            .sort((a, b) => b.count - a.count),
        );
      })
      .catch(() => {});
  }, [cityId, city.id]);

  return (
    <div>
      <PageHead
        title="Lojas"
        subtitle={`${storeCount} lojas ativas em ${city.name} · raio de ${radius} km`}
        actions={
          <Button variant="outline" onClick={openCoverage}>
            <MapPinIcon className="size-[15px]" /> Mapa completo
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <CoverageMap height={360} radiusKm={radius} stores={storeCount} />
        </div>
        <div className="grid gap-3 self-start">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Lojas com dados" value={String(storeCount)} delta="ativas" />
            <StatCard label="Ofertas indexadas" value={String(stores.reduce((s, r) => s + r.count, 0))} deltaTone="neutral" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="font-heading text-[15px] font-bold">Sobre a cobertura</div>
            <p className="mt-1.5 text-pretty text-[13.5px] text-muted-foreground">
              Mostramos apenas lojas com dados de preço recentes no seu raio. Aumente o raio para incluir mais lojas e variar as ofertas.
            </p>
            <Button
              variant="ghost"
              className="mt-2.5 text-primary"
              onClick={() => {
                setRadius(Math.min(15, radius + 5));
                toast.info('Raio ampliado');
              }}
            >
              <SparklesIcon className="size-[15px]" /> Ampliar raio
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>Lojas no seu raio</SectionTitle>
        {stores.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-[14px] text-muted-foreground">
            Carregando lojas...
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {stores.map((store) => (
              <div
                key={store.name}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted"
                onClick={() => navigate(`/ofertas?store=${encodeURIComponent(store.name)}`)}
              >
                <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[13px] bg-[var(--ds-neutral-soft)] text-primary">
                  <StoreIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold">{store.name}</div>
                  <div className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                    <MapPinIcon className="size-3" /> {store.neighborhood}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <StatusBadge tone="neutral" icon={TagIcon}>
                      <span className="tabular-nums">{store.count} {store.count === 1 ? 'oferta' : 'ofertas'}</span>
                    </StatusBadge>
                  </div>
                </div>
                <ChevronRightIcon className="size-[18px] text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
