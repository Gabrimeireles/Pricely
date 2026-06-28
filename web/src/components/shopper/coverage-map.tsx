import { useState } from 'react';
import { MapPinIcon, StoreIcon } from 'lucide-react';

import { StatusBadge } from '@/components/design-system';

const PINS = [
  [34, 30], [62, 24], [26, 58], [72, 54], [48, 70], [40, 44], [80, 38], [56, 84],
] as const;
const NAMES = [
  'Mercado Centro', 'Carrefour V. Mariana', 'Atacadão Mooca', 'Assaí Ipiranga',
  'Extra Paulista', 'Dia Liberdade', 'Sonda Aclimação', 'Pão de Açúcar',
];

export function CoverageMap({
  height = 300,
  radiusKm = 5,
  stores = 8,
  interactive = true,
}: {
  height?: number;
  radiusKm?: number;
  stores?: number;
  interactive?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const pins = PINS.slice(0, stores);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        height,
        background: 'radial-gradient(120% 120% at 50% 40%, #eef4f1 0%, #e6efeb 60%, #dde9e4 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(120,150,140,.12) 0 26px, transparent 26px 27px), repeating-linear-gradient(90deg, rgba(120,150,140,.12) 0 30px, transparent 30px 31px)',
        }}
      />
      <div className="absolute inset-x-0 top-[46%] h-2 bg-white/70" />
      <div className="absolute inset-y-0 left-[54%] w-2 bg-white/70" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-[74%] rounded-full border-[1.5px] border-dashed border-[var(--ds-location-border)] bg-[color-mix(in_oklab,var(--ds-location)_7%,transparent)]" />
        <div className="absolute size-[40%] rounded-full border-[1.5px] border-dashed border-[var(--ds-location-border)]" />
        <div className="absolute size-3.5 rounded-full bg-[var(--ds-location)] shadow-[0_0_0_5px_color-mix(in_oklab,var(--ds-location)_25%,transparent)]" />
      </div>

      {pins.map(([l, t], i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => setActive(i)}
          className="absolute -translate-x-1/2 -translate-y-full p-1"
          style={{ left: `${l}%`, top: `${t}%` }}
        >
          <span
            className="flex size-[30px] items-center justify-center rounded-[999px_999px_999px_2px] shadow-[var(--shadow-card)]"
            style={{
              transform: 'rotate(45deg)',
              background: active === i ? '#0c3f3a' : 'var(--ds-primary)',
            }}
          >
            <StoreIcon className="size-[15px] text-white" style={{ transform: 'rotate(-45deg)' }} />
          </span>
        </button>
      ))}

      {active !== null ? (
        <div className="animate-pop absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-xl bg-card p-2.5 px-3 shadow-[var(--shadow-pop)]">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--ds-neutral-soft)] text-primary">
            <StoreIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">{NAMES[active]}</div>
            <div className="text-xs text-muted-foreground">
              {(1 + active * 0.4).toFixed(1)} km · dentro do raio
            </div>
          </div>
          <StatusBadge family="freshness" status="fresh" label="Aberto" />
        </div>
      ) : (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-card)]">
          <MapPinIcon className="size-3.5 text-[var(--ds-location)]" /> Raio {radiusKm} km · {stores} lojas
        </div>
      )}
    </div>
  );
}
