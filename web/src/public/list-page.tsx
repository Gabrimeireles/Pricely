import { useState } from 'react';
import { ArrowRightIcon, FileTextIcon, MinusIcon, PlusIcon, SearchIcon, XCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LIST_SEED, BRAND_RULES, type ListItem } from '@/app/shopper-data';
import { PageHead } from '@/components/shopper/section';
import { StickyActionBar } from '@/components/design-system';
import { useLocationCtx } from './shopper-shell';
import { useNavigate } from 'react-router-dom';

function RuleChip({ value, onChange }: { value: ListItem['rule']; onChange: (r: ListItem['rule']) => void }) {
  return (
    <div className="inline-flex gap-1">
      {BRAND_RULES.map(({ value: v, label, tone }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-all',
            value === v
              ? `border-[var(--ds-${tone}-border)] bg-[var(--ds-${tone}-soft)] text-[var(--ds-${tone})]`
              : 'border-border bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ListPage() {
  const navigate = useNavigate();
  const { city } = useLocationCtx();
  const [items, setItems] = useState<ListItem[]>(LIST_SEED);

  const set = (i: number, patch: Partial<ListItem>) =>
    setItems((xs) => xs.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => {
    setItems((xs) => xs.filter((_, j) => j !== i));
    toast.info('Item removido');
  };

  const total = items.reduce((s, it) => s + it.qty, 0);

  return (
    <div className="pb-20">
      <PageHead
        title="Compra da semana"
        subtitle={`${items.length} produtos · ${total} unidades · ${city.name}`}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              setItems((xs) => [
                ...xs,
                { id: String(Date.now()), name: 'Novo item', pack: '1 un', image: '/assets/products/arroz.png', qty: 1, rule: 'any' },
              ]);
              toast.success('Item adicionado');
            }}
          >
            <PlusIcon className="size-[15px]" /> Adicionar item
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3">
        <SearchIcon className="size-[17px] text-muted-foreground" />
        <input
          placeholder="Buscar produto no catálogo…"
          className="flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground"
        />
        <StatusBadge tone="neutral">Catálogo Pricely</StatusBadge>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {items.map((it, i) => (
          <div
            key={it.id}
            className={cn('flex items-center gap-3.5 p-3.5', i && 'border-t border-border')}
          >
            <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-[var(--ds-neutral-soft)]">
              <img src={it.image} alt={it.name} className="size-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">
                {it.name} <span className="text-[13px] font-normal text-muted-foreground">· {it.pack}</span>
              </div>
              <div className="mt-1.5">
                <RuleChip value={it.rule} onChange={(r) => set(i, { rule: r })} />
              </div>
            </div>
            <div className="inline-flex items-center gap-0.5 rounded-xl border border-border p-0.5">
              <button
                type="button"
                aria-label="menos"
                onClick={() => set(i, { qty: Math.max(1, it.qty - 1) })}
                className="flex size-[30px] items-center justify-center rounded-lg hover:bg-muted"
              >
                <MinusIcon className="size-[15px]" />
              </button>
              <span className="w-6 text-center text-[14px] font-bold tabular-nums">{it.qty}</span>
              <button
                type="button"
                aria-label="mais"
                onClick={() => set(i, { qty: it.qty + 1 })}
                className="flex size-[30px] items-center justify-center rounded-lg hover:bg-muted"
              >
                <PlusIcon className="size-[15px]" />
              </button>
            </div>
            <button
              type="button"
              aria-label="Remover item"
              onClick={() => remove(i)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <XCircleIcon className="size-[18px]" />
            </button>
          </div>
        ))}
      </div>

      <StickyActionBar>
        <div>
          <div className="text-[12.5px] text-muted-foreground">Pronta para otimizar</div>
          <div className="font-heading text-[16px] font-bold">{items.length} produtos · {total} unidades</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('Lista salva')}>
            <FileTextIcon className="size-[15px]" /> Salvar
          </Button>
          <Button onClick={() => navigate('/otimizacao/1')} className="bg-[#134e48] hover:bg-[#0f3f3a]">
            Otimizar preços <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </StickyActionBar>
    </div>
  );
}
