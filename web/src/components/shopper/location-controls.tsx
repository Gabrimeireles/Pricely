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
import { CITIES, RADII, type City } from '@/app/shopper-data';

import { CoverageMap } from './coverage-map';

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
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  current: City;
  onPick: (c: City) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 rounded-3xl p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="font-heading text-lg">Escolha sua cidade</DialogTitle>
          <DialogDescription>Resultados e ofertas dependem da cidade ativa</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5 p-3">
          {CITIES.map((c) => {
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Cobertura — {city.name}</DialogTitle>
          <DialogDescription>
            {city.stores} lojas ativas no raio de {radius} km
          </DialogDescription>
        </DialogHeader>
        <CoverageMap height={420} radiusKm={radius} stores={city.stores} />
        <div className="grid grid-cols-3 gap-3">
          {([
            ['Cobertura da área', '100%', 'text-[var(--ds-savings)]'],
            ['Lojas no raio', `${city.stores} lojas`, 'text-[var(--ds-location)]'],
            ['Atualizado', 'há 15 min', 'text-foreground'],
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
