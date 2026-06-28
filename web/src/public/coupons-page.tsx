import { TagIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageHead } from '@/components/shopper/section';

type Tone = 'savings' | 'location' | 'primary' | 'warning';

const COUPONS: [string, string, string, string, Tone, string][] = [
  ['10% OFF', 'Atacadão Mooca', 'PRICELY10', 'Válido até 30/05', 'savings', 'Grãos e cereais'],
  ['R$ 15', 'Carrefour V. Mariana', 'CARREF15', 'Válido até 28/05', 'location', 'Acima de R$ 150'],
  ['Frete grátis', 'Assaí Ipiranga', 'FRETEASSAI', 'Válido até 31/05', 'primary', 'Entrega no bairro'],
  ['8% OFF', 'Extra Paulista', 'EXTRA8', 'Válido até 02/06', 'savings', 'Laticínios'],
  ['2x1', 'Mercado Centro', 'LEVE2', 'Válido até 29/05', 'warning', 'Higiene'],
  ['R$ 20', 'Pão de Açúcar', 'PAO20', 'Válido até 05/06', 'location', 'Acima de R$ 200'],
];

export function CouponsPage() {
  return (
    <div>
      <PageHead title="Cupons" subtitle="Descontos ativos nas lojas do seu raio" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {COUPONS.map(([amt, store, code, valid, tone, cond]) => (
          <div key={code} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div
              className="relative p-[18px]"
              style={{
                background: `var(--ds-${tone}-soft)`,
                borderBottom: `2px dashed var(--ds-${tone}-border)`,
              }}
            >
              <span
                className="absolute -bottom-2.5 -left-2.5 size-5 rounded-full"
                style={{ background: 'var(--background)' }}
              />
              <span
                className="absolute -bottom-2.5 -right-2.5 size-5 rounded-full"
                style={{ background: 'var(--background)' }}
              />
              <TagIcon className="size-5" style={{ color: `var(--ds-${tone})` }} />
              <div
                className="mt-1.5 font-heading text-[26px] font-extrabold"
                style={{ color: `var(--ds-${tone})` }}
              >
                {amt}
              </div>
              <div className="text-[13.5px] font-semibold">{store}</div>
            </div>
            <div className="p-4">
              <div className="text-[12.5px] text-muted-foreground">{cond} · {valid}</div>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-xl bg-[var(--ds-neutral-soft)] px-3 py-2.5 text-[14px] font-bold tracking-wider">
                  {code}
                </code>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(code);
                    toast.success('Cupom copiado', { description: code });
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
