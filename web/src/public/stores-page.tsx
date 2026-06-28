import { ChevronRightIcon, MapPinIcon, SparklesIcon, StoreIcon, TagIcon } from 'lucide-react';

import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { CoverageMap } from '@/components/shopper/coverage-map';
import { PageHead, SectionTitle } from '@/components/shopper/section';
import { StatCard } from '@/components/shopper/stat-card';
import { toast } from 'sonner';

import { useLocationCtx } from './shopper-shell';

const STORES = [
  ['Mercado Centro', 'Centro', '1,2 km', 'fresh', 'Aberto até 22h', 142],
  ['Carrefour V. Mariana', 'Vila Mariana', '1,8 km', 'fresh', 'Aberto até 23h', 98],
  ['Atacadão Mooca', 'Mooca', '2,1 km', 'fresh', 'Aberto até 22h', 210],
  ['Assaí Ipiranga', 'Ipiranga', '2,4 km', 'aging', 'Aberto até 21h', 76],
  ['Extra Paulista', 'Bela Vista', '2,7 km', 'fresh', 'Aberto até 22h', 64],
  ['Dia Liberdade', 'Liberdade', '3,0 km', 'aging', 'Aberto até 20h', 41],
  ['Sonda Aclimação', 'Aclimação', '3,4 km', 'fresh', '24 horas', 88],
  ['Pão de Açúcar', 'Paraíso', '3,8 km', 'fresh', 'Aberto até 23h', 53],
] as const;

export function StoresPage() {
  const { city, radius, openCoverage, setRadius } = useLocationCtx();

  return (
    <div>
      <PageHead
        title="Lojas"
        subtitle={`${city.stores} lojas ativas em ${city.name} · raio de ${radius} km`}
        actions={
          <Button variant="outline" onClick={openCoverage}>
            <MapPinIcon className="size-[15px]" /> Mapa completo
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <CoverageMap height={360} radiusKm={radius} stores={city.stores} />
        </div>
        <div className="grid gap-3 self-start">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Cobertura da área" value="100%" delta="ótima" />
            <StatCard label="Preços atualizados" value="há 15 min" deltaTone="neutral" />
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
        <div className="grid gap-3.5 sm:grid-cols-2">
          {STORES.map(([name, district, km, fresh, hours, count]) => (
            <div
              key={name}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted"
              onClick={() => toast.info(name, { description: 'Abrindo detalhes (demo)' })}
            >
              <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[13px] bg-[var(--ds-neutral-soft)] text-primary">
                <StoreIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">{name}</div>
                <div className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                  <MapPinIcon className="size-3" /> {district} · {km} · {hours}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <StatusBadge family="freshness" status={fresh} />
                  <StatusBadge tone="neutral" icon={TagIcon}>
                    <span className="tabular-nums">{count} ofertas</span>
                  </StatusBadge>
                </div>
              </div>
              <ChevronRightIcon className="size-[18px] text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
