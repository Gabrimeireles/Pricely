import { useEffect, useState, type FormEvent } from 'react';

import { useParams } from 'react-router-dom';

import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  ImageUpIcon,
  InfoIcon,
  ListChecksIcon,
  ReceiptTextIcon,
  SparklesIcon,
  UserCogIcon,
} from 'lucide-react';

import {
  type AdminEstablishmentResponse,
  type AdminMetricsResponse,
  type AdminOfferResponse,
  type AdminProcessingJobDetailResponse,
  type AdminProcessingJobResponse,
  type AdminProductResponse,
  type AdminProductVariantResponse,
  type AdminQueueHealthResponse,
  type AdminReceiptProcessingResponse,
  type AdminRegionResponse,
  type AdminShoppingListAuditResponse,
  type AdminUserResponse,
  createAdminEstablishment,
  createAdminOffer,
  createAdminProduct,
  createAdminProductVariant,
  createAdminRegion,
  deleteAdminProduct,
  deleteAdminProductVariant,
  fetchAdminEstablishments,
  fetchAdminMetrics,
  fetchAdminOffers,
  fetchAdminProcessingJobDetail,
  fetchAdminProcessingJobs,
  fetchAdminProducts,
  fetchAdminProductVariants,
  fetchAdminQueueHealth,
  fetchAdminReceiptProcessing,
  fetchAdminRegions,
  fetchAdminShoppingLists,
  fetchAdminUsers,
  grantAdminUserTokens,
  releaseAdminReceiptProcessing,
  rejectAdminReceiptProcessing,
  reprocessAdminReceiptProcessing,
  setAdminUserPremium,
  updateAdminOffer,
  updateAdminEstablishment,
  updateAdminProduct,
  updateAdminProductVariant,
  updateAdminRegion,
  uploadAdminProductVariantImage,
} from '@/app/api';
import { formatCurrency, formatFreshnessLabel } from '@/app/format';
import { resolveProductImage } from '@/app/media';
import { usePricely } from '@/app/pricely-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function useAdminData<T>(
  loader: (token: string) => Promise<T>,
  initialValue: T,
) {
  const { accessToken } = usePricely();
  const [data, setData] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setError(null);
      setData(await loader(accessToken));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Falha ao carregar dados administrativos.',
      );
    }
  };

  useEffect(() => {
    void reload();
  }, [accessToken]);

  return { data, error, reload };
}

function optimizationModeLabel(mode?: string | null) {
  const labels: Record<string, string> = {
    global_full: 'Menor total na cidade',
    global_multi: 'Menor total na cidade',
    global_unique: 'Uma loja na cidade',
    local: 'Uma loja perto de mim',
    local_multi: 'Menor preco perto de mim',
    local_unique: 'Uma loja perto de mim',
  };

  return mode
    ? (labels[mode] ?? mode.replace(/_/g, ' '))
    : 'Modo nao informado';
}

function parseAdminMoneyInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function optimizationSummaryLabel(summary?: string | null) {
  if (!summary) {
    return 'Resultado sem resumo operacional registrado.';
  }

  if (summary.includes('Pricely selected the cheapest confirmed city offers')) {
    return 'O Pricely selecionou as menores ofertas confirmadas na cidade e marcou itens sem cobertura para revisão.';
  }

  return summary;
}

function jobResourceTitle(job: AdminProcessingJobResponse) {
  if (job.shoppingList) {
    return `Lista: ${job.shoppingList.name}`;
  }

  if (job.receiptRecord) {
    return `Nota fiscal: ${job.receiptRecord.storeName ?? 'loja nao identificada'}`;
  }

  if (job.optimizationRun) {
    return `Otimizacao ${optimizationModeLabel(job.optimizationRun.mode)}`;
  }

  return `${job.resourceType.replace(/_/g, ' ')} em processamento`;
}

function jobOwnerLabel(job: AdminProcessingJobResponse) {
  if (!job.owner) {
    return 'Sem usuario vinculado';
  }

  return `${job.owner.displayName || job.owner.email}`;
}

function jobStatusLabel(status: AdminProcessingJobResponse['status']) {
  const labels: Record<AdminProcessingJobResponse['status'], string> = {
    completed: 'Concluido',
    failed: 'Falhou',
    queued: 'Em fila',
    retrying: 'Tentando novamente',
    running: 'Executando',
  };

  return labels[status];
}

function jobStatusBadgeVariant(status: AdminProcessingJobResponse['status']) {
  if (status === 'failed') {
    return 'destructive' as const;
  }

  if (status === 'retrying') {
    return 'outline' as const;
  }

  return 'secondary' as const;
}

function optimizationSelectionStatusLabel(
  status: NonNullable<
    AdminProcessingJobDetailResponse['optimizationRun']
  >['selections'][number]['status'],
) {
  const labels: Record<
    NonNullable<
      AdminProcessingJobDetailResponse['optimizationRun']
    >['selections'][number]['status'],
    string
  > = {
    missing: 'Sem oferta',
    review: 'Revisar',
    selected: 'Selecionada',
  };

  return labels[status];
}

function receiptTrustLabel(
  trustLevel: AdminReceiptProcessingResponse['trustLevel'],
) {
  const labels: Record<AdminReceiptProcessingResponse['trustLevel'], string> = {
    pending_review: 'Revisão pendente',
    rejected: 'Rejeitada',
    trusted: 'Confiável',
    untrusted: 'Baixa confiança',
  };

  return labels[trustLevel];
}

function rewardEligibilityLabel(
  status: AdminReceiptProcessingResponse['rewardEligibilityStatus'],
) {
  const labels: Record<
    AdminReceiptProcessingResponse['rewardEligibilityStatus'],
    string
  > = {
    disabled: 'Rewards desativados',
    eligible_pending: 'Elegível pendente',
    granted: 'Reward concedido',
    ineligible: 'Inelegível',
  };

  return labels[status];
}

function JobResourceIcon({ job }: { job: AdminProcessingJobResponse }) {
  if (job.receiptRecord || job.resourceType.includes('receipt')) {
    return <ReceiptTextIcon className="size-4" />;
  }

  if (job.optimizationRun || job.queueName.includes('optimization')) {
    return <SparklesIcon className="size-4" />;
  }

  return <ListChecksIcon className="size-4" />;
}

function receiptModerationLabel(
  status: AdminReceiptProcessingResponse['moderationStatus'],
) {
  const labels: Record<
    AdminReceiptProcessingResponse['moderationStatus'],
    string
  > = {
    accepted: 'Aceita',
    duplicate: 'Duplicada',
    pending: 'Pendente',
    quarantined: 'Em revisão',
    rejected: 'Rejeitada',
  };

  return labels[status];
}

function receiptQualityLabel(receipt: AdminReceiptProcessingResponse) {
  if (receipt.quality.lineItemCount === 0) {
    return 'Sem itens extraídos';
  }

  return `${receipt.quality.highConfidenceLineItemCount}/${receipt.quality.lineItemCount} itens fortes`;
}

function receiptMatcherStatusLabel(
  status: AdminReceiptProcessingResponse['lineItems'][number]['matcherStatus'],
) {
  const labels: Record<
    AdminReceiptProcessingResponse['lineItems'][number]['matcherStatus'],
    string
  > = {
    matched_offer: 'Oferta criada',
    matched_name_only: 'Produto provável',
    needs_product_review: 'Criar ou vincular produto',
  };

  return labels[status];
}

function receiptMakerActionLabel(
  action: AdminReceiptProcessingResponse['lineItems'][number]['makerAction'],
) {
  const labels: Record<
    AdminReceiptProcessingResponse['lineItems'][number]['makerAction'],
    string
  > = {
    create_or_match_product: 'Abrir maker de produto',
    link_existing_product: 'Vincular produto existente',
    offer_created: 'Oferta gerada',
  };

  return labels[action];
}

function priceDirectionLabel(
  direction: AdminReceiptProcessingResponse['lineItems'][number]['offers'][number]['comparison']['direction'],
) {
  const labels: Record<
    AdminReceiptProcessingResponse['lineItems'][number]['offers'][number]['comparison']['direction'],
    string
  > = {
    down: 'Preço caiu',
    new: 'Novo preço',
    same: 'Sem mudança',
    up: 'Preço subiu',
  };

  return labels[direction];
}

function receiptMakerActionButtonLabel(
  action: AdminReceiptProcessingResponse['lineItems'][number]['makerAction'],
) {
  const labels: Record<
    AdminReceiptProcessingResponse['lineItems'][number]['makerAction'],
    string
  > = {
    create_or_match_product: 'Abrir criação de produto',
    link_existing_product: 'Revisar vínculo',
    offer_created: 'Ver oferta criada',
  };

  return labels[action];
}

export function AdminOverviewPage() {
  const { data, error } = useAdminData<AdminMetricsResponse | null>(
    fetchAdminMetrics,
    null,
  );
  const { data: queueHealth } = useAdminData<AdminQueueHealthResponse | null>(
    fetchAdminQueueHealth,
    null,
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Falha ao carregar métricas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando métricas</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const cards = [
    {
      label: 'Usuarios ativos',
      value: String(data.activeUsers),
      numericValue: data.activeUsers,
    },
    {
      label: 'Listas criadas',
      value: String(data.shoppingListsCount),
      numericValue: data.shoppingListsCount,
    },
    {
      label: 'Otimizacoes concluidas',
      value: String(data.optimizationRunsCount),
      numericValue: data.optimizationRunsCount,
    },
    {
      label: 'Economia global',
      value: formatCurrency(data.globalEstimatedSavings),
      numericValue: data.globalEstimatedSavings,
    },
    {
      label: 'Regioes ativas',
      value: String(data.activeRegions),
      numericValue: data.activeRegions,
    },
    {
      label: 'Estabelecimentos ativos',
      value: String(data.activeEstablishments),
      numericValue: data.activeEstablishments,
    },
    {
      label: 'Ofertas ativas',
      value: String(data.activeOffers),
      numericValue: data.activeOffers,
    },
    {
      label: 'Produtos ativos',
      value: String(data.productCount),
      numericValue: data.productCount,
    },
    {
      label: 'Jobs em fila',
      value: String(data.queuedJobs),
      numericValue: data.queuedJobs,
    },
  ];
  const isEmptyState = cards.every((entry) => entry.numericValue === 0);
  const maxMetric = Math.max(
    data.activeUsers,
    data.shoppingListsCount,
    data.optimizationRunsCount,
    data.globalEstimatedSavings,
    data.activeRegions,
    data.activeEstablishments,
    data.activeOffers,
    data.productCount,
    data.queuedJobs,
    1,
  );
  const completionRatio = Math.min(
    100,
    Math.round(
      (data.optimizationRunsCount / Math.max(data.shoppingListsCount, 1)) * 100,
    ),
  );
  const catalogRatio = Math.min(
    100,
    Math.round((data.activeOffers / Math.max(data.productCount, 1)) * 100),
  );
  const queuePressure = queueHealth
    ? Math.min(
        100,
        Math.round(
          ((queueHealth.queuedJobs + queueHealth.runningJobs) /
            Math.max(
              queueHealth.completedJobs +
                queueHealth.failedJobs +
                queueHealth.queuedJobs +
                queueHealth.runningJobs,
              1,
            )) *
            100,
        ),
      )
    : 0;
  const operationalActions = [
    ...(queueHealth?.recentFailures?.length
      ? [
          {
            title: 'Falhas de fila',
            detail: `${queueHealth.recentFailures.length} falhas ou retries precisam de triagem`,
            href: '/dashboard/fila',
            tone: 'danger' as const,
          },
        ]
      : []),
    ...(data.queuedJobs > 0
      ? [
          {
            title: 'Jobs aguardando',
            detail: `${data.queuedJobs} trabalhos ainda não concluídos`,
            href: '/dashboard/fila',
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(catalogRatio < 40
      ? [
          {
            title: 'Cobertura de catálogo baixa',
            detail: `${catalogRatio}% dos produtos têm oferta ativa`,
            href: '/dashboard/ofertas',
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(data.activeRegions === 0 || data.activeEstablishments === 0
      ? [
          {
            title: 'Cobertura de cidade incompleta',
            detail: 'Revise cidades e estabelecimentos ativos',
            href: '/dashboard/regioes',
            tone: 'warning' as const,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Visao geral operacional
        </h1>
        <p className="text-muted-foreground">
          O dashboard administrativo consolida cidade, catálogo, filas e uso
          real do produto.
        </p>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Prioridades operacionais</CardTitle>
          <CardDescription>
            Ações que devem ser resolvidas antes dos gráficos de acompanhamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {operationalActions.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-[#ECFDF5] p-4">
              <div className="text-sm font-medium text-[#166534]">
                Nenhum bloqueio crítico
              </div>
              <div className="mt-1 text-sm text-[#166534]">
                Filas, catálogo e cobertura não têm alertas prioritários agora.
              </div>
            </div>
          ) : null}
          {operationalActions.map((action) => (
            <a
              key={action.title}
              className={`rounded-lg border p-4 transition-colors hover:border-primary/60 ${
                action.tone === 'danger'
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-amber-300/60 bg-amber-50/70'
              }`}
              href={action.href}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{action.title}</div>
                <ExternalLinkIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {action.detail}
              </div>
            </a>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map((entry) => (
          <Card
            key={entry.label}
            className="border-border/70 bg-card/90 shadow-sm"
          >
            <CardHeader className="gap-3">
              <CardDescription>{entry.label}</CardDescription>
              <CardTitle className="text-3xl">{entry.value}</CardTitle>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.max(14, Math.min(100, (entry.numericValue / maxMetric) * 100))}%`,
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Cobertura da operacao</CardTitle>
            <CardDescription>
              Leituras visuais para listas, catálogo e fila.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Listas processadas
                </span>
                <span className="font-medium">{completionRatio}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-[#0F766E]"
                  style={{ width: `${completionRatio}%` }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Catálogo com oferta ativa
                </span>
                <span className="font-medium">{catalogRatio}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-[#2563EB]"
                  style={{ width: `${catalogRatio}%` }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Pressao atual de fila
                </span>
                <span className="font-medium">{queuePressure}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-[#84CC16]"
                  style={{ width: `${queuePressure}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Sinais do dia</CardTitle>
            <CardDescription>
              Resumo rapido para identificar onde a operacao esta apertando.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border border-border/70 bg-[#ECFDF5] p-4">
              <div className="text-sm text-[#166534]">Regioes ativas</div>
              <div className="mt-2 text-2xl font-semibold text-[#14532D]">
                {data.activeRegions}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-[#EFF6FF] p-4">
              <div className="text-sm text-[#1D4ED8]">Ofertas ativas</div>
              <div className="mt-2 text-2xl font-semibold text-[#1E3A8A]">
                {data.activeOffers}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-[#FFF7ED] p-4">
              <div className="text-sm text-[#C2410C]">Jobs aguardando</div>
              <div className="mt-2 text-2xl font-semibold text-[#9A3412]">
                {data.queuedJobs}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Prioridade operacional
                  </div>
                  <div className="mt-2 text-base font-medium">
                    {queuePressure >= 60
                      ? 'Fila pressionada'
                      : catalogRatio < 40
                        ? 'Catálogo com pouca cobertura'
                        : completionRatio < 40
                          ? 'Listas com baixa conclusao'
                          : 'Operacao estavel'}
                  </div>
                </div>
                <Badge
                  variant={queuePressure >= 60 ? 'destructive' : 'secondary'}
                >
                  {queuePressure >= 60 ? 'Atencao' : 'Ok'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Painel comparativo</CardTitle>
          <CardDescription>
            Leitura lado a lado para volume de usuarios, listas, ofertas e
            filas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          {[
            ['Usuarios ativos', data.activeUsers, '#0F766E'],
            ['Listas criadas', data.shoppingListsCount, '#2563EB'],
            ['Ofertas ativas', data.activeOffers, '#84CC16'],
            ['Jobs em fila', data.queuedJobs, '#F97316'],
          ].map(([label, rawValue, color]) => {
            const value = Number(rawValue);
            return (
              <div
                key={String(label)}
                className="grid gap-2 rounded-lg border border-border/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-lg font-semibold">{value}</span>
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[0.25, 0.45, 0.65, 0.85, 1].map((ratio, index) => (
                    <div
                      key={`${label}-${index}`}
                      className="flex-1 rounded-md bg-muted"
                    >
                      <div
                        className="rounded-md"
                        style={{
                          backgroundColor: String(color),
                          height: `${Math.max(12, Math.min(100, (value / maxMetric) * 100 * ratio))}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {isEmptyState ? (
        <Alert>
          <AlertTitle>Nenhuma metrica operacional ainda</AlertTitle>
          <AlertDescription>
            O ambiente ainda não registrou usuários ativos, listas, ofertas ou
            jobs. Use seed ou operações admin para popular o sistema.
          </AlertDescription>
        </Alert>
      ) : null}

      {queueHealth ? (
        <Card>
          <CardHeader>
            <CardTitle>Saude das filas</CardTitle>
            <CardDescription>
              Resumo persistido de fila, retry e falha.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Em fila</div>
              <div className="text-2xl font-semibold">
                {queueHealth.queuedJobs}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Executando</div>
              <div className="text-2xl font-semibold">
                {queueHealth.runningJobs}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Falhos</div>
              <div className="text-2xl font-semibold">
                {queueHealth.failedJobs}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Filas</div>
              <div className="text-2xl font-semibold">
                {queueHealth.queues.length}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function AdminPricesPage() {
  const {
    data: offers,
    error,
    reload,
  } = useAdminData<AdminOfferResponse[]>(fetchAdminOffers, []);
  const { data: products } = useAdminData<AdminProductResponse[]>(
    fetchAdminProducts,
    [],
  );
  const { data: establishments } = useAdminData<AdminEstablishmentResponse[]>(
    fetchAdminEstablishments,
    [],
  );
  const { accessToken } = usePricely();
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  );
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [form, setForm] = useState({
    catalogProductId: '',
    productVariantId: '',
    establishmentId: '',
    displayName: '',
    packageLabel: '',
    priceAmount: '',
    basePriceAmount: '',
    promotionalPriceAmount: '',
  });
  const productVariants = products.flatMap((product) =>
    product.productVariants.map((variant) => ({
      ...variant,
      catalogProductId: product.id,
      productName: product.name,
    })),
  );
  const offersByProduct = products
    .map((product) => ({
      product,
      offers: offers.filter((offer) => offer.catalogProduct.id === product.id),
    }))
    .filter((entry) => entry.offers.length > 0);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    const effectivePrice = parseAdminMoneyInput(form.priceAmount);
    const basePrice = parseAdminMoneyInput(form.basePriceAmount);
    const promotionalPrice = parseAdminMoneyInput(form.promotionalPriceAmount);

    if (
      effectivePrice === undefined ||
      effectivePrice === null ||
      basePrice === null ||
      promotionalPrice === null
    ) {
      setMutationError(
        'Informe valores válidos. Use 14,99 ou 14.99 para preço.',
      );
      return;
    }

    const payload = {
      catalogProductId: form.catalogProductId,
      productVariantId: form.productVariantId,
      establishmentId: form.establishmentId,
      displayName: form.displayName,
      packageLabel: form.packageLabel,
      priceAmount: effectivePrice,
      basePriceAmount: basePrice ?? effectivePrice,
      promotionalPriceAmount: promotionalPrice ?? null,
      availabilityStatus: 'available',
      confidenceLevel: 'high',
    };

    try {
      setMutationError(null);
      if (editingOfferId) {
        await updateAdminOffer(accessToken, editingOfferId, payload);
      } else {
        await createAdminOffer(accessToken, payload);
      }
    } catch (saveError) {
      setMutationError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar a oferta.',
      );
      return;
    }
    setForm({
      catalogProductId: '',
      productVariantId: '',
      establishmentId: '',
      displayName: '',
      packageLabel: '',
      priceAmount: '',
      basePriceAmount: '',
      promotionalPriceAmount: '',
    });
    setEditingOfferId(null);
    await reload();
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingOfferId ? 'Editar oferta' : 'Criar oferta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mutationError ? (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Falha ao salvar oferta</AlertTitle>
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          ) : null}
          <form className="grid gap-3 md:grid-cols-6" onSubmit={handleCreate}>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.productVariantId}
              onChange={(event) => {
                const selected = productVariants.find(
                  (variant) => variant.id === event.target.value,
                );
                setForm((current) => ({
                  ...current,
                  productVariantId: event.target.value,
                  catalogProductId: selected?.catalogProductId ?? '',
                  displayName: selected?.displayName ?? current.displayName,
                  packageLabel: selected?.packageLabel ?? current.packageLabel,
                }));
              }}
            >
              <option value="">Variante do produto</option>
              {productVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.productName} · {variant.displayName}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.establishmentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  establishmentId: event.target.value,
                }))
              }
            >
              <option value="">Estabelecimento</option>
              {establishments.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.unitName}
                </option>
              ))}
            </select>
            <Input
              placeholder="Nome exibido"
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Embalagem"
              value={form.packageLabel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  packageLabel: event.target.value,
                }))
              }
            />
            <Input
              inputMode="decimal"
              placeholder="Preço base"
              value={form.basePriceAmount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  basePriceAmount: event.target.value,
                }))
              }
            />
            <Input
              inputMode="decimal"
              placeholder="Preço promocional"
              value={form.promotionalPriceAmount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  promotionalPriceAmount: event.target.value,
                  priceAmount:
                    event.target.value ||
                    current.basePriceAmount ||
                    current.priceAmount,
                }))
              }
            />
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                placeholder="Preço efetivo"
                value={form.priceAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceAmount: event.target.value,
                  }))
                }
              />
              <Button type="submit">
                {editingOfferId ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preços e ofertas</CardTitle>
          <CardDescription>
            Produto original, variantes disponíveis e ofertas por
            estabelecimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar ofertas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            offersByProduct.map(({ product, offers: groupedOffers }) => {
              const expanded = expandedProductId === product.id;
              return (
                <div
                  key={product.id}
                  className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Produto original · {groupedOffers.length} ofertas
                        cadastradas
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        setExpandedProductId(expanded ? null : product.id)
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {expanded ? (
                        <ChevronUpIcon className="size-4" />
                      ) : (
                        <ChevronDownIcon className="size-4" />
                      )}
                      {expanded ? 'Recolher variantes' : 'Ver variantes'}
                    </Button>
                  </div>
                  {expanded ? (
                    <div className="mt-4 overflow-x-auto rounded-lg border border-border/70">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variante</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Atualizacao</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedOffers.map((offer) => (
                            <TableRow key={offer.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {offer.productVariant.imageUrl ? (
                                    <img
                                      alt={offer.productVariant.displayName}
                                      className="size-12 rounded-md border border-border/70 object-cover"
                                      src={resolveProductImage(
                                        offer.productVariant.imageUrl,
                                      )}
                                    />
                                  ) : (
                                    <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/20 text-[10px] text-muted-foreground">
                                      Sem foto
                                    </div>
                                  )}
                                  <div className="grid gap-1">
                                    <span className="font-medium">
                                      {offer.productVariant.displayName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {offer.productVariant.brandName ??
                                        'Marca livre'}{' '}
                                      ·{' '}
                                      {offer.productVariant.packageLabel ??
                                        offer.packageLabel}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {offer.establishment.unitName}
                              </TableCell>
                              <TableCell>
                                <div className="grid gap-1">
                                  {offer.promotionalPriceAmount &&
                                  offer.basePriceAmount ? (
                                    <span className="text-xs text-muted-foreground line-through">
                                      {formatCurrency(
                                        Number(offer.basePriceAmount),
                                      )}
                                    </span>
                                  ) : null}
                                  <span>
                                    {formatCurrency(Number(offer.priceAmount))}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatFreshnessLabel(offer.observedAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      offer.isActive ? 'secondary' : 'outline'
                                    }
                                  >
                                    {offer.availabilityStatus}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingOfferId(offer.id);
                                      setForm({
                                        catalogProductId:
                                          offer.catalogProduct.id,
                                        productVariantId:
                                          offer.productVariant.id,
                                        establishmentId: offer.establishment.id,
                                        displayName: offer.displayName,
                                        packageLabel: offer.packageLabel,
                                        priceAmount: String(offer.priceAmount),
                                        basePriceAmount: offer.basePriceAmount
                                          ? String(offer.basePriceAmount)
                                          : '',
                                        promotionalPriceAmount:
                                          offer.promotionalPriceAmount
                                            ? String(
                                                offer.promotionalPriceAmount,
                                              )
                                            : '',
                                      });
                                    }}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      if (!accessToken) {
                                        return;
                                      }

                                      await updateAdminOffer(
                                        accessToken,
                                        offer.id,
                                        { isActive: !offer.isActive },
                                      );
                                      await reload();
                                    }}
                                  >
                                    {offer.isActive ? 'Desativar' : 'Ativar'}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminCatalogPage() {
  const {
    data: products,
    error,
    reload,
  } = useAdminData<AdminProductResponse[]>(fetchAdminProducts, []);
  const { data: variants, reload: reloadVariants } = useAdminData<
    AdminProductVariantResponse[]
  >(fetchAdminProductVariants, []);
  const { accessToken } = usePricely();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantImageFile, setVariantImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    category: '',
    defaultUnit: '',
  });
  const [variantForm, setVariantForm] = useState({
    catalogProductId: '',
    slug: '',
    displayName: '',
    brandName: '',
    variantLabel: '',
    packageLabel: '',
  });
  const [catalogQuery, setCatalogQuery] = useState('');
  const [variantQuery, setVariantQuery] = useState('');
  const [expandedCatalogProductId, setExpandedCatalogProductId] = useState<
    string | null
  >(null);
  const normalizedCatalogQuery = catalogQuery.trim().toLowerCase();
  const normalizedVariantQuery = variantQuery.trim().toLowerCase();
  const productNameById = new Map(
    products.map((product) => [product.id, product.name]),
  );
  const visibleProducts = normalizedCatalogQuery
    ? products.filter((product) => {
        const productVariants = variants.filter(
          (variant) => variant.catalogProductId === product.id,
        );
        return [
          product.name,
          product.slug,
          product.category,
          ...product.aliases.map((alias) => alias.alias),
          ...productVariants.flatMap((variant) => [
            variant.displayName,
            variant.brandName ?? '',
            variant.packageLabel ?? '',
            variant.slug ?? '',
          ]),
        ].some((value) => value.toLowerCase().includes(normalizedCatalogQuery));
      })
    : products;
  const visibleVariants = normalizedVariantQuery
    ? variants.filter((variant) =>
        [
          variant.displayName,
          variant.brandName ?? '',
          variant.packageLabel ?? '',
          variant.slug ?? '',
          productNameById.get(variant.catalogProductId) ?? '',
        ].some((value) => value.toLowerCase().includes(normalizedVariantQuery)),
      )
    : variants;

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    if (editingProductId) {
      await updateAdminProduct(accessToken, editingProductId, form);
    } else {
      await createAdminProduct(accessToken, form);
    }

    setForm({ slug: '', name: '', category: '', defaultUnit: '' });
    setEditingProductId(null);
    await reload();
  };

  const handleCreateVariant = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    const savedVariant = editingVariantId
      ? await updateAdminProductVariant(
          accessToken,
          editingVariantId,
          variantForm,
        )
      : await createAdminProductVariant(accessToken, variantForm);

    if (variantImageFile) {
      await uploadAdminProductVariantImage(
        accessToken,
        savedVariant.id,
        variantImageFile,
      );
    }
    setVariantForm({
      catalogProductId: '',
      slug: '',
      displayName: '',
      brandName: '',
      variantLabel: '',
      packageLabel: '',
    });
    setVariantImageFile(null);
    setEditingVariantId(null);
    await reloadVariants();
    await reload();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProductId ? 'Editar produto' : 'Novo produto'}
            </CardTitle>
            <CardDescription>
              O produto base é o item comparável, sem marca obrigatória. Ex.:
              Refrigerante cola 2 L. A variante é o item real exibido, como
              Coca-Cola PET 2 L.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreate}>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                O identificador público vira o endereço amigável do produto no
                sistema interno e nas rotas públicas.
              </div>
              <Input
                placeholder="Identificador público do produto"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Nome do produto"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Categoria"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Unidade padrão"
                value={form.defaultUnit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultUnit: event.target.value,
                  }))
                }
              />
              <Button type="submit">
                {editingProductId ? 'Salvar produto' : 'Criar produto'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {editingVariantId ? 'Editar variante' : 'Nova variante'}
            </CardTitle>
            <CardDescription>
              Cadastre marca e imagem por produto base. A variante é o item real
              exibido para o cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreateVariant}>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={variantForm.catalogProductId}
                onChange={(event) =>
                  setVariantForm((current) => ({
                    ...current,
                    catalogProductId: event.target.value,
                  }))
                }
              >
                <option value="">Produto base</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Identificador público da variante"
                value={variantForm.slug}
                onChange={(event) =>
                  setVariantForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Nome exibido"
                value={variantForm.displayName}
                onChange={(event) =>
                  setVariantForm((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Marca"
                value={variantForm.brandName}
                onChange={(event) =>
                  setVariantForm((current) => ({
                    ...current,
                    brandName: event.target.value,
                  }))
                }
              />
              <Input
                placeholder="Apresentação opcional"
                value={variantForm.packageLabel}
                onChange={(event) =>
                  setVariantForm((current) => ({
                    ...current,
                    packageLabel: event.target.value,
                  }))
                }
              />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-background/80 px-4 py-3 text-sm font-medium">
                <ImageUpIcon className="size-4" />
                <span>
                  {variantImageFile
                    ? variantImageFile.name
                    : 'Enviar imagem da variante'}
                </span>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) =>
                    setVariantImageFile(event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </label>
              <Button type="submit" variant="outline">
                {editingVariantId ? 'Salvar variante' : 'Criar variante'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bancada de variantes</CardTitle>
            <CardDescription>
              Use esta visão quando o produto base tiver muitas marcas ou
              embalagens. A edição abre o formulário acima.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <Input
                aria-label="Buscar variantes"
                placeholder="Buscar variante, marca, apresentação ou produto"
                value={variantQuery}
                onChange={(event) => setVariantQuery(event.target.value)}
              />
              <Badge variant="secondary">
                {visibleVariants.length} de {variants.length} variantes
              </Badge>
            </div>
            <div className="grid max-h-[520px] gap-2 overflow-auto pr-1">
              {visibleVariants.map((variant) => (
                <div
                  key={variant.id}
                  className="grid gap-3 rounded-lg border border-border/70 bg-background/80 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        alt={variant.displayName}
                        className="size-12 rounded-lg border border-border/70 object-cover"
                        src={resolveProductImage(variant.imageUrl)}
                      />
                      <div className="grid gap-1">
                        <div className="text-sm font-medium">
                          {variant.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {productNameById.get(variant.catalogProductId) ??
                            'Produto não encontrado'}{' '}
                          · {variant.brandName ?? 'Marca livre'} ·{' '}
                          {variant.packageLabel ?? 'Apresentação não informada'}
                        </div>
                      </div>
                    </div>
                    <Badge variant={variant.isActive ? 'secondary' : 'outline'}>
                      {variant.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingVariantId(variant.id);
                        setVariantForm({
                          catalogProductId: variant.catalogProductId,
                          slug: variant.slug ?? '',
                          displayName: variant.displayName,
                          brandName: variant.brandName ?? '',
                          variantLabel: variant.variantLabel ?? '',
                          packageLabel: variant.packageLabel ?? '',
                        });
                        setVariantImageFile(null);
                      }}
                    >
                      Editar variante
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setCatalogQuery(variant.displayName);
                        setExpandedCatalogProductId(variant.catalogProductId);
                      }}
                    >
                      Ver no produto
                    </Button>
                    <Button
                      className="text-destructive hover:text-destructive"
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        if (!accessToken) {
                          return;
                        }

                        await deleteAdminProductVariant(accessToken, variant.id);
                        await reloadVariants();
                        await reload();
                      }}
                    >
                      Excluir variante
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <CardDescription>
            Produtos base e variantes saem do banco real. Aliases existentes
            aparecem como leitura para apoiar o matcher.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <Input
              aria-label="Buscar no catalogo"
              placeholder="Buscar produto, alias, marca ou variante"
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
            />
            <Badge variant="secondary">
              {visibleProducts.length} de {products.length} produtos
            </Badge>
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar catálogo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            visibleProducts.map((product) => {
              const productVariants = variants.filter(
                (variant) => variant.catalogProductId === product.id,
              );
              const previewImage =
                productVariants.find((variant) => variant.imageUrl)?.imageUrl ??
                product.imageUrl;
              const variantsExpanded =
                expandedCatalogProductId === product.id ||
                normalizedCatalogQuery.length > 0;

              return (
                <div
                  key={product.id}
                  className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {previewImage ? (
                        <img
                          alt={product.name}
                          className="mb-3 h-24 w-24 rounded-lg border border-border/70 object-cover"
                          src={resolveProductImage(previewImage)}
                        />
                      ) : (
                        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-xs text-muted-foreground">
                          Sem imagem
                        </div>
                      )}
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.category} -{' '}
                        {product.defaultUnit ?? 'sem unidade padrão'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Identificador público: {product.slug}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {product._count.productOffers} ofertas
                    </Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingProductId(product.id);
                        setForm({
                          slug: product.slug,
                          name: product.name,
                          category: product.category,
                          defaultUnit: product.defaultUnit ?? '',
                        });
                      }}
                    >
                      Editar produto
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!accessToken) {
                          return;
                        }
                        await updateAdminProduct(accessToken, product.id, {
                          isActive: !product.isActive,
                        });
                        await reload();
                      }}
                    >
                      {product.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      className="text-destructive hover:text-destructive"
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        if (!accessToken) {
                          return;
                        }
                        await deleteAdminProduct(accessToken, product.id);
                        await reload();
                        await reloadVariants();
                      }}
                    >
                      Excluir produto
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setExpandedCatalogProductId(
                          variantsExpanded ? null : product.id,
                        )
                      }
                    >
                      {variantsExpanded ? (
                        <ChevronUpIcon className="size-4" />
                      ) : (
                        <ChevronDownIcon className="size-4" />
                      )}
                      {productVariants.length} variantes
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.aliases.map((alias) => (
                      <Badge key={alias.id} variant="outline">
                        {alias.alias}
                      </Badge>
                    ))}
                  </div>
                  {variantsExpanded ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {productVariants.map((variant) => (
                        <div
                          key={variant.id}
                          className="min-w-[280px] rounded-lg border-2 border-border/70 bg-muted/20 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                alt={variant.displayName}
                                className="h-12 w-12 rounded-lg border border-border/70 object-cover"
                                src={resolveProductImage(variant.imageUrl)}
                              />
                              <div className="grid gap-1">
                                <div className="text-sm font-medium">
                                  {variant.brandName
                                    ? `${variant.brandName} - `
                                    : ''}
                                  {variant.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {variant.packageLabel ??
                                    'Apresentação não informada'}{' '}
                                  · Identificador público:{' '}
                                  {variant.slug ?? 'não definido'}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setEditingVariantId(variant.id);
                                setVariantForm({
                                  catalogProductId: variant.catalogProductId,
                                  slug: variant.slug ?? '',
                                  displayName: variant.displayName,
                                  brandName: variant.brandName ?? '',
                                  variantLabel: variant.variantLabel ?? '',
                                  packageLabel: variant.packageLabel ?? '',
                                });
                                setVariantImageFile(null);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              className="text-destructive hover:text-destructive"
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={async () => {
                                if (!accessToken) {
                                  return;
                                }
                                await deleteAdminProductVariant(
                                  accessToken,
                                  variant.id,
                                );
                                await reloadVariants();
                                await reload();
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                            <span className="text-sm font-medium">Ativo</span>
                            <Switch
                              checked={variant.isActive}
                              onCheckedChange={async (checked) => {
                                if (!accessToken) {
                                  return;
                                }
                                await updateAdminProductVariant(
                                  accessToken,
                                  variant.id,
                                  { isActive: checked },
                                );
                                await reloadVariants();
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminRegionsPage() {
  const {
    data: regions,
    error,
    reload,
  } = useAdminData<AdminRegionResponse[]>(fetchAdminRegions, []);
  const { accessToken } = usePricely();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    stateCode: '',
    implantationStatus: 'activating',
  });

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    try {
      setMutationError(null);
      await createAdminRegion(accessToken, form);
      setForm({
        slug: '',
        name: '',
        stateCode: '',
        implantationStatus: 'activating',
      });
      await reload();
    } catch (createError) {
      setMutationError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a cidade.',
      );
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cidades e implantacao</CardTitle>
          <CardDescription>
            Gerencie quais cidades aparecem para o usuário final.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {mutationError ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao salvar</AlertTitle>
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          ) : null}
          <form className="grid gap-3" onSubmit={handleCreate}>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <InfoIcon className="mt-0.5 size-4 shrink-0" />
                <div className="grid gap-1">
                  <span className="font-medium text-foreground">
                    Como preencher
                  </span>
                  <span>
                    O identificador público vira o endereço público da cidade,
                    por exemplo
                    <span className="font-medium"> sao-paulo-sp</span>.
                  </span>
                  <span>
                    A quantidade de estabelecimentos ativos é calculada
                    automaticamente pelo backend.
                  </span>
                  <span>
                    A lista pública prioriza cidades com mais estabelecimentos
                    ativos; empates ficam em ordem alfabética.
                  </span>
                </div>
              </div>
            </div>
            <Input
              placeholder="Identificador público da cidade"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
            />
            <Input
              placeholder="Nome da cidade"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              placeholder="UF"
              value={form.stateCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  stateCode: event.target.value,
                }))
              }
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.implantationStatus}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  implantationStatus: event.target.value,
                }))
              }
            >
              <option value="active">Ativa</option>
              <option value="activating">Em ativação</option>
              <option value="inactive">Inativa</option>
            </select>
            <Button type="submit">Criar cidade</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cidades públicas</CardTitle>
          <CardDescription>
            Cada cidade mostra quantos estabelecimentos ativos existem hoje.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar cidades</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {regions.map((region) => (
            <div
              key={region.id}
              className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {region.name} · {region.stateCode}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Identificador público: {region.slug} ·{' '}
                    {region.activeEstablishmentsCount} estabelecimentos ativos
                  </div>
                </div>
                <Badge
                  variant={
                    region.implantationStatus === 'active'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {region.implantationStatus === 'active'
                    ? 'ativa'
                    : region.implantationStatus === 'activating'
                      ? 'em ativação'
                      : 'inativa'}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="text-sm text-muted-foreground">
                  A cidade fica visível no seletor público somente quando
                  estiver ativa ou em ativação.
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                  <span className="text-sm font-medium">Ativa no produto</span>
                  <Switch
                    checked={region.implantationStatus === 'active'}
                    onCheckedChange={async (checked) => {
                      if (!accessToken) {
                        return;
                      }
                      await updateAdminRegion(accessToken, region.id, {
                        implantationStatus: checked ? 'active' : 'inactive',
                      });
                      await reload();
                    }}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {region.implantationStatus === 'active'
                    ? 'Cidade ativa e visível para clientes.'
                    : region.implantationStatus === 'activating'
                      ? 'Cidade visível, ainda em fase de população.'
                      : 'Cidade escondida do dropdown público.'}
                </span>
                <Button
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!accessToken) {
                      return;
                    }
                    await updateAdminRegion(accessToken, region.id, {
                      implantationStatus:
                        region.implantationStatus === 'active'
                          ? 'inactive'
                          : 'active',
                    });
                    await reload();
                  }}
                >
                  {region.implantationStatus === 'active'
                    ? 'Desativar cidade'
                    : 'Ativar cidade'}
                </Button>
              </div>
              {region.establishments.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {region.establishments.map((establishment) => (
                    <div
                      key={establishment.id}
                      className="grid gap-2 rounded-lg border border-border/70 bg-background/80 p-3 md:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {establishment.unitName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {establishment.brandName} ·{' '}
                          {establishment.neighborhood} ·{' '}
                          {establishment.isActive ? 'ativo' : 'inativo'}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {establishment.auditedProductsCount} produtos auditados
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Nenhum estabelecimento vinculado a esta cidade ainda.
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminEstablishmentsPage() {
  const { data: regions } = useAdminData<AdminRegionResponse[]>(
    fetchAdminRegions,
    [],
  );
  const {
    data: establishments,
    error,
    reload,
  } = useAdminData<AdminEstablishmentResponse[]>(fetchAdminEstablishments, []);
  const { accessToken } = usePricely();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [form, setForm] = useState({
    brandName: '',
    unitName: '',
    cnpj: '',
    neighborhood: '',
    regionId: '',
  });

  const filtered =
    selectedRegionId === 'all'
      ? establishments
      : establishments.filter((entry) => entry.regionId === selectedRegionId);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    try {
      setMutationError(null);
      const selectedRegion = regions.find(
        (region) => region.id === form.regionId,
      );
      await createAdminEstablishment(accessToken, {
        ...form,
        cityName: selectedRegion?.name,
      });
      setForm({
        brandName: '',
        unitName: '',
        cnpj: '',
        neighborhood: '',
        regionId: '',
      });
      await reload();
    } catch (createError) {
      setMutationError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar o estabelecimento.',
      );
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Estabelecimentos</CardTitle>
          <CardDescription>
            Cadastre unidade e CNPJ. A cidade vem da cidade vinculada.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {mutationError ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao salvar</AlertTitle>
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          ) : null}
          <form className="grid gap-3" onSubmit={handleCreate}>
            <Input
              placeholder="rede"
              value={form.brandName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  brandName: event.target.value,
                }))
              }
            />
            <Input
              placeholder="nome da unidade"
              value={form.unitName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unitName: event.target.value,
                }))
              }
            />
            <Input
              placeholder="cnpj"
              value={form.cnpj}
              onChange={(event) =>
                setForm((current) => ({ ...current, cnpj: event.target.value }))
              }
            />
            <Input
              placeholder="bairro ou referencia"
              value={form.neighborhood}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  neighborhood: event.target.value,
                }))
              }
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.regionId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  regionId: event.target.value,
                }))
              }
            >
              <option value="">Cidade vinculada</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <Button type="submit">Criar estabelecimento</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unidades por cidade</CardTitle>
          <CardDescription>
            Filtre por cidade e acompanhe o status de ativação das unidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedRegionId}
            onChange={(event) => setSelectedRegionId(event.target.value)}
          >
            <option value="all">Todas as cidades</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar estabelecimentos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{entry.unitName}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.brandName} · {entry.region.name} ·{' '}
                    {entry.neighborhood}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                  <span className="text-sm font-medium">Ativo</span>
                  <Switch
                    checked={entry.isActive}
                    onCheckedChange={async (checked) => {
                      if (!accessToken) {
                        return;
                      }
                      await updateAdminEstablishment(accessToken, entry.id, {
                        isActive: checked,
                      });
                      await reload();
                    }}
                  />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {entry.cnpj}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export const AdminOffersPage = AdminPricesPage;

function adminUserLocationLabel(user: AdminUserResponse) {
  if (!user.preferredRegion) {
    return 'Cidade nao definida';
  }

  return `${user.preferredRegion.name} - ${user.preferredRegion.stateCode}`;
}

function adminUserPlanLabel(user: AdminUserResponse) {
  if (user.entitlement.plan === 'premium') {
    return 'Premium manual ativo';
  }

  return `${user.entitlement.availableOptimizationTokens ?? 0} creditos disponiveis`;
}

export function AdminUsersPage() {
  const { accessToken } = usePricely();
  const {
    data: users,
    error,
    reload,
  } = useAdminData<AdminUserResponse[]>(fetchAdminUsers, []);
  const [tokenAmounts, setTokenAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const handlePremiumToggle = async (user: AdminUserResponse) => {
    if (!accessToken) {
      return;
    }

    await setAdminUserPremium(
      accessToken,
      user.id,
      user.entitlement.plan !== 'premium',
    );
    setMessage(
      user.entitlement.plan === 'premium'
        ? 'Premium manual removido.'
        : 'Premium manual ativado.',
    );
    await reload();
  };

  const handleTokenGrant = async (user: AdminUserResponse) => {
    if (!accessToken) {
      return;
    }

    const amount = Number(tokenAmounts[user.id] ?? 0);
    if (!Number.isInteger(amount) || amount <= 0) {
      setMessage('Informe uma quantidade positiva de creditos.');
      return;
    }

    await grantAdminUserTokens(accessToken, user.id, {
      amount,
      reason: 'suporte_admin',
    });
    setTokenAmounts((current) => ({ ...current, [user.id]: '' }));
    setMessage(`${amount} creditos adicionados para ${user.displayName}.`);
    await reload();
  };

  return (
    <div className="grid gap-4">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Operacao de acesso, premium manual e creditos enquanto o billing
            permanece desativado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar usuarios</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {message ? (
            <Alert>
              <InfoIcon />
              <AlertTitle>Alteracao aplicada</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Usuarios</div>
              <div className="text-2xl font-semibold">{users.length}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Premium</div>
              <div className="text-2xl font-semibold">
                {
                  users.filter((user) => user.entitlement.plan === 'premium')
                    .length
                }
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Listas</div>
              <div className="text-2xl font-semibold">
                {users.reduce(
                  (sum, user) => sum + user.counts.shoppingLists,
                  0,
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Notas fiscais</div>
              <div className="text-2xl font-semibold">
                {users.reduce(
                  (sum, user) => sum + user.counts.receiptRecords,
                  0,
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Localidade</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Ultimo pagamento</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">{user.role}</Badge>
                        <Badge variant="outline">{user.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {adminUserLocationLabel(user)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ultimo acesso{' '}
                        {user.lastLoginAt
                          ? formatFreshnessLabel(user.lastLoginAt)
                          : 'nao registrado'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.counts.shoppingLists} listas ·{' '}
                        {user.counts.optimizationRuns} otimizacoes
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.counts.receiptRecords} notas ·{' '}
                        {user.counts.priceMismatchReports} reports
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCogIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {adminUserPlanLabel(user)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Origem {user.entitlement.source}; billing desativado
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.entitlement.lastPaymentAt ?? 'Sem cobranca ativa'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.entitlement.lastPaymentStatus ===
                        'billing_disabled'
                          ? 'Billing desativado'
                          : user.entitlement.lastPaymentStatus}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => void handlePremiumToggle(user)}
                          size="sm"
                          type="button"
                          variant={
                            user.entitlement.plan === 'premium'
                              ? 'outline'
                              : 'default'
                          }
                        >
                          {user.entitlement.plan === 'premium'
                            ? 'Remover premium'
                            : 'Ativar premium'}
                        </Button>
                        <div className="flex items-center gap-2">
                          <Input
                            aria-label={`Creditos extras para ${user.displayName}`}
                            className="h-9 w-24"
                            min="1"
                            onChange={(event) =>
                              setTokenAmounts((current) => ({
                                ...current,
                                [user.id]: event.target.value,
                              }))
                            }
                            placeholder="+2"
                            type="number"
                            value={tokenAmounts[user.id] ?? ''}
                          />
                          <Button
                            onClick={() => void handleTokenGrant(user)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminListsPage() {
  const { data: metrics } = useAdminData<AdminMetricsResponse | null>(
    fetchAdminMetrics,
    null,
  );
  const { lists } = usePricely();
  const { data: auditedLists, error } = useAdminData<
    AdminShoppingListAuditResponse[]
  >(fetchAdminShoppingLists, []);
  const [selectedAudit, setSelectedAudit] =
    useState<AdminShoppingListAuditResponse | null>(null);

  return (
    <div className="grid gap-4">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Operacoes de listas</CardTitle>
          <CardDescription>
            Histórico auditável das listas processadas, com dono, cidade e
            última otimização.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {metrics ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">
                  Listas no sistema
                </div>
                <div className="text-2xl font-semibold">
                  {metrics.shoppingListsCount}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">
                  Otimizacoes concluidas
                </div>
                <div className="text-2xl font-semibold">
                  {metrics.optimizationRunsCount}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">
                  Economia global estimada
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(metrics.globalEstimatedSavings)}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">
                  Listas da sessao atual
                </div>
                <div className="text-2xl font-semibold">{lists.length}</div>
              </div>
            </div>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar auditoria</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3">
            {auditedLists.map((list) => (
              <div
                key={list.id}
                className="rounded-lg border-2 border-border/80 bg-background/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{list.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {list.owner.displayName} ·{' '}
                      {list.city ?? 'Cidade não definida'} · {list.itemCount}{' '}
                      itens
                    </div>
                  </div>
                  {list.latestOptimization?.jobId ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={`/dashboard/fila/${list.latestOptimization.jobId}`}>
                        Auditar processamento
                        <ExternalLinkIcon className="size-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setSelectedAudit(list)}
                      size="sm"
                      variant="outline"
                    >
                      Ver lista
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedAudit ? (
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Detalhe da lista auditada</CardTitle>
            <CardDescription>
              Visualizacao de leitura para diagnosticar inconsistencias sem
              editar o conteudo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="font-medium">{selectedAudit.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedAudit.owner.displayName} · {selectedAudit.owner.email}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {selectedAudit.city ?? 'Cidade não definida'} · atualizada em{' '}
                {selectedAudit.updatedAt}
              </div>
            </div>
            {selectedAudit.latestOptimization ? (
              <div className="rounded-lg border border-border/70 p-4">
                <div className="font-medium">Última otimização</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {selectedAudit.latestOptimization.mode} ·{' '}
                  {selectedAudit.latestOptimization.status} · cobertura{' '}
                  {selectedAudit.latestOptimization.coverageStatus}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Custo{' '}
                  {formatCurrency(
                    selectedAudit.latestOptimization.totalEstimatedCost,
                  )}{' '}
                  · economia{' '}
                  {formatCurrency(
                    selectedAudit.latestOptimization.estimatedSavings,
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function AdminReceiptsPage() {
  const { accessToken } = usePricely();
  const {
    data: receipts,
    error,
    reload,
  } = useAdminData<AdminReceiptProcessingResponse[]>(
    fetchAdminReceiptProcessing,
    [],
  );
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(
    null,
  );

  const releaseReceipt = async (receiptId: string) => {
    if (!accessToken) {
      return;
    }

    setReleasingId(receiptId);
    try {
      await releaseAdminReceiptProcessing(accessToken, receiptId);
      await reload();
    } finally {
      setReleasingId(null);
    }
  };

  const reprocessReceipt = async (receiptId: string) => {
    if (!accessToken) {
      return;
    }

    setReleasingId(receiptId);
    try {
      await reprocessAdminReceiptProcessing(accessToken, receiptId);
      await reload();
    } finally {
      setReleasingId(null);
    }
  };

  const rejectReceipt = async (receiptId: string) => {
    if (!accessToken) {
      return;
    }

    setReleasingId(receiptId);
    try {
      await rejectAdminReceiptProcessing(accessToken, receiptId);
      await reload();
    } finally {
      setReleasingId(null);
    }
  };

  const pendingReviewCount = receipts.filter((receipt) =>
    ['pending', 'quarantined'].includes(receipt.moderationStatus),
  ).length;
  const acceptedCount = receipts.filter(
    (receipt) => receipt.moderationStatus === 'accepted',
  ).length;
  const rewardReadyCount = receipts.filter(
    (receipt) => receipt.rewardEligibilityStatus === 'eligible_pending',
  ).length;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Falha ao carregar notas fiscais</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Pendentes</CardTitle>
            <CardDescription>Notas que ainda exigem revisão.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{pendingReviewCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Aceitas</CardTitle>
            <CardDescription>Notas úteis para reforçar preços.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{acceptedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Rewards prontos</CardTitle>
            <CardDescription>
              Elegíveis após qualidade, sem billing automático.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{rewardReadyCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Notas fiscais processadas</CardTitle>
          <CardDescription>
            Conteúdo, qualidade de leitura, moderação e prontidão de reward.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {receipts.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
              Nenhuma nota fiscal recebida ainda.
            </div>
          ) : null}
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="rounded-lg border border-border/70 bg-background/80 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReceiptTextIcon className="size-4 text-muted-foreground" />
                    <span className="font-medium">
                      {receipt.storeName ?? 'Loja não identificada'}
                    </span>
                    <Badge
                      variant={
                        receipt.moderationStatus === 'accepted'
                          ? 'secondary'
                          : receipt.moderationStatus === 'rejected'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {receiptModerationLabel(receipt.moderationStatus)}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {receipt.owner.displayName || receipt.owner.email} ·{' '}
                    {receipt.storeCnpj ?? 'CNPJ não identificado'} · recebida{' '}
                    {formatFreshnessLabel(receipt.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {receipt.processingJob ? (
                    <>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/dashboard/fila/${receipt.processingJob.id}`}>
                          Auditar processamento
                          <ExternalLinkIcon className="size-4" />
                        </a>
                      </Button>
                      <Button
                        disabled={releasingId === receipt.id}
                        onClick={() => void reprocessReceipt(receipt.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Reprocessar
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled={releasingId === receipt.id}
                      onClick={() => void releaseReceipt(receipt.id)}
                      size="sm"
                      type="button"
                    >
                      Liberar processamento
                    </Button>
                  )}
                  <Button
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={
                      releasingId === receipt.id ||
                      receipt.moderationStatus === 'rejected'
                    }
                    onClick={() => void rejectReceipt(receipt.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Recusar
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-md border border-border/70 p-3">
                  <div className="text-xs text-muted-foreground">Leitura</div>
                  <div className="mt-1 font-medium">{receipt.parseStatus}</div>
                </div>
                <div className="rounded-md border border-border/70 p-3">
                  <div className="text-xs text-muted-foreground">Qualidade</div>
                  <div className="mt-1 font-medium">
                    {receiptQualityLabel(receipt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    média{' '}
                    {Math.round(receipt.quality.averageMatchConfidence * 100)}%
                  </div>
                </div>
                <div className="rounded-md border border-border/70 p-3">
                  <div className="text-xs text-muted-foreground">Confiança</div>
                  <div className="mt-1 font-medium">{receipt.trustLevel}</div>
                </div>
                <div className="rounded-md border border-border/70 p-3">
                  <div className="text-xs text-muted-foreground">Reward</div>
                  <div className="mt-1 font-medium">{receipt.reward.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {receipt.rewardEligibilityStatus}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                {receipt.reviewReason ??
                  'Sem motivo de revisão registrado para esta nota.'}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                <div className="text-sm text-muted-foreground">
                  {receipt.lineItems.length} itens extraídos ·{' '}
                  {
                    receipt.lineItems.filter((item) => item.offers.length > 0)
                      .length
                  }{' '}
                  com oferta gerada
                </div>
                <Button
                  onClick={() =>
                    setExpandedReceiptId((current) =>
                      current === receipt.id ? null : receipt.id,
                    )
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {expandedReceiptId === receipt.id ? (
                    <ChevronUpIcon className="size-4" />
                  ) : (
                    <ChevronDownIcon className="size-4" />
                  )}
                  {expandedReceiptId === receipt.id
                    ? 'Ocultar conteúdo'
                    : 'Ver conteúdo e matcher'}
                </Button>
              </div>

              {expandedReceiptId === receipt.id ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 rounded-md border border-border/70 bg-card/70 p-3 md:grid-cols-4">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Payload extraído
                      </div>
                      <div className="mt-1 font-medium">
                        {receipt.extractedPayload.lineItemCount} itens ·{' '}
                        {formatCurrency(
                          receipt.extractedPayload.totalLineAmount,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Chave NFC-e
                      </div>
                      <div className="mt-1 truncate font-medium">
                        {receipt.extractedPayload.accessKey ?? 'Não informada'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Origem
                      </div>
                      <div className="mt-1 truncate font-medium">
                        {receipt.extractedPayload.sefazUrl
                          ? 'QR/NFC-e'
                          : (receipt.extractedPayload.rawReference ??
                            'Entrada manual')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Matcher
                      </div>
                      <div className="mt-1 font-medium">
                        {
                          receipt.lineItems.filter(
                            (item) => item.matcherStatus === 'matched_offer',
                          ).length
                        }{' '}
                        ofertas ·{' '}
                        {
                          receipt.lineItems.filter(
                            (item) =>
                              item.matcherStatus === 'needs_product_review',
                          ).length
                        }{' '}
                        para revisar
                      </div>
                    </div>
                  </div>
                  {receipt.lineItems.length === 0 ? (
                    <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                      Nenhum item extraído da nota fiscal ainda.
                    </div>
                  ) : null}
                  {receipt.lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-border/70 bg-card/70 p-3"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="font-medium">
                            {item.rawProductName}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Normalizado: {item.normalizedName} · EAN{' '}
                            {item.ean ?? 'não informado'} · qtd {item.quantity}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              item.matcherStatus === 'matched_offer'
                                ? 'secondary'
                                : item.matcherStatus === 'needs_product_review'
                                  ? 'destructive'
                                  : 'outline'
                            }
                          >
                            {receiptMatcherStatusLabel(item.matcherStatus)}
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(item.matchConfidence * 100)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="rounded-md border border-border/70 p-3">
                          <div className="text-xs text-muted-foreground">
                            Preço lido
                          </div>
                          <div className="mt-1 font-medium">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            total {formatCurrency(item.lineTotal)}
                          </div>
                          {item.originalUnitPrice &&
                          item.originalUnitPrice !== item.unitPrice ? (
                            <div className="text-xs text-muted-foreground">
                              original {formatCurrency(item.originalUnitPrice)}
                            </div>
                          ) : null}
                        </div>
                        <div className="rounded-md border border-border/70 p-3">
                          <div className="text-xs text-muted-foreground">
                            Maker
                          </div>
                          <div className="mt-1 font-medium">
                            {receiptMakerActionLabel(item.makerAction)}
                          </div>
                          <Button
                            asChild
                            className="mt-2"
                            size="sm"
                            variant="outline"
                          >
                            <a
                              href={
                                item.makerAction === 'offer_created'
                                  ? '/dashboard/precos'
                                  : '/dashboard/catalogo'
                              }
                            >
                              {receiptMakerActionButtonLabel(item.makerAction)}
                            </a>
                          </Button>
                        </div>
                        <div className="rounded-md border border-border/70 p-3">
                          <div className="text-xs text-muted-foreground">
                            Ofertas geradas
                          </div>
                          <div className="mt-1 font-medium">
                            {item.offers.length}
                          </div>
                        </div>
                      </div>

                      {item.offers.length > 0 ? (
                        <div className="mt-3 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Loja</TableHead>
                                <TableHead>Preço da nota</TableHead>
                                <TableHead>Comparativo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.offers.map((offer) => (
                                <TableRow key={offer.id}>
                                  <TableCell>
                                    <div className="grid gap-1">
                                      <span>{offer.variantName}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {offer.catalogProductName} ·{' '}
                                        {offer.packageLabel}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {offer.establishmentName} ·{' '}
                                    {offer.neighborhood}
                                  </TableCell>
                                  <TableCell>
                                    {formatCurrency(offer.priceAmount)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="grid gap-1">
                                      <Badge
                                        variant={
                                          offer.comparison.direction === 'up'
                                            ? 'destructive'
                                            : offer.comparison.direction ===
                                                'down'
                                              ? 'secondary'
                                              : 'outline'
                                        }
                                      >
                                        {priceDirectionLabel(
                                          offer.comparison.direction,
                                        )}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {offer.comparison.previousPriceAmount
                                          ? `${formatCurrency(
                                              offer.comparison
                                                .previousPriceAmount,
                                            )} anterior · ${formatCurrency(
                                              offer.comparison.deltaAmount ?? 0,
                                            )}`
                                          : 'Sem oferta anterior comparável'}
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminQueuePage() {
  const { data: metrics } = useAdminData<AdminMetricsResponse | null>(
    fetchAdminMetrics,
    null,
  );
  const { data: jobs } = useAdminData<AdminProcessingJobResponse[]>(
    fetchAdminProcessingJobs,
    [],
  );
  const { data: queueHealth } = useAdminData<AdminQueueHealthResponse | null>(
    fetchAdminQueueHealth,
    null,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Saude da fila</CardTitle>
          <CardDescription>
            Jobs pendentes, falhas recentes e capacidade de processamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {metrics ? (
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Jobs em fila</div>
              <div className="text-2xl font-semibold">{metrics.queuedJobs}</div>
            </div>
          ) : null}
          {queueHealth && queueHealth.queues.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
              Nenhuma fila registrada ainda.
            </div>
          ) : null}
          {queueHealth?.recentFailures?.length ? (
            <div className="rounded-lg border border-destructive/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangleIcon className="size-4 text-destructive" />
                Falhas recentes
              </div>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                {queueHealth.recentFailures.map((failure, index) => (
                  <div key={`${failure.queueName}-${index}`}>
                    {failure.queueName}: {failure.failureReason}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {queueHealth ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-[#ECFDF5] p-4">
                <div className="text-sm text-[#166534]">Concluidos</div>
                <div className="mt-2 text-2xl font-semibold text-[#14532D]">
                  {queueHealth.completedJobs}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-[#EFF6FF] p-4">
                <div className="text-sm text-[#1D4ED8]">Filas monitoradas</div>
                <div className="mt-2 text-2xl font-semibold text-[#1E3A8A]">
                  {queueHealth.queues.length}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Jobs recentes</CardTitle>
          <CardDescription>
            Diagnóstico da fila: status, tentativa, tempo e falhas. A auditoria
            de lista ou nota fica nas telas respectivas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {jobs.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
              Fila vazia no momento. Nenhum job recente para auditoria.
            </div>
          ) : null}
          {jobs.slice(0, 10).map((job) => (
            <div
              key={job.id}
              className="rounded-lg border border-border/70 bg-background/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground">
                    <JobResourceIcon job={job} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {job.queueName} · {job.jobType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      tentativa {job.attemptCount} · recurso{' '}
                      {job.resourceType.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
                <Badge variant={jobStatusBadgeVariant(job.status)}>
                  {jobStatusLabel(job.status)}
                </Badge>
              </div>
              {job.failureReason ? (
                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {job.failureReason}
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <span>Solicitado {formatFreshnessLabel(job.createdAt)}</span>
                {job.finishedAt ? (
                  <span>Concluido {formatFreshnessLabel(job.finishedAt)}</span>
                ) : (
                  <span>Aguardando conclusão</span>
                )}
                <span>Status operacional: {jobStatusLabel(job.status)}</span>
                <span>Dono: {jobOwnerLabel(job)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <div className="truncate text-xs text-muted-foreground">
                  ID técnico: {job.resourceType} · {job.resourceId} · job{' '}
                  {job.id}
                </div>
                <Button asChild size="icon" variant="outline">
                  <a
                    aria-label={`Abrir detalhe do job ${job.id}`}
                    href={`/dashboard/fila/${job.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminQueueDetailPage() {
  const { jobId = '' } = useParams();
  const loader = (token: string) => fetchAdminProcessingJobDetail(token, jobId);
  const { data: job, error } =
    useAdminData<AdminProcessingJobDetailResponse | null>(loader, null);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Falha ao carregar job</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando job</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const optimizationSelectionCounts = job.optimizationRun
    ? {
        selected: job.optimizationRun.selections.filter(
          (selection) => selection.status === 'selected',
        ).length,
        review: job.optimizationRun.selections.filter(
          (selection) => selection.status === 'review',
        ).length,
        missing: job.optimizationRun.selections.filter(
          (selection) => selection.status === 'missing',
        ).length,
      }
    : null;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{jobResourceTitle(job)}</CardTitle>
              <CardDescription>
                {jobOwnerLabel(job)} · {job.queueName} · tentativa{' '}
                {job.attemptCount}
              </CardDescription>
            </div>
            <Badge variant={jobStatusBadgeVariant(job.status)}>
              {jobStatusLabel(job.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Recurso</div>
              <div className="mt-1 font-medium">{jobResourceTitle(job)}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Solicitado</div>
              <div className="mt-1 font-medium">
                {formatFreshnessLabel(job.createdAt)}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Concluído</div>
              <div className="mt-1 font-medium">
                {job.finishedAt
                  ? formatFreshnessLabel(job.finishedAt)
                  : 'Ainda sem conclusão'}
              </div>
            </div>
          </div>
          {job.failureReason ? (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>Falha operacional</AlertTitle>
              <AlertDescription>{job.failureReason}</AlertDescription>
            </Alert>
          ) : null}
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="text-sm font-medium">Dados técnicos</div>
            <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <span>job_id: {job.id}</span>
              <span>
                resource: {job.resourceType} · {job.resourceId}
              </span>
              <span>job_type: {job.jobType}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operação</CardTitle>
          <CardDescription>
            Leitura operacional do processamento, com dados técnicos apenas
            quando ajudam no diagnóstico.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-sm text-muted-foreground">
              Identificador do job
            </div>
            <div className="mt-1 font-medium">{job.id}</div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-sm text-muted-foreground">Status atual</div>
            <div className="mt-1 font-medium">{jobStatusLabel(job.status)}</div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-sm text-muted-foreground">Objeto processado</div>
            <div className="mt-1 font-medium">
              {jobResourceTitle(job)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {job.resourceType} · {job.resourceId}
            </div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-sm text-muted-foreground">Responsável</div>
            <div className="mt-1 font-medium">
              {job.owner
                ? `${job.owner.displayName || job.owner.email}`
                : 'Sem usuário vinculado'}
            </div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-sm text-muted-foreground">Entrada na fila</div>
            <div className="mt-1 font-medium">
              {formatFreshnessLabel(job.createdAt)}
            </div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-sm text-muted-foreground">Conclusão</div>
            <div className="mt-1 font-medium">
              {job.finishedAt
                ? formatFreshnessLabel(job.finishedAt)
                : 'Ainda sem conclusão'}
            </div>
          </div>
        </CardContent>
      </Card>

      {job.optimizationRun ? (
        <Card>
          <CardHeader>
            <CardTitle>Otimização</CardTitle>
            <CardDescription>
              {job.shoppingList?.name ?? job.resourceId} · modo{' '}
              {optimizationModeLabel(job.optimizationRun.mode)} · cobertura{' '}
              {job.optimizationRun.coverageStatus}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Custo total</div>
                <div className="mt-1 text-xl font-semibold">
                  {formatCurrency(job.optimizationRun.totalEstimatedCost)}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Economia</div>
                <div className="mt-1 text-xl font-semibold">
                  {formatCurrency(job.optimizationRun.estimatedSavings)}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Lista</div>
                <div className="mt-1 text-xl font-semibold">
                  {job.shoppingList?.name ?? job.resourceId}
                </div>
              </div>
            </div>
            {optimizationSelectionCounts ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                  <div className="text-sm text-muted-foreground">
                    Itens selecionados
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {optimizationSelectionCounts.selected}
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                  <div className="text-sm text-muted-foreground">
                    Itens para revisar
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {optimizationSelectionCounts.review}
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                  <div className="text-sm text-muted-foreground">
                    Sem oferta
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {optimizationSelectionCounts.missing}
                  </div>
                </div>
              </div>
            ) : null}
            {job.optimizationRun.summary ? (
              <Alert>
                <InfoIcon />
                <AlertTitle>Como o resultado foi montado</AlertTitle>
                <AlertDescription>
                  {optimizationSummaryLabel(job.optimizationRun.summary)}
                </AlertDescription>
              </Alert>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Decisão</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.optimizationRun.selections.map((selection) => (
                  <TableRow key={selection.id}>
                    <TableCell>{selection.shoppingListItemName}</TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <Badge
                          variant={
                            selection.status === 'selected'
                              ? 'secondary'
                              : selection.status === 'review'
                                ? 'outline'
                                : 'destructive'
                          }
                        >
                          {optimizationSelectionStatusLabel(selection.status)}
                        </Badge>
                        {selection.offer?.confidenceLevel ? (
                          <span className="text-xs text-muted-foreground">
                            Confiança da oferta{' '}
                            {selection.offer.confidenceLevel}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {selection.offer
                        ? `${selection.offer.establishmentName} · ${selection.offer.neighborhood}`
                        : 'Sem oferta selecionada'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        selection.offer?.priceAmount ?? selection.estimatedCost,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span>
                          {selection.offer?.sourceLabel ??
                            selection.confidenceNotice ??
                            'Sem fonte'}
                        </span>
                        {selection.offer ? (
                          <span className="text-xs text-muted-foreground">
                            {selection.offer.sourceType ?? 'fonte'} · atualizado{' '}
                            {formatFreshnessLabel(selection.offer.observedAt)}
                          </span>
                        ) : null}
                        {selection.offer?.receiptEvidence ? (
                          <span className="text-xs text-muted-foreground">
                            Nota{' '}
                            {receiptModerationLabel(
                              selection.offer.receiptEvidence.moderationStatus,
                            )}{' '}
                            ·{' '}
                            {receiptTrustLabel(
                              selection.offer.receiptEvidence.trustLevel,
                            )}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {job.receiptRecord ? (
        <Card>
          <CardHeader>
            <CardTitle>Recibo contribuído</CardTitle>
            <CardDescription>
              {job.receiptRecord.storeName ?? 'Loja não identificada'} ·{' '}
              {job.receiptRecord.parseStatus} ·{' '}
              {receiptTrustLabel(job.receiptRecord.trustLevel)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Moderacao</div>
                <div className="mt-1 text-lg font-semibold">
                  {receiptModerationLabel(job.receiptRecord.moderationStatus)}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Confianca</div>
                <div className="mt-1 text-lg font-semibold">
                  {receiptTrustLabel(job.receiptRecord.trustLevel)}
                </div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Reward</div>
                <div className="mt-1 text-lg font-semibold">
                  {rewardEligibilityLabel(
                    job.receiptRecord.rewardEligibilityStatus,
                  )}
                </div>
              </div>
            </div>
            <Alert>
              <InfoIcon />
              <AlertTitle>
                {job.receiptRecord.moderationStatus === 'accepted'
                  ? 'Contribuição aceita'
                  : job.receiptRecord.moderationStatus === 'duplicate'
                    ? 'Recibo duplicado'
                    : job.receiptRecord.moderationStatus === 'quarantined'
                      ? 'Pendente de revisão'
                      : 'Contribuição registrada'}
              </AlertTitle>
              <AlertDescription>
                Rewards por recibo seguem desativados no MVP. Motivo:{' '}
                {job.receiptRecord.reviewReason ??
                  'controle anti-abuso pendente'}
                .
              </AlertDescription>
            </Alert>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Normalizado</TableHead>
                  <TableHead>EAN</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Confiança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.receiptRecord.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.rawProductName}</TableCell>
                    <TableCell>{item.normalizedName}</TableCell>
                    <TableCell>{item.ean ?? 'Sem EAN'}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>
                      {Math.round(item.matchConfidence * 100)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
