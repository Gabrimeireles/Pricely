import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CameraIcon,
  ChevronRightIcon,
  Clock3Icon,
  CoinsIcon,
  ListChecksIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StoreIcon,
} from 'lucide-react';
import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OfferCard } from '@/components/shopper/offer-card';
import { StoreMap, type StoreMapEstablishment } from '@/components/shopper/store-map';
import { SectionTitle } from '@/components/shopper/section';
import { StatCard } from '@/components/shopper/stat-card';
import { fetchRegionOffers, previewLocationCoverage } from '@/app/api';
import { usePricely } from '@/app/pricely-context';
import type { Offer } from '@/app/shopper-data';

import { useLocationCtx } from './shopper-shell';

function priceStr(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export function HomePage() {
  const navigate = useNavigate();
  const { city, radius, openCoverage } = useLocationCtx();
  const { lists, cityId, cities, locationPreferences, accessToken } = usePricely();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [storeCount, setStoreCount] = useState(city.stores);
  const [mapEstablishments, setMapEstablishments] = useState<StoreMapEstablishment[]>([]);

  const activeCity = cities.find((c) => c.id === cityId) ?? cities[0];
  const activeLocation = locationPreferences.find(
    (p) => p.isDefault && p.regionSlug === cityId,
  ) ?? null;
  const mapCenter = activeLocation?.latitude && activeLocation?.longitude
    ? { lat: activeLocation.latitude, lng: activeLocation.longitude }
    : null;

  useEffect(() => {
    const regionSlug = cityId ?? cities[0]?.id;
    if (!regionSlug) return;
    fetchRegionOffers(regionSlug, {
      pageSize: 4,
      latitude: activeLocation?.latitude ?? undefined,
      longitude: activeLocation?.longitude ?? undefined,
      coverageRadiusKm: activeLocation?.latitude ? radius : undefined,
    })
      .then((r) => {
        setOffers(
          r.offers.slice(0, 4).map((o): Offer => ({
            id: o.id,
            title: o.displayName,
            pack: o.packageLabel,
            image: o.imageUrl ?? '',
            store: o.storeName,
            distance: '—',
            price: priceStr(o.priceAmount),
            save: o.savingsVsComparison != null ? priceStr(o.savingsVsComparison) : '',
            trust: o.confidenceLevel,
            score: o.confidenceLevel === 'high' ? 95 : o.confidenceLevel === 'medium' ? 75 : 50,
          })),
        );
      })
      .catch(() => {});
  }, [cityId, cities, activeLocation?.latitude, activeLocation?.longitude, radius]);

  useEffect(() => {
    if (!activeCity || !accessToken) return;
    previewLocationCoverage(accessToken, {
      regionId: activeCity.regionId ?? activeCity.id,
      latitude: activeLocation?.latitude ?? undefined,
      longitude: activeLocation?.longitude ?? undefined,
      coverageRadiusKm: radius,
    })
      .then((r) => {
        const mapped = r.establishments.map((e) => ({
          id: e.id,
          brandName: e.brandName,
          unitName: e.unitName,
          neighborhood: e.neighborhood,
          distanceKm: e.distanceKm,
          latitude: e.latitude,
          longitude: e.longitude,
        }));
        setMapEstablishments(mapped);
        setStoreCount(mapped.length);
      })
      .catch(() => {});
  }, [activeCity?.id, activeLocation?.latitude, activeLocation?.longitude, radius, accessToken]);

  const latestList = lists[0];
  const savings = latestList?.expectedSavings ?? 0;
  const itemCount = latestList?.items.length ?? 0;
  const optimizedCount = latestList?.items.filter((i) => i.optimizedProductVariantId).length ?? 0;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_322px]">
      <div className="stagger grid gap-5">
        {/* hero */}
        <div className="bg-brand-band relative overflow-hidden rounded-3xl px-7 py-6 text-white">
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-white/[0.06]" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="min-w-60 flex-1">
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold opacity-85">
                <SparklesIcon className="size-3.5 text-[var(--ds-savings-border)]" /> Próximo melhor passo
              </div>
              <h1 className="mt-1.5 font-heading text-[27px] font-bold tracking-tight text-balance">
                Continue sua lista e otimize preços
              </h1>
              <p className="mt-1.5 text-[14.5px] opacity-90">
                {latestList
                  ? `Sua lista "${latestList.name}" tem ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}. A última otimização economizou R$ ${savings.toFixed(2).replace('.', ',')}.`
                  : 'Crie sua primeira lista e descubra quanto você pode economizar.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {latestList ? (
                  <Button
                    onClick={() => navigate(`/otimizacao/${latestList.id}`)}
                    className="h-11 rounded-xl bg-white px-5 font-bold text-primary hover:bg-white/90"
                  >
                    Otimizar agora <ArrowRightIcon className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/listas/nova')}
                    className="h-11 rounded-xl bg-white px-5 font-bold text-primary hover:bg-white/90"
                  >
                    Criar lista <ArrowRightIcon className="size-4" />
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/listas')}
                  variant="outline"
                  className="h-11 rounded-xl border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
                >
                  Ver minhas listas
                </Button>
              </div>
            </div>
            {savings > 0 && (
              <div className="px-1.5 text-center">
                <div className="text-[12.5px] opacity-80">Economia estimada</div>
                <div className="font-heading text-[40px] font-extrabold leading-tight text-[var(--ds-savings-border)]">
                  R$ {savings.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-[12.5px] opacity-80">última lista otimizada</div>
              </div>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3.5">
          <StatCard
            icon={<ListChecksIcon />}
            label="Itens na lista"
            value={latestList ? `${optimizedCount} de ${itemCount}` : '—'}
            sub="lista ativa"
            deltaTone="neutral"
          />
          <StatCard
            icon={<ShieldCheckIcon />}
            label="Status"
            value={latestList?.latestOptimizationStatus === 'completed' ? 'Otimizada' : latestList ? 'Pendente' : '—'}
            delta={latestList?.latestOptimizationStatus === 'completed' ? 'pronta' : undefined}
          />
          <StatCard
            icon={<StoreIcon />}
            label="Lojas no raio"
            value={String(storeCount)}
            sub={`em ${radius} km`}
            deltaTone="neutral"
          />
        </div>

        {/* list + coverage */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ds-neutral-soft)] text-primary">
                <ListChecksIcon className="size-[19px]" />
              </span>
              <div className="flex-1">
                <div className="text-[12.5px] text-muted-foreground">Lista ativa</div>
                <div className="font-heading text-[17px] font-bold">
                  {latestList?.name ?? 'Nenhuma lista'}
                </div>
              </div>
              {latestList && (
                <StatusBadge
                  family="queue"
                  status={latestList.latestOptimizationStatus ?? 'queued'}
                  icon={Clock3Icon}
                  tone="savings"
                />
              )}
            </div>
            {latestList && (
              <>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--ds-neutral-soft)]">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: itemCount ? `${(optimizedCount / itemCount) * 100}%` : '0%' }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[12.5px]">
                  <span className="text-primary">{itemCount} {itemCount === 1 ? 'item' : 'itens'} na lista</span>
                  <span className="text-muted-foreground">
                    {latestList.latestOptimizationStatus === 'completed' ? 'Otimizada' : 'Pronta para otimizar'}
                  </span>
                </div>
              </>
            )}
            <div className="mt-4 flex gap-2.5">
              <Button variant="secondary" onClick={() => navigate('/listas')}>Ver lista</Button>
              {latestList && (
                <Button variant="ghost" onClick={() => navigate(`/listas/${latestList.id}`)}>Editar itens</Button>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl p-5">
            <div className="mb-3.5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ds-location-soft)] text-[var(--ds-location)]">
                <MapPinIcon className="size-[19px]" />
              </span>
              <div className="flex-1">
                <div className="text-[12.5px] text-muted-foreground">Cobertura local</div>
                <div className="font-heading text-[17px] font-bold">{storeCount} lojas no raio</div>
              </div>
              <StatusBadge tone="location">Raio {radius} km</StatusBadge>
            </div>
            <StoreMap height={150} center={mapCenter} radiusKm={radius} establishments={mapEstablishments} />
            <Button variant="outline" onClick={openCoverage} className="mt-3 w-full rounded-xl text-primary">
              <MapPinIcon className="size-[15px]" /> Ver mapa completo
            </Button>
          </Card>
        </div>

        {/* offers */}
        {offers.length > 0 && (
          <div>
            <SectionTitle action="Ver todas as ofertas" onAction={() => navigate('/ofertas')}>
              Ofertas recomendadas para você
            </SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {offers.map((o) => (
                <OfferCard key={o.id} offer={o} onClick={() => navigate('/ofertas')} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* right rail */}
      <div className="stagger sticky top-[86px] grid gap-4">
        <Card className="rounded-2xl p-5">
          <div className="mb-3 font-heading text-[15px] font-bold">Ações rápidas</div>
          <div className="grid gap-2">
            {([
              [SparklesIcon, 'Otimizar lista', '/listas'],
              [CameraIcon, 'Enviar nota fiscal', '/notas'],
              [StoreIcon, 'Explorar lojas', '/lojas'],
              [CoinsIcon, 'Ver cupons', '/cupons'],
            ] as const).map(([Icon, label, to]) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 px-3 text-left hover:bg-muted"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-neutral-soft)] text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-[13.5px] font-semibold">{label}</span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
