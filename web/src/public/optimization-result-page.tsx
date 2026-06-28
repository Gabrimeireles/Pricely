import { useState } from 'react';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ListChecksIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XCircleIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { EvidenceModule, StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHead, SectionTitle } from '@/components/shopper/section';
import { useLocationCtx } from './shopper-shell';

type TrustLevel = 'high' | 'medium' | 'low' | 'unknown';
type ItemData = {
  item: string;
  qty: string;
  img: string;
  rule: string;
  rtone: string;
  variant: string;
  store: string;
  unit: string;
  total: string;
  trust: TrustLevel;
  score: number;
  ev: string;
};

const ITEMS: ItemData[] = [
  { item: 'Arroz tipo 1', qty: '2 un · 1kg', img: 'arroz.png', rule: 'Qualquer variante', rtone: 'primary', variant: 'Camil Arroz tipo 1 1kg', store: 'Mercado Centro · 1,2 km', unit: 'R$ 7,90', total: 'R$ 15,80', trust: 'high', score: 82, ev: '4 notas · há 3d' },
  { item: 'Café torrado', qty: '1 un · 500g', img: 'cafe.png', rule: 'Marca preferida', rtone: 'warning', variant: 'Melitta Tradicional 500g', store: 'Mercado Centro · 1,2 km', unit: 'R$ 16,80', total: 'R$ 16,80', trust: 'medium', score: 75, ev: '2 notas · há 5d' },
  { item: 'Leite integral', qty: '6 un · 1L', img: 'leite.png', rule: 'Variante exata', rtone: 'location', variant: 'Italac Integral 1L', store: 'Atacadão Mooca · 3,4 km', unit: 'R$ 5,49', total: 'R$ 32,94', trust: 'high', score: 88, ev: '7 notas · há 2d' },
  { item: 'Feijão carioca', qty: '1 un · 1kg', img: 'feijao.png', rule: 'Qualquer variante', rtone: 'primary', variant: 'Camil Tipo 1 1kg', store: 'Mercado Centro · 1,2 km', unit: 'R$ 6,39', total: 'R$ 6,39', trust: 'high', score: 84, ev: '3 notas · há 4d' },
];

function Metric({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="font-heading text-[21px] font-bold tabular-nums" style={color ? { color } : undefined}>{value}</div>
      {sub ? <div className="text-[11.5px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function ItemRow({ d, open, onToggle }: { d: ItemData; open: boolean; onToggle: () => void }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: open ? 'var(--ds-primary)' : undefined, boxShadow: 'var(--shadow-card)' }}
    >
      <div className="grid items-center gap-3.5 p-3.5 sm:grid-cols-[1.5fr_1.6fr_0.9fr_1.3fr_auto]">
        <div className="flex gap-2.5 min-w-0">
          <div className="size-[46px] shrink-0 overflow-hidden rounded-[11px] bg-[var(--ds-neutral-soft)]">
            <img src={`/assets/products/${d.img}`} alt={d.item} className="size-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">{d.item}</div>
            <div className="text-[12px] text-muted-foreground">{d.qty}</div>
            <StatusBadge className="mt-1" tone={d.rtone as any} icon={null}>{d.rule}</StatusBadge>
          </div>
        </div>
        <div className="min-w-0 hidden sm:block">
          <div className="text-[13.5px] font-semibold">{d.variant}</div>
          <div className="text-[12px] text-muted-foreground">{d.store}</div>
        </div>
        <div className="hidden sm:block tabular-nums">
          <div className="font-bold">{d.unit}</div>
          <div className="text-[12px] text-muted-foreground">{d.total} total</div>
        </div>
        <div className="hidden sm:grid gap-1">
          <StatusBadge family="trust" status={d.trust}>{d.trust === 'high' ? 'Alta' : 'Média'} {d.score}/100</StatusBadge>
          <div className="text-[11.5px] text-muted-foreground">{d.ev}</div>
        </div>
        <button
          type="button"
          aria-label="Ver evidência"
          onClick={onToggle}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
        >
          {open ? <ChevronDownIcon className="size-[18px]" /> : <ChevronRightIcon className="size-[18px]" />}
        </button>
      </div>
      {open ? (
        <div className="px-3.5 pb-3.5">
          <EvidenceModule
            title="Evidência da oferta selecionada"
            trustLevel={d.trust}
            trustScore={d.score}
            requestedRule={d.rule}
            selectedVariant={d.variant}
            store={d.store}
            price={d.unit}
            sourceLabel="Recibo de usuário"
            evidenceCount={4}
            freshnessLabel="Validado recentemente"
            confidenceNotice="Preço observado em recibo recente. Pode variar conforme promoções e disponibilidade."
            reportAction={<Button variant="outline" size="sm">Reportar preço</Button>}
          />
        </div>
      ) : null}
    </div>
  );
}

export function OptimizationResultPage() {
  const navigate = useNavigate();
  const { radius } = useLocationCtx();
  const [open, setOpen] = useState(0);

  return (
    <div className="pb-20">
      <button
        type="button"
        onClick={() => navigate('/lista')}
        className="mb-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--ds-location)] hover:underline"
      >
        <ArrowRightIcon className="size-3.5 rotate-180" /> Voltar para a lista
      </button>

      <PageHead
        title="Resultado da otimização"
        subtitle="Compra da semana · otimizado em 12/05 às 10:24"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info('Recalculando…')}>
              <SparklesIcon className="size-4" /> Recalcular
            </Button>
            <Button onClick={() => toast.success('Checklist aberto (demo)')} className="bg-[#134e48] hover:bg-[#0f3f3a]">
              <ListChecksIcon className="size-4" /> Abrir checklist
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_322px]">
        <div className="grid gap-4">
          <Card className="rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
              <Metric label="Custo estimado" value="R$ 142,80" color="var(--ds-primary)" />
              <Metric label="Economia" value="R$ 18,40" color="var(--ds-savings)" sub="vs. alternativas" />
              <Metric label="Cobertura" value="10 de 12" sub="83% atendidos" />
              <Metric label="Lojas no raio" value="8" sub={`até ${radius} km`} />
              <Metric label="Paradas" value="2" sub="trajeto otimizado" />
            </div>
          </Card>

          <Card className="flex flex-wrap items-center gap-4 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-[18px] text-[var(--ds-location)]" />
              <div>
                <div className="text-[12px] text-[var(--ds-location)]">Modo</div>
                <div className="text-[13.5px] font-semibold">Menor preço perto de mim</div>
              </div>
            </div>
            <div className="hidden h-[30px] w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-[18px] text-[var(--ds-savings)]" />
              <div>
                <div className="text-[12px] text-muted-foreground">Precisão</div>
                <div className="text-[13.5px] font-semibold">Alta · 9 itens confiança alta</div>
              </div>
            </div>
            <div className="hidden h-[30px] w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="size-[18px] text-[var(--ds-warning)]" />
              <div>
                <div className="text-[12px] text-[var(--ds-warning)]">Avisos</div>
                <div className="text-[13.5px] font-semibold">1 item indisponível</div>
              </div>
            </div>
          </Card>

          <SectionTitle>Itens otimizados ({ITEMS.length})</SectionTitle>
          <div className="grid gap-3">
            {ITEMS.map((d, i) => (
              <ItemRow key={i} d={d} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            ))}
          </div>
        </div>

        <div className="sticky top-[86px] grid gap-4 self-start">
          <Card className="rounded-2xl p-4">
            <div className="font-heading text-[15px] font-bold">Plano de compras</div>
            <div className="mb-3 text-[12.5px] text-muted-foreground">2 paradas · 6,3 km estimados</div>
            {[
              ['1', 'Mercado Centro', 'Centro · 1,2 km', '4 itens', 'var(--ds-primary)'],
              ['2', 'Atacadão Mooca', 'Mooca · 3,4 km', '5 itens', '#0c3f3a'],
            ].map(([n, s, m, c, bg], i) => (
              <div key={n} className={`flex items-center gap-2.5 py-2.5 ${i ? 'border-t border-border' : ''}`}>
                <span
                  className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ background: bg }}
                >
                  {n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{s}</div>
                  <div className="text-[11.5px] text-muted-foreground">{m}</div>
                </div>
                <StatusBadge tone="primary" icon={null}>{c}</StatusBadge>
              </div>
            ))}
            <Button variant="outline" className="mt-3 w-full rounded-xl text-primary" onClick={() => toast.info('Mapa (demo)')}>
              <MapPinIcon className="size-[15px]" /> Ver trajeto no mapa
            </Button>
          </Card>

          <div className="rounded-2xl border border-[var(--ds-critical-border)] bg-[var(--ds-critical-soft)] p-4">
            <div className="flex items-center gap-2">
              <XCircleIcon className="size-[17px] text-[var(--ds-critical)]" />
              <span className="text-[14px] font-bold text-[var(--ds-critical)]">1 item indisponível</span>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Azeite extra virgem 500ml não foi encontrado nas lojas do seu raio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
