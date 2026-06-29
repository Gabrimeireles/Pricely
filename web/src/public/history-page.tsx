import { ListChecksIcon, TrendingUpIcon, XCircleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { StatusBadge } from '@/components/design-system';
import { PageHead } from '@/components/shopper/section';
import { StatCard } from '@/components/shopper/stat-card';
import { usePricely } from '@/app/pricely-context';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmt(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { lists } = usePricely();

  const optimized = lists.filter(
    (l) => l.latestOptimizationStatus === 'completed' || l.latestOptimizationStatus === 'failed',
  );

  const totalSavings = optimized
    .filter((l) => l.latestOptimizationStatus === 'completed')
    .reduce((sum, l) => sum + (l.expectedSavings ?? 0), 0);

  return (
    <div>
      <PageHead title="Histórico" subtitle="Suas otimizações anteriores e quanto você economizou" />

      <div className="mb-5 grid grid-cols-2 gap-3.5">
        <StatCard
          icon={<TrendingUpIcon />}
          label="Economia total"
          value={fmt(totalSavings)}
          delta="nas listas"
        />
        <StatCard
          icon={<ListChecksIcon />}
          label="Otimizações"
          value={String(optimized.length)}
          deltaTone="neutral"
          sub="listas otimizadas"
        />
      </div>

      {optimized.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-[14px] text-muted-foreground">
          Nenhuma lista otimizada ainda. Crie uma lista e execute a otimização para ver o histórico aqui.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {optimized.map((list, i) => {
            const status = list.latestOptimizationStatus ?? 'queued';
            const savings = list.expectedSavings ?? 0;
            const date = list.updatedAt ? formatDate(list.updatedAt) : '—';
            return (
              <div
                key={list.id}
                onClick={() => navigate(`/otimizacao/${list.id}`)}
                className={`flex cursor-pointer items-center gap-3.5 p-4 hover:bg-muted ${i ? 'border-t border-border' : ''}`}
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: status === 'failed' ? 'var(--ds-critical-soft)' : 'var(--ds-savings-soft)',
                    color: status === 'failed' ? 'var(--ds-critical)' : 'var(--ds-savings)',
                  }}
                >
                  {status === 'failed' ? (
                    <XCircleIcon className="size-5" />
                  ) : (
                    <TrendingUpIcon className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{list.name}</div>
                  <div className="text-[12.5px] text-muted-foreground">
                    {date} · {list.items.length} {list.items.length === 1 ? 'item' : 'itens'}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[12.5px] tabular-nums"
                    style={{ color: savings > 0 ? 'var(--ds-savings)' : 'var(--ds-muted-text)' }}
                  >
                    economia {fmt(savings)}
                  </div>
                </div>
                <StatusBadge family="queue" status={status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
