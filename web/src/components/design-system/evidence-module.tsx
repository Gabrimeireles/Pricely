import * as React from 'react';
import { GaugeIcon, ReceiptTextIcon, StoreIcon, UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/design-system/status-badge';
import { cn } from '@/lib/utils';

type EvidenceModuleProps = React.ComponentProps<'section'> & {
  title?: string;
  selectedVariant?: React.ReactNode;
  requestedRule?: React.ReactNode;
  store?: React.ReactNode;
  price?: React.ReactNode;
  sourceLabel?: React.ReactNode;
  trustScore?: number;
  trustLevel?: 'high' | 'medium' | 'low' | 'unknown';
  evidenceCount?: number;
  freshnessLabel?: React.ReactNode;
  confidenceNotice?: React.ReactNode;
  reportAction?: React.ReactNode;
  uploadAction?: React.ReactNode;
};

function EvidenceModule({
  className,
  confidenceNotice,
  evidenceCount,
  freshnessLabel,
  price,
  reportAction,
  requestedRule,
  selectedVariant,
  sourceLabel,
  store,
  title = 'Confiança da oferta',
  trustLevel = 'unknown',
  trustScore,
  uploadAction,
  ...props
}: EvidenceModuleProps) {
  const evidenceLabel =
    evidenceCount === undefined
      ? 'Sem contagem de evidência'
      : evidenceCount === 0
        ? 'Origem operacional'
        : evidenceCount === 1
          ? '1 nota fiscal aceita'
          : `${evidenceCount} notas fiscais aceitas`;

  return (
    <section
      data-slot="evidence-module"
      className={cn(
        'rounded-lg border border-border/80 bg-card p-3 text-sm text-card-foreground',
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">{title}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge family="trust" status={trustLevel} />
          {trustScore !== undefined ? (
            <StatusBadge icon={GaugeIcon} tone="neutral">
              <span className="tabular-nums">{trustScore}/100</span>
            </StatusBadge>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {selectedVariant ? (
          <EvidenceDetail label="Selecionado" value={selectedVariant} />
        ) : null}
        {requestedRule ? (
          <EvidenceDetail label="Regra pedida" value={requestedRule} />
        ) : null}
        {store ? (
          <EvidenceDetail icon={StoreIcon} label="Loja" value={store} />
        ) : null}
        {price ? <EvidenceDetail label="Preço" value={price} tabular /> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge
          icon={ReceiptTextIcon}
          tone={evidenceCount ? 'savings' : 'neutral'}
        >
          {sourceLabel ?? 'Origem operacional'}
        </StatusBadge>
        <StatusBadge tone={evidenceCount ? 'savings' : 'neutral'}>
          {evidenceLabel}
        </StatusBadge>
        {freshnessLabel ? (
          <StatusBadge family="freshness" status="aging">
            {freshnessLabel}
          </StatusBadge>
        ) : null}
      </div>

      {confidenceNotice ? (
        <p className="mt-3 text-pretty text-sm text-muted-foreground">
          {confidenceNotice}
        </p>
      ) : null}

      {reportAction || uploadAction ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {reportAction}
          {uploadAction ?? (
            <Button size="sm" variant="ghost">
              <UploadIcon />
              Enviar nota
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function EvidenceDetail({
  icon: Icon,
  label,
  tabular,
  value,
}: {
  icon?: React.ElementType;
  label: string;
  tabular?: boolean;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/45 p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
        {label}
      </div>
      <div
        className={cn(
          'mt-0.5 truncate font-medium text-foreground',
          tabular && 'tabular-nums',
        )}
      >
        {value}
      </div>
    </div>
  );
}

export { EvidenceModule };
export type { EvidenceModuleProps };
