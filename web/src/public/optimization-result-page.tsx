import { useEffect, useState } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';

import { EvidenceModule, StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHead, SectionTitle } from '@/components/shopper/section';
import { usePricely } from '@/app/pricely-context';
import { useLocationCtx } from './shopper-shell';

type TrustLevel = 'high' | 'medium' | 'low' | 'unknown';

type ItemData = {
  itemId: string;
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
  evidenceCount: number;
  confidenceNotice?: string;
};

const RULE_MAP: Record<string, { label: string; tone: string }> = {
  any: { label: 'Qualquer variante', tone: 'primary' },
  preferred: { label: 'Marca preferida', tone: 'warning' },
  exact: { label: 'Variante exata', tone: 'location' },
};

function priceStr(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

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
            {d.img ? (
              <img src={d.img} alt={d.item} className="size-full object-contain" />
            ) : (
              <div className="size-full" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold">{d.item}</div>
            <div className="text-[12px] text-muted-foreground">{d.qty}</div>
            <StatusBadge className="mt-1" tone={d.rtone as 'primary' | 'warning' | 'location' | 'savings' | 'neutral'} icon={null}>{d.rule}</StatusBadge>
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
          <StatusBadge family="trust" status={d.trust}>{d.trust === 'high' ? 'Alta' : d.trust === 'medium' ? 'Média' : 'Baixa'} {d.score}/100</StatusBadge>
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
            evidenceCount={d.evidenceCount}
            freshnessLabel="Validado recentemente"
            confidenceNotice={d.confidenceNotice ?? 'Preço observado em recibo recente. Pode variar conforme promoções e disponibilidade.'}
            reportAction={<Button variant="outline" size="sm">Reportar preço</Button>}
          />
        </div>
      ) : null}
    </div>
  );
}

export function OptimizationResultPage() {
  const navigate = useNavigate();
  const { listId } = useParams<{ listId: string }>();
  const { radius } = useLocationCtx();
  const { optimizationResults, loadLatestOptimization, lists } = usePricely();
  const [open, setOpen] = useState(-1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!listId) return;
    if (!optimizationResults[listId]) {
      setLoading(true);
      void loadLatestOptimization(listId).finally(() => setLoading(false));
    }
  }, [listId]);

  const result = listId ? optimizationResults[listId] : undefined;
  const list = lists.find((l) => l.id === listId);

  if (loading && !result) {
    return (
      <div className="pb-20">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <XCircleIcon className="size-10 text-muted-foreground" />
        <p className="text-[15px] text-muted-foreground">Nenhum resultado de otimização encontrado para esta lista.</p>
        <Button variant="outline" onClick={() => navigate('/listas')}>Voltar para listas</Button>
      </div>
    );
  }

  const selectedSelections = result.selections.filter((s) => s.selectionStatus === 'selected');
  const missingSelections = result.selections.filter((s) => s.selectionStatus === 'missing');

  const items: ItemData[] = selectedSelections.map((s) => {
    const listItem = list?.items.find((i) => i.id === s.shoppingListItemId);
    const brandMode = listItem?.brandPreferenceMode ?? 'any';
    const ruleInfo = RULE_MAP[brandMode] ?? RULE_MAP['any'];
    const qty = listItem
      ? `${listItem.quantity} ${listItem.unitLabel}`
      : '';
    const storeLabel = [s.establishmentName, s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : s.establishmentNeighborhood]
      .filter(Boolean)
      .join(' · ');
    const freshLabel = s.trustFreshnessDays != null
      ? s.trustFreshnessDays === 0 ? 'hoje' : `há ${s.trustFreshnessDays}d`
      : s.observedAt ? formatDate(s.observedAt) : '';
    const evLabel = [
      s.trustEvidenceCount != null ? `${s.trustEvidenceCount} nota${s.trustEvidenceCount !== 1 ? 's' : ''}` : '',
      freshLabel,
    ].filter(Boolean).join(' · ');

    return {
      itemId: s.id ?? s.shoppingListItemId,
      item: s.shoppingListItemName,
      qty,
      img: s.selectedVariantImageUrl ?? '',
      rule: ruleInfo.label,
      rtone: ruleInfo.tone,
      variant: [s.selectedVariantName, s.selectedPackageLabel].filter(Boolean).join(' '),
      store: storeLabel,
      unit: s.priceAmount != null ? priceStr(s.priceAmount) : '—',
      total: s.estimatedCost != null ? priceStr(s.estimatedCost) : '—',
      trust: (s.trustLevel ?? 'unknown') as TrustLevel,
      score: Math.round(s.trustFactor ?? 0),
      ev: evLabel,
      evidenceCount: s.trustEvidenceCount ?? 0,
      confidenceNotice: s.confidenceNotice,
    };
  });

  // Build store plan
  const storeMap = new Map<string, { distanceKm?: number; neighborhood?: string; count: number }>();
  for (const s of selectedSelections) {
    if (!s.establishmentName) continue;
    const existing = storeMap.get(s.establishmentName);
    if (existing) {
      existing.count += 1;
    } else {
      storeMap.set(s.establishmentName, {
        distanceKm: s.distanceKm ?? undefined,
        neighborhood: s.establishmentNeighborhood ?? undefined,
        count: 1,
      });
    }
  }
  const storePlan = Array.from(storeMap.entries())
    .sort((a, b) => (a[1].distanceKm ?? 99) - (b[1].distanceKm ?? 99));

  const distinctStoreCount = storeMap.size;
  const coveredCount = selectedSelections.length;
  const totalCount = result.selections.length;
  const coveragePct = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;

  const completedAt = result.completedAt ? formatDate(result.completedAt) : '';
  const listName = list?.name ?? 'Lista';

  return (
    <div className="pb-20">
      <button
        type="button"
        onClick={() => navigate('/listas')}
        className="mb-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--ds-location)] hover:underline"
      >
        <ArrowRightIcon className="size-3.5 rotate-180" /> Voltar para listas
      </button>

      <PageHead
        title="Resultado da otimização"
        subtitle={`${listName}${completedAt ? ` · otimizado em ${completedAt}` : ''}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                toast.info('Recalculando…');
                if (listId) void loadLatestOptimization(listId);
              }}
            >
              <SparklesIcon className="size-4" /> Recalcular
            </Button>
            <Button
              onClick={() => listId && navigate(`/listas/${listId}/checklist`)}
              className="bg-[#134e48] hover:bg-[#0f3f3a]"
            >
              <ListChecksIcon className="size-4" /> Abrir checklist
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_322px]">
        <div className="grid gap-4">
          <Card className="rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
              <Metric
                label="Custo estimado"
                value={result.totalEstimatedCost != null ? priceStr(result.totalEstimatedCost) : '—'}
                color="var(--ds-primary)"
              />
              <Metric
                label="Economia"
                value={result.estimatedSavings != null ? priceStr(result.estimatedSavings) : '—'}
                color="var(--ds-savings)"
                sub="vs. alternativas"
              />
              <Metric
                label="Cobertura"
                value={`${coveredCount} de ${totalCount}`}
                sub={`${coveragePct}% atendidos`}
              />
              <Metric label="Lojas no raio" value={String(distinctStoreCount)} sub={`até ${radius} km`} />
              <Metric label="Paradas" value={String(storePlan.length)} sub="trajeto otimizado" />
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
                <div className="text-[13.5px] font-semibold">
                  {selectedSelections.filter((s) => s.trustLevel === 'high').length} itens alta confiança
                </div>
              </div>
            </div>
            {missingSelections.length > 0 && (
              <>
                <div className="hidden h-[30px] w-px bg-border sm:block" />
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="size-[18px] text-[var(--ds-warning)]" />
                  <div>
                    <div className="text-[12px] text-[var(--ds-warning)]">Avisos</div>
                    <div className="text-[13.5px] font-semibold">
                      {missingSelections.length} {missingSelections.length === 1 ? 'item indisponível' : 'itens indisponíveis'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>

          <SectionTitle>Itens otimizados ({items.length})</SectionTitle>
          <div className="grid gap-3">
            {items.map((d, i) => (
              <ItemRow key={d.itemId} d={d} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            ))}
          </div>
        </div>

        <div className="sticky top-[86px] grid gap-4 self-start">
          <Card className="rounded-2xl p-4">
            <div className="font-heading text-[15px] font-bold">Plano de compras</div>
            <div className="mb-3 text-[12.5px] text-muted-foreground">
              {storePlan.length} {storePlan.length === 1 ? 'parada' : 'paradas'}
              {storePlan.length > 0 && storePlan[storePlan.length - 1][1].distanceKm != null
                ? ` · até ${storePlan[storePlan.length - 1][1].distanceKm!.toFixed(1)} km`
                : ''}
            </div>
            {storePlan.map(([name, info], i) => (
              <div key={name} className={`flex items-center gap-2.5 py-2.5 ${i ? 'border-t border-border' : ''}`}>
                <span
                  className="flex size-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ background: i === 0 ? 'var(--ds-primary)' : '#0c3f3a' }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{name}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {info.neighborhood ?? ''}{info.distanceKm != null ? ` · ${info.distanceKm.toFixed(1)} km` : ''}
                  </div>
                </div>
                <StatusBadge tone="primary" icon={null}>{info.count} {info.count === 1 ? 'item' : 'itens'}</StatusBadge>
              </div>
            ))}
            <Button variant="outline" className="mt-3 w-full rounded-xl text-primary" onClick={() => toast.info('Mapa em breve')}>
              <MapPinIcon className="size-[15px]" /> Ver trajeto no mapa
            </Button>
          </Card>

          {missingSelections.length > 0 && (
            <div className="rounded-2xl border border-[var(--ds-critical-border)] bg-[var(--ds-critical-soft)] p-4">
              <div className="flex items-center gap-2">
                <XCircleIcon className="size-[17px] text-[var(--ds-critical)]" />
                <span className="text-[14px] font-bold text-[var(--ds-critical)]">
                  {missingSelections.length} {missingSelections.length === 1 ? 'item indisponível' : 'itens indisponíveis'}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {missingSelections.map((s) => (
                  <li key={s.shoppingListItemId} className="text-[13px] text-muted-foreground">
                    · {s.shoppingListItemName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
