import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  InfoIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { WithTooltip } from '@/components/design-system/with-tooltip';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'border font-medium [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral:
          'border-[var(--ds-neutral-border)] bg-[var(--ds-neutral-soft)] text-foreground',
        primary:
          'border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)] text-[var(--ds-primary)]',
        savings:
          'border-[var(--ds-savings-border)] bg-[var(--ds-savings-soft)] text-[var(--ds-savings)]',
        location:
          'border-[var(--ds-location-border)] bg-[var(--ds-location-soft)] text-[var(--ds-location)]',
        warning:
          'border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] text-[var(--ds-warning)]',
        critical:
          'border-[var(--ds-critical-border)] bg-[var(--ds-critical-soft)] text-[var(--ds-critical)]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

type StatusFamily =
  | 'city'
  | 'freshness'
  | 'queue'
  | 'receipt'
  | 'reward'
  | 'severity'
  | 'trust';

type StatusBadgePreset = {
  icon: React.ElementType;
  label: string;
  tone: NonNullable<VariantProps<typeof statusBadgeVariants>['tone']>;
};

const statusPresets = {
  city: {
    active: { icon: CheckCircle2Icon, label: 'Cidade ativa', tone: 'location' },
    activating: { icon: Clock3Icon, label: 'Em ativacao', tone: 'warning' },
    collecting_data: { icon: InfoIcon, label: 'Coletando dados', tone: 'neutral' },
    hidden: { icon: CircleIcon, label: 'Oculta', tone: 'neutral' },
  },
  freshness: {
    fresh: { icon: CheckCircle2Icon, label: 'Atualizado', tone: 'savings' },
    aging: { icon: Clock3Icon, label: 'Cobertura parcial', tone: 'warning' },
    stale: { icon: AlertTriangleIcon, label: 'Dado antigo', tone: 'warning' },
    expired: { icon: XCircleIcon, label: 'Expirado', tone: 'critical' },
  },
  queue: {
    queued: { icon: Clock3Icon, label: 'Na fila', tone: 'location' },
    running: { icon: Clock3Icon, label: 'Executando', tone: 'primary' },
    retrying: { icon: AlertTriangleIcon, label: 'Tentando novamente', tone: 'warning' },
    failed: { icon: XCircleIcon, label: 'Falhou', tone: 'critical' },
    completed: { icon: CheckCircle2Icon, label: 'Concluido', tone: 'savings' },
  },
  receipt: {
    accepted: { icon: CheckCircle2Icon, label: 'Aceita', tone: 'savings' },
    pending_review: { icon: Clock3Icon, label: 'Aguardando revisao', tone: 'warning' },
    duplicate: { icon: AlertTriangleIcon, label: 'Duplicada', tone: 'warning' },
    quarantined: { icon: AlertTriangleIcon, label: 'Em quarentena', tone: 'warning' },
    rejected: { icon: XCircleIcon, label: 'Rejeitada', tone: 'critical' },
    low_confidence: { icon: AlertTriangleIcon, label: 'Baixa confianca', tone: 'warning' },
  },
  reward: {
    eligible_pending: { icon: Clock3Icon, label: 'Reward pendente', tone: 'warning' },
    granted: { icon: CheckCircle2Icon, label: 'Reward concedido', tone: 'savings' },
    disabled: { icon: CircleIcon, label: 'Reward desativado', tone: 'neutral' },
    rejected: { icon: XCircleIcon, label: 'Reward rejeitado', tone: 'critical' },
  },
  severity: {
    critical: { icon: XCircleIcon, label: 'Crítico', tone: 'critical' },
    warning: { icon: AlertTriangleIcon, label: 'Revisar', tone: 'warning' },
    info: { icon: InfoIcon, label: 'Informativo', tone: 'location' },
    healthy: { icon: CheckCircle2Icon, label: 'Saudável', tone: 'savings' },
  },
  trust: {
    high: { icon: ShieldCheckIcon, label: 'Confiança alta', tone: 'savings' },
    medium: { icon: ShieldCheckIcon, label: 'Confiança média', tone: 'warning' },
    low: { icon: AlertTriangleIcon, label: 'Confiança baixa', tone: 'critical' },
    unknown: { icon: InfoIcon, label: 'Confiança indefinida', tone: 'neutral' },
  },
} satisfies Record<StatusFamily, Record<string, StatusBadgePreset>>;

type StatusBadgeProps = React.ComponentProps<typeof Badge> &
  VariantProps<typeof statusBadgeVariants> & {
    family?: StatusFamily;
    status?: string;
    icon?: React.ElementType | null;
    label?: string;
    tooltip?: React.ReactNode;
    tooltipSide?: React.ComponentProps<typeof WithTooltip>['side'];
  };

function getStatusPreset(family?: StatusFamily, status?: string) {
  if (!family || !status) {
    return null;
  }

  const familyPresets = statusPresets[family] as Record<
    string,
    StatusBadgePreset | undefined
  >;

  return familyPresets[status] ?? null;
}

function StatusBadge({
  className,
  family,
  status,
  icon,
  label,
  tone,
  tooltip,
  tooltipSide,
  children,
  ...props
}: StatusBadgeProps) {
  const preset = getStatusPreset(family, status);
  const Icon = icon === null ? null : icon ?? preset?.icon ?? CircleIcon;
  const badgeTone = tone ?? preset?.tone ?? 'neutral';
  const content = children ?? label ?? preset?.label ?? status;

  const badge = (
    <Badge
      data-slot="status-badge"
      variant="outline"
      className={cn(statusBadgeVariants({ tone: badgeTone }), className)}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" /> : null}
      {content}
    </Badge>
  );

  if (!tooltip) {
    return badge;
  }

  return (
    <WithTooltip label={tooltip} side={tooltipSide}>
      {badge}
    </WithTooltip>
  );
}

export { StatusBadge, statusBadgeVariants, statusPresets };
export type { StatusBadgeProps, StatusFamily };
