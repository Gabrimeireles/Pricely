import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircleIcon, ChevronRightIcon, MapPinIcon, StoreIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHead, SectionTitle } from '@/components/shopper/section';
import { StatCard } from '@/components/shopper/stat-card';
import { StoreMap, type StoreMapEstablishment } from '@/components/shopper/store-map';
import { previewLocationCoverage } from '@/app/api';
import { usePricely } from '@/app/pricely-context';
import { RADII } from '@/app/shopper-data';

import { useLocationCtx } from './shopper-shell';

const MAX_RADIUS = RADII[RADII.length - 1];

export function StoresPage() {
  const navigate = useNavigate();
  const { city, radius, openCoverage, setRadius, locationSource, locationLabel, postalCode, openLocationPrompt } = useLocationCtx();
  const { cityId, cities, locationPreferences, accessToken } = usePricely();
  const [establishments, setEstablishments] = useState<StoreMapEstablishment[]>([]);
  const [storeCount, setStoreCount] = useState(city.stores);
  const [loading, setLoading] = useState(false);

  const activeCity = cities.find((c) => c.id === cityId) ?? cities[0];
  const activeLocation = locationPreferences.find(
    (p) => p.isDefault && p.regionSlug === cityId,
  ) ?? null;

  const mapCenter = activeLocation?.latitude && activeLocation?.longitude
    ? { lat: activeLocation.latitude, lng: activeLocation.longitude }
    : null;

  useEffect(() => {
    if (!activeCity || !accessToken) return;

    setLoading(true);
    previewLocationCoverage(accessToken, {
      regionId: activeCity.regionId ?? activeCity.id,
      latitude: activeLocation?.latitude ?? undefined,
      longitude: activeLocation?.longitude ?? undefined,
      coverageRadiusKm: radius,
    })
      .then((r) => {
        setStoreCount(r.activeEstablishmentCount);
        setEstablishments(
          r.establishments.map((e) => ({
            id: e.id,
            brandName: e.brandName,
            unitName: e.unitName,
            neighborhood: e.neighborhood,
            distanceKm: e.distanceKm,
            latitude: e.latitude,
            longitude: e.longitude,
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCity?.id, activeLocation?.latitude, activeLocation?.longitude, radius, accessToken]);

  const isMaxRadius = radius >= MAX_RADIUS;

  const nextRadius = (() => {
    const idx = RADII.indexOf(radius as typeof RADII[number]);
    return idx >= 0 && idx < RADII.length - 1 ? RADII[idx + 1] : MAX_RADIUS;
  })();

  return (
    <div>
      <PageHead
        title="Lojas"
        subtitle={(() => {
          const loc = locationLabel ?? (postalCode ? `CEP ${postalCode.replace(/\D/g,'').replace(/(\d{5})(\d{3})/,'$1-$2')}` : city.name);
          return `${storeCount} loja${storeCount !== 1 ? 's' : ''} ativa${storeCount !== 1 ? 's' : ''} em ${loc} · raio de ${radius} km`;
        })()}
        actions={
          <Button variant="outline" onClick={openCoverage}>
            <MapPinIcon className="size-[15px]" /> Mapa completo
          </Button>
        }
      />

      {!activeLocation && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)] p-4">
          <MapPinIcon className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-[13.5px]">
            Adicione sua localização para ver as lojas dentro do seu raio e a distância até cada uma.
          </p>
          <Button size="sm" onClick={openLocationPrompt}>Adicionar</Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-2xl border border-border">
          <StoreMap
            height={360}
            center={mapCenter}
            radiusKm={radius}
            establishments={establishments}
          />
        </div>

        <div className="grid gap-3 self-start">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Lojas no raio" value={String(storeCount)} delta="ativas" />
            <StatCard label="Raio atual" value={`${radius} km`} deltaTone="neutral" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="font-heading text-[15px] font-bold">Sobre a cobertura</div>

            {storeCount === 0 && !isMaxRadius && (
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-[var(--ds-warning-soft,#fefce8)] p-3">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-[var(--ds-warning,#854d0e)]" />
                <p className="text-[13px] text-[var(--ds-warning,#854d0e)]">
                  Nenhuma loja encontrada em {radius} km. Tente ampliar o raio.
                </p>
              </div>
            )}

            {storeCount === 0 && isMaxRadius ? (
              <p className="mt-1.5 text-pretty text-[13.5px] text-muted-foreground">
                Nenhuma loja com dados de preço disponível nesta região ainda. Estamos expandindo a cobertura.
              </p>
            ) : (
              <p className="mt-1.5 text-pretty text-[13.5px] text-muted-foreground">
                Mostramos apenas lojas com dados de preço recentes no seu raio.
                {!isMaxRadius && ' Amplie o raio para incluir mais lojas e variar as ofertas.'}
              </p>
            )}

            {isMaxRadius ? (
              <p className="mt-3 text-[13px] font-medium text-muted-foreground">
                Raio máximo atingido ({MAX_RADIUS} km)
              </p>
            ) : (
              <Button
                variant="ghost"
                className="mt-2.5 text-primary"
                onClick={() => setRadius(nextRadius)}
              >
                <MapPinIcon className="size-[15px]" /> Ampliar raio ({radius} → {nextRadius} km)
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>Lojas no seu raio</SectionTitle>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : establishments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-[14px] text-muted-foreground">
            {locationSource
              ? `Nenhuma loja com dados de preço no raio de ${radius} km.`
              : 'Adicione sua localização para ver as lojas próximas.'}
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {establishments.map((store) => (
              <div
                key={store.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted"
                onClick={() => navigate(`/ofertas?store=${encodeURIComponent(store.brandName)}`)}
              >
                <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[13px] bg-[var(--ds-neutral-soft)] text-primary">
                  <StoreIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold">{store.brandName}</div>
                  <div className="text-[13px] text-muted-foreground">{store.unitName}</div>
                  <div className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                    <MapPinIcon className="size-3" />
                    {store.distanceKm != null ? `${store.distanceKm.toFixed(1)} km · ` : ''}{store.neighborhood}
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
