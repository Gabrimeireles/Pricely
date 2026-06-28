import { ListChecksIcon, ShieldCheckIcon, TrendingUpIcon, XCircleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { StatusBadge } from '@/components/design-system';
import { PageHead } from '@/components/shopper/section';
import { StatCard } from '@/components/shopper/stat-card';

const HISTORY: [string, string, string, string, string, string][] = [
  ['Hoje, 08:32', 'Compra da semana', 'R$ 142,80', 'R$ 18,40', '2 paradas', 'completed'],
  ['09/05, 19:14', 'Reposição rápida', 'R$ 64,30', 'R$ 7,90', '1 parada', 'completed'],
  ['02/05, 11:02', 'Compra do mês', 'R$ 388,10', 'R$ 41,20', '3 paradas', 'completed'],
  ['24/04, 20:40', 'Churrasco fds', 'R$ 156,00', 'R$ 0,00', '1 parada', 'failed'],
  ['18/04, 09:55', 'Compra da semana', 'R$ 138,70', 'R$ 15,60', '2 paradas', 'completed'],
];

export function HistoryPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHead title="Histórico" subtitle="Suas otimizações anteriores e quanto você economizou" />

      <div className="mb-5 grid grid-cols-3 gap-3.5">
        <StatCard icon={<TrendingUpIcon />} label="Economia total" value="R$ 83,10" delta="30 dias" />
        <StatCard icon={<ListChecksIcon />} label="Otimizações" value="5" deltaTone="neutral" sub="últimas 4 semanas" />
        <StatCard icon={<ShieldCheckIcon />} label="Confiança média" value="82/100" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {HISTORY.map(([date, name, total, save, stops, status], i) => (
          <div
            key={date}
            onClick={() => navigate('/otimizacao/1')}
            className={`flex cursor-pointer items-center gap-3.5 p-4 hover:bg-muted ${i ? 'border-t border-border' : ''}`}
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: status === 'failed' ? 'var(--ds-critical-soft)' : 'var(--ds-savings-soft)',
                color: status === 'failed' ? 'var(--ds-critical)' : 'var(--ds-savings)',
              }}
            >
              {status === 'failed' ? <XCircleIcon className="size-5" /> : <TrendingUpIcon className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{name}</div>
              <div className="text-[12.5px] text-muted-foreground">{date} · {stops}</div>
            </div>
            <div className="text-right">
              <div className="font-bold tabular-nums">{total}</div>
              <div
                className="text-[12.5px] tabular-nums"
                style={{ color: save === 'R$ 0,00' ? 'var(--ds-muted-text)' : 'var(--ds-savings)' }}
              >
                economia {save}
              </div>
            </div>
            <StatusBadge family="queue" status={status} />
          </div>
        ))}
      </div>
    </div>
  );
}
