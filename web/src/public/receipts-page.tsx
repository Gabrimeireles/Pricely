import { CameraIcon, FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/design-system';
import { Card } from '@/components/ui/card';
import { PageHead, SectionTitle } from '@/components/shopper/section';

const RECEIPTS: [string, string, string, string][] = [
  ['12/05/2025 09:32', 'R$ 245,37', 'Atacadão Mooca', 'pending_review'],
  ['08/05/2025 18:11', 'R$ 132,90', 'Carrefour V. Mariana', 'accepted'],
  ['02/05/2025 12:40', 'R$ 89,15', 'Mercado Centro', 'accepted'],
  ['28/04/2025 20:05', 'R$ 54,20', 'Assaí Ipiranga', 'low_confidence'],
  ['21/04/2025 16:22', 'R$ 310,00', 'Extra Paulista', 'rejected'],
];

export function ReceiptsPage() {
  return (
    <div>
      <PageHead
        title="Notas fiscais"
        subtitle="Envie notas para aumentar a confiança das ofertas e liberar recompensas"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <button
            type="button"
            onClick={() => toast.info('Câmera aberta (demo)')}
            className="mb-4 w-full cursor-pointer rounded-2xl border-2 border-dashed border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)] p-7 text-center hover:bg-[var(--ds-primary-soft)]/80"
          >
            <span className="mx-auto flex size-[52px] items-center justify-center rounded-2xl bg-card text-primary">
              <CameraIcon className="size-6" />
            </span>
            <div className="mt-2 font-heading text-[16px] font-bold text-primary">Enviar nota fiscal</div>
            <div className="text-[13px] text-muted-foreground">Foto, PDF ou QR code da nota</div>
          </button>

          <SectionTitle>Suas notas</SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {RECEIPTS.map(([date, total, store, status], i) => (
              <div
                key={date}
                className={`flex items-center gap-3 p-[15px] ${i ? 'border-t border-border' : ''}`}
              >
                <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--ds-neutral-soft)] text-primary">
                  <FileTextIcon className="size-[19px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{store}</div>
                  <div className="text-[12.5px] text-muted-foreground">{date}</div>
                </div>
                <span className="font-bold tabular-nums">{total}</span>
                <StatusBadge family="receipt" status={status} />
              </div>
            ))}
          </div>
        </div>

        <div className="sticky top-[86px] self-start">
          <Card className="rounded-2xl p-4">
            <div className="font-heading text-[15px] font-bold">Recompensas</div>
            <p className="mt-1.5 mb-3.5 text-pretty text-[13px] text-muted-foreground">
              Notas aceitas liberam recompensas e melhoram a precisão dos seus preços.
            </p>
            {([['Notas aceitas', '2'], ['Em revisão', '1'], ['Recompensa', 'Pendente']] as const).map(([k, v], i) => (
              <div
                key={k}
                className={`flex justify-between py-2 text-[13.5px] ${i ? 'border-t border-border' : ''}`}
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            <div className="mt-2.5">
              <StatusBadge family="reward" status="eligible_pending" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
