import { useEffect, useState } from 'react';
import { CheckCircle2Icon, MapPinIcon } from 'lucide-react';

import { StatusBadge } from '@/components/design-system';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { previewLocationCoverage } from '@/app/api';
import { usePricely } from '@/app/pricely-context';
import { CITIES, RADII, type City } from '@/app/shopper-data';

import { StoreMap, type StoreMapEstablishment } from './store-map';

export function RadiusSelect({
  radius,
  onChange,
}: {
  radius: number;
  onChange: (km: number) => void;
}) {
  return (
    <Select value={String(radius)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="h-[42px] gap-1.5 rounded-xl" aria-label="Raio de busca">
        <MapPinIcon className="size-4 text-[var(--ds-location)]" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RADII.map((r) => (
          <SelectItem key={r} value={String(r)}>
            Raio {r} km
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CityDialog({
  open,
  onOpenChange,
  current,
  onPick,
  items,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  current: City;
  onPick: (c: City) => void;
  items?: City[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 rounded-3xl p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="font-heading text-lg">Escolha sua cidade</DialogTitle>
          <DialogDescription>Resultados e ofertas dependem da cidade ativa</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5 p-3">
          {(items ?? CITIES).map((c) => {
            const disabled = c.status === 'activating';
            const selected = current.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onPick(c);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                  selected
                    ? 'border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)]'
                    : 'border-border bg-card hover:bg-muted',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-neutral-soft)] text-primary">
                  <MapPinIcon className="size-[19px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[13px] text-muted-foreground">
                    {disabled ? 'Em ativação · sem lojas ainda' : `${c.stores} lojas ativas`}
                  </div>
                </div>
                <StatusBadge family="city" status={c.status} />
                {selected ? <CheckCircle2Icon className="size-5 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CoverageDialog({
  open,
  onOpenChange,
  city,
  radius,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  city: City;
  radius: number;
}) {
  const { locationPreferences, accessToken, cityId, cities } = usePricely();
  const [establishments, setEstablishments] = useState<StoreMapEstablishment[]>([]);
  const [storeCount, setStoreCount] = useState(city.stores);

  const activeCity = cities.find((c) => c.id === cityId) ?? cities[0];
  const activeLocation = locationPreferences.find(
    (p) => p.isDefault && p.regionSlug === cityId,
  ) ?? null;
  const mapCenter = activeLocation?.latitude && activeLocation?.longitude
    ? { lat: activeLocation.latitude, lng: activeLocation.longitude }
    : null;

  useEffect(() => {
    if (!open || !activeCity || !accessToken) return;
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
      .catch(() => {});
  }, [open, activeCity?.id, activeLocation?.latitude, activeLocation?.longitude, radius, accessToken]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Cobertura — {city.name}</DialogTitle>
          <DialogDescription>
            {storeCount} loja{storeCount !== 1 ? 's' : ''} ativa{storeCount !== 1 ? 's' : ''} no raio de {radius} km
          </DialogDescription>
        </DialogHeader>
        <StoreMap height={420} center={mapCenter} radiusKm={radius} establishments={establishments} />
        <div className="grid grid-cols-2 gap-3">
          {([
            ['Lojas no raio', `${storeCount} loja${storeCount !== 1 ? 's' : ''}`, 'text-[var(--ds-location)]'],
            ['Raio atual', `${radius} km`, 'text-foreground'],
          ] as const).map(([k, v, c]) => (
            <Card key={k} className="rounded-2xl p-3.5">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className={cn('font-heading text-lg font-bold', c)}>{v}</div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
