import { useEffect, useState, type FormEvent } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  Clock3Icon,
  ExternalLinkIcon,
  EyeIcon,
  FlagIcon,
  InfoIcon,
  ListChecksIcon,
  ListIcon,
  LockIcon,
  MapPinIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  RouteIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  Share2Icon,
  SlidersHorizontalIcon,
  StoreIcon,
  TagsIcon,
  UploadIcon,
} from 'lucide-react';

import {
  formatCurrency,
  formatDateTime,
  formatFreshnessLabel,
} from '@/app/format';
import { resolveProductImage } from '@/app/media';
import { getCityById, optimizationModes } from '@/app/mock-data';
import pricelyIcon from '@/assets/pricely-icon.png';
import {
  type CatalogProductSearchResponse,
  type OfferDetailApiResponse,
  type OptimizationResultApiResponse,
  type PublicImpactResponse,
  type ProductVariantResponse,
  type RegionOffersApiResponse,
  fetchPublicImpact,
  fetchCatalogProductVariants,
  fetchOfferDetail,
  fetchRegionOffers,
  fetchSharedShoppingList,
  mapShoppingList,
  requestCityInclusion,
  requestMissingProduct,
  searchCatalogProducts,
  submitReceipt,
} from '@/app/api';
import { usePricely } from '@/app/pricely-context';
import type {
  ConfidenceLevel,
  FreshnessLevel,
  OptimizationModeId,
  ShoppingList,
  ShoppingListItem,
  SupportedCity,
} from '@/app/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  ActionPlaceholder,
  EvidenceModule,
  InfoTooltip,
  MaskedMoney,
  PriceRow,
  PricelyBrandMark,
  StatusBadge,
  StickyActionBar,
  WithTooltip,
} from '@/components/design-system';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type EditableListItem = {
  id: string;
  name: string;
  catalogProductId?: string;
  lockedProductVariantId?: string;
  brandPreferenceMode: 'any' | 'preferred' | 'exact';
  preferredBrandNames: string[];
  imageUrl?: string;
  quantity: number;
  unitLabel: string;
  purchaseStatus?: 'pending' | 'purchased';
  note?: string;
};

type OptimizationSelectionView =
  OptimizationResultApiResponse['selections'][number];
type OptimizationResultTab =
  | 'optimized'
  | 'unavailable'
  | 'stores'
  | 'savings';
type OptimizationItemFilter = 'all' | 'selected' | 'review';

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const visiblePages = [...pages]
    .filter((page) => page > 0 && page <= totalPages)
    .sort((left, right) => left - right);
  const items: Array<number | 'ellipsis'> = [];

  for (const page of visiblePages) {
    const previous = items[items.length - 1];
    if (typeof previous === 'number' && page - previous > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  }

  return items;
}

function CitySelectionDialog({
  cityId,
  cities,
  onOpenChange,
  onSelectCity,
  open,
}: {
  cityId: string | null;
  cities: SupportedCity[];
  onOpenChange: (open: boolean) => void;
  onSelectCity: (cityId: string) => unknown;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Selecionar cidade</DialogTitle>
          <DialogDescription>
            Escolha a cidade aqui para atualizar ofertas, listas e lojas no
            header. A tela de cidades continua sendo apenas o catálogo de
            cobertura.
          </DialogDescription>
        </DialogHeader>
        <Select
          onValueChange={(value) => {
            void onSelectCity(value);
            onOpenChange(false);
          }}
          value={cityId ?? ''}
        >
          <SelectTrigger>
            <MapPinIcon />
            <SelectValue placeholder="Selecione uma cidade disponível" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name} - {city.activeStoreCount} estabelecimentos
                  ativos
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button asChild variant="outline">
            <Link to="/cidades">Ver cidades e lojas</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getCatalogProductPreviewImage(product: CatalogProductSearchResponse) {
  return (
    product.imageUrl ??
    product.productVariants.find((variant) => variant.imageUrl)?.imageUrl
  );
}

function describeBrandRule(
  item: {
    brandPreferenceMode?: 'any' | 'preferred' | 'exact';
    preferredBrandNames?: string[];
  },
  exactVariantName?: string,
) {
  if (item.brandPreferenceMode === 'exact') {
    return exactVariantName
      ? `Variante exata: ${exactVariantName}`
      : 'Variante exata selecionada';
  }

  return 'Qualquer variante';
}

function formatVariantWithPackage(
  variantName?: string | null,
  packageLabel?: string | null,
) {
  if (!variantName) {
    return packageLabel ?? '';
  }

  if (!packageLabel) {
    return variantName;
  }

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/(\d)\s+(g|kg|ml|l|un|rolos?)\b/g, '$1$2')
      .replace(/\s+/g, ' ')
      .trim();

  return normalize(variantName).includes(normalize(packageLabel))
    ? variantName
    : `${variantName} · ${packageLabel}`;
}

const optimizationModeCopy: Record<
  OptimizationModeId,
  { title: string; summary: string; tradeoff: string }
> = {
  local: {
    title: 'Uma loja perto de mim',
    summary:
      'Modo legado: usa a semantica de uma loja local quando houver localizacao salva.',
    tradeoff: 'Mantido apenas por compatibilidade com listas antigas.',
  },
  local_unique: {
    title: 'Uma loja perto de mim',
    summary:
      'Prepara a compra em uma unica loja dentro do raio local configurado.',
    tradeoff:
      'Exige localizacao salva e pode priorizar cobertura antes do menor preco total.',
  },
  global_unique: {
    title: 'Uma loja na cidade',
    summary: 'Procura a melhor loja unica para equilibrar cobertura e preco.',
    tradeoff: 'Modo legado mantido por compatibilidade com resultados antigos.',
  },
  local_multi: {
    title: 'Menor preco perto de mim',
    summary:
      'Escolhe item a item entre lojas dentro do raio local configurado.',
    tradeoff:
      'Pode dividir a compra em mais de uma loja dentro do raio escolhido.',
  },
  global_full: {
    title: 'Menor total na cidade',
    summary: 'Modo legado equivalente ao menor total na cidade.',
    tradeoff: 'Mantido por compatibilidade com listas antigas.',
  },
  global_multi: {
    title: 'Menor total na cidade',
    summary: 'Busca o menor custo total item a item na cidade selecionada.',
    tradeoff: 'Pode exigir mais de uma parada para capturar a melhor economia.',
  },
};

function parseErrorMessage(value: string) {
  try {
    const parsed = JSON.parse(value) as {
      message?: string | string[];
      error?: { message?: string | string[] } | string;
    };
    const message =
      typeof parsed.error === 'object' ? parsed.error.message : parsed.message;

    if (Array.isArray(message)) {
      return message.join('; ');
    }

    return message ?? value;
  } catch {
    return value;
  }
}

function toOptimizationError(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? parseErrorMessage(error.message)
      : 'Não foi possível otimizar a lista.';
  const normalized = rawMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (
    normalized.includes('no active establishments') ||
    normalized.includes('nenhum estabelecimento ativo')
  ) {
    return {
      title: 'Ajuste sua cobertura local',
      description:
        'Nao encontramos estabelecimentos ativos com localizacao dentro do raio escolhido. Aumente o raio, salve outro local ou use o modo de menor total na cidade.',
    };
  }

  if (
    normalized.includes('configure uma localizacao') ||
    normalized.includes('location')
  ) {
    return {
      title: 'Localizacao necessaria',
      description:
        'Salve uma localizacao ou CEP antes de usar os modos perto de mim.',
    };
  }

  return {
    title: 'Falha no processamento',
    description: rawMessage,
  };
}

function freshnessBadge(level: FreshnessLevel) {
  if (level === 'fresh') {
    return (
      <StatusBadge
        family="freshness"
        status="fresh"
        tooltip="Preço validado hoje ou dentro da janela mais recente da cidade."
      >
        Atualizado hoje
      </StatusBadge>
    );
  }
  if (level === 'aging') {
    return (
      <StatusBadge
        family="freshness"
        status="aging"
        tooltip="Há evidência de preço, mas a cobertura ainda é parcial ou menos recente."
      />
    );
  }

  return (
    <StatusBadge
      family="freshness"
      status="stale"
      tooltip="Preço antigo: use como referência e confirme antes de comprar."
    />
  );
}

function confidenceBadge(level: ConfidenceLevel) {
  if (level === 'alta') {
    return (
      <StatusBadge
        family="trust"
        status="high"
        tooltip="Alta confiança: preço sustentado por evidências recentes e consistentes."
      >
        Confiança alta
      </StatusBadge>
    );
  }
  if (level === 'media') {
    return (
      <StatusBadge
        family="trust"
        status="medium"
        tooltip="Confiança média: preço útil para comparação, mas ainda pede confirmação."
      />
    );
  }

  return (
    <StatusBadge
      family="trust"
      status="low"
      tooltip="Confiança baixa: revise loja, variante e data antes de tomar decisão."
    >
      Revisar
    </StatusBadge>
  );
}

function NextBestActionStrip({
  eyebrow = 'Próximo passo',
  title,
  description,
  primaryAction,
  secondaryAction,
  steps,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
  steps: Array<{
    label: string;
    status: 'done' | 'current' | 'pending';
  }>;
}) {
  const statusTone = {
    done: 'border-[var(--ds-savings-border)] bg-[var(--ds-savings-soft)] text-[var(--ds-savings)]',
    current:
      'border-[var(--ds-primary-border)] bg-[var(--ds-primary-soft)] text-[var(--ds-primary)]',
    pending:
      'border-[var(--ds-neutral-border)] bg-[var(--ds-neutral-soft)] text-muted-foreground',
  };

  return (
    <div className="rounded-lg border border-border/70 bg-card/95 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-2">
          <StatusBadge tone="primary" className="w-fit">
            {eyebrow}
          </StatusBadge>
          <div>
            <div className="font-heading text-lg font-semibold">{title}</div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {steps.map((step) => (
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${statusTone[step.status]}`}
                key={step.label}
              >
                {step.status === 'done' ? (
                  <CheckCircle2Icon className="size-3.5" />
                ) : null}
                {step.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {secondaryAction ? (
            <Button asChild variant="outline">
              <Link to={secondaryAction.to}>{secondaryAction.label}</Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link to={primaryAction.to}>{primaryAction.label}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShopperEvidenceModule({
  listId,
  selection,
}: {
  listId: string;
  selection: OptimizationSelectionView;
}) {
  const freshnessText =
    selection.trustFreshnessDays === undefined
      ? 'Sem data de validação'
      : selection.trustFreshnessDays === 0
        ? 'Validado hoje'
        : `Validado há ${selection.trustFreshnessDays}d`;

  return (
    <EvidenceModule
      selectedVariant={
        selection.selectedVariantName
          ? formatVariantWithPackage(
              selection.selectedVariantName,
              selection.selectedPackageLabel,
            )
          : selection.shoppingListItemName
      }
      requestedRule="Regra salva na lista"
      store={
        selection.establishmentName
          ? `${selection.establishmentName}${
              selection.establishmentNeighborhood
                ? ` · ${selection.establishmentNeighborhood}`
                : ''
            }`
          : 'Sem loja definida'
      }
      price={
        <MaskedMoney
          value={formatCurrency(
            selection.priceAmount ?? selection.estimatedCost ?? 0,
          )}
        />
      }
      sourceLabel={selection.sourceLabel ?? 'Origem operacional'}
      trustScore={selection.trustFactor}
      trustLevel={selection.trustLevel ?? 'unknown'}
      evidenceCount={selection.trustEvidenceCount}
      freshnessLabel={freshnessText}
      confidenceNotice={
        selection.confidenceNotice
          ? confidenceNoticeLabel(selection.confidenceNotice)
          : undefined
      }
      reportAction={
        <Button asChild size="sm" variant="outline">
          <Link to={`/listas/${listId}/checklist`}>
            <FlagIcon className="size-3.5" />
            Reportar preço
          </Link>
        </Button>
      }
      uploadAction={
        <Button asChild size="sm" variant="ghost">
          <Link to="/notas">
            <UploadIcon className="size-3.5" />
            Enviar nota
          </Link>
        </Button>
      }
    />
  );
}

function PriceDisplay({
  priceAmount,
  basePriceAmount,
  promotionalPriceAmount,
  size = 'md',
}: {
  priceAmount: number;
  basePriceAmount?: number | null;
  promotionalPriceAmount?: number | null;
  size?: 'md' | 'lg';
}) {
  const hasPromotion =
    promotionalPriceAmount !== undefined &&
    promotionalPriceAmount !== null &&
    basePriceAmount !== undefined &&
    basePriceAmount !== null &&
    basePriceAmount > promotionalPriceAmount;

  return (
    <div className="grid gap-1">
      {hasPromotion ? (
        <div className="text-sm text-muted-foreground line-through">
          <MaskedMoney value={formatCurrency(basePriceAmount)} />
        </div>
      ) : null}
      <div
        className={
          size === 'lg' ? 'text-4xl font-semibold' : 'text-2xl font-semibold'
        }
      >
        <MaskedMoney value={formatCurrency(priceAmount)} />
      </div>
    </div>
  );
}

function cityStatusBadge(city: SupportedCity) {
  if (city.status === 'supported') {
    return (
      <StatusBadge
        family="city"
        status="active"
        tooltip="Cidade disponível para ofertas, listas e otimização com cobertura local."
      >
        Disponível
      </StatusBadge>
    );
  }
  if (city.status === 'pilot') {
    return (
      <StatusBadge
        family="city"
        status="activating"
        tooltip="Cidade em piloto: parte dos dados ainda está sendo calibrada."
      >
        Piloto
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      family="city"
      status="hidden"
      tooltip="Ainda sem cobertura pública; você pode registrar interesse para priorização."
    >
      Em breve
    </StatusBadge>
  );
}

function coverageStatusLabel(status: 'complete' | 'partial' | 'none') {
  if (status === 'complete') {
    return 'Completa';
  }
  if (status === 'partial') {
    return 'Parcial';
  }

  return 'Sem cobertura';
}

function selectionStatusLabel(status: 'selected' | 'missing' | 'review') {
  if (status === 'selected') {
    return 'Oferta selecionada';
  }
  if (status === 'review') {
    return 'Revisar evidência';
  }

  return 'Sem oferta confirmada';
}

function buildEstablishmentMapUrl(selection: {
  establishmentName?: string;
  establishmentNeighborhood?: string;
  establishmentAddressLine?: string;
  establishmentPostalCode?: string;
  establishmentLatitude?: number;
  establishmentLongitude?: number;
}) {
  const { establishmentLatitude, establishmentLongitude } = selection;
  if (
    establishmentLatitude !== undefined &&
    establishmentLongitude !== undefined
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${establishmentLatitude},${establishmentLongitude}`,
    )}`;
  }
  const query = [
    selection.establishmentName,
    selection.establishmentAddressLine,
    selection.establishmentNeighborhood,
    selection.establishmentPostalCode,
  ]
    .filter(Boolean)
    .join(', ');
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : undefined;
}

function rejectedReasonLabel(reason?: string) {
  if (!reason) {
    return '';
  }

  const labels: Record<string, string> = {
    no_confirmed_offer_available: 'sem oferta confirmada',
    no_active_available_offer: 'sem oferta ativa disponível',
    single_store_constraint: 'fora da loja escolhida',
    missing_normalized_product: 'produto precisa de revisão',
  };

  return labels[reason] ?? 'sem evidência suficiente';
}

function confidenceNoticeLabel(notice?: string) {
  if (!notice) {
    return undefined;
  }

  const normalized = notice.toLowerCase();
  if (normalized.includes('no confirmed offer')) {
    return 'Ainda não há oferta confirmada para este item.';
  }
  if (normalized.includes('selected store does not have')) {
    return 'A loja selecionada ainda não tem oferta confirmada para este item.';
  }
  if (normalized.includes('low-confidence')) {
    return 'Evidência de preço com confiança baixa.';
  }
  if (normalized.includes('could not be normalized')) {
    return 'O item precisa de revisão antes de confiar no resultado.';
  }

  return notice;
}

function decisionReasonLabel(reason?: string) {
  if (!reason) {
    return undefined;
  }

  const labels: Record<string, string> = {
    selected_confirmed_offer: 'Oferta confirmada selecionada',
    selected_with_data_quality_warning:
      'Oferta selecionada com alerta de qualidade',
    no_confirmed_offer: 'Sem oferta confirmada',
    not_selected: 'Não selecionado',
  };

  return labels[reason] ?? undefined;
}

function savingsComparisonLabel(selection: {
  savingsVsComparison?: number;
  comparisonPriceAmount?: number;
  regionalAveragePriceAmount?: number;
}) {
  const savings = selection.savingsVsComparison ?? 0;

  if (savings <= 0) {
    return null;
  }

  if (selection.comparisonPriceAmount !== undefined) {
    return (
      <>
        <MaskedMoney value={formatCurrency(selection.comparisonPriceAmount)} />{' '}
        segundo menor elegivel · <MaskedMoney value={formatCurrency(savings)} />{' '}
        abaixo
      </>
    );
  }

  if (selection.regionalAveragePriceAmount !== undefined) {
    return (
      <>
        <MaskedMoney
          value={formatCurrency(selection.regionalAveragePriceAmount)}
        />{' '}
        media da variante · <MaskedMoney value={formatCurrency(savings)} />{' '}
        abaixo
      </>
    );
  }

  return (
    <>
      <MaskedMoney value={formatCurrency(savings)} /> de economia estimada nas
      ofertas disponíveis
    </>
  );
}

type PublicOfferGroup = NonNullable<
  RegionOffersApiResponse['groupedOffers']
>[number];

function getComparableOffers(group: PublicOfferGroup) {
  return group.offers.length > 0
    ? group.offers
    : [group.bestOffer, ...group.alternativeOffers];
}

function groupFlatRegionalOffers(
  offers: RegionOffersApiResponse['offers'],
): NonNullable<RegionOffersApiResponse['groupedOffers']> {
  const grouped = new Map<string, RegionOffersApiResponse['offers']>();

  for (const offer of offers) {
    const key = offer.productVariantId;
    grouped.set(key, [...(grouped.get(key) ?? []), offer]);
  }

  return [...grouped.entries()]
    .map(([productVariantId, entries]) => {
      const sorted = [...entries].sort((left, right) => {
        if (left.priceAmount !== right.priceAmount) {
          return left.priceAmount - right.priceAmount;
        }

        return (
          new Date(right.observedAt).getTime() -
          new Date(left.observedAt).getTime()
        );
      });
      const bestOffer = sorted[0];
      const prices = sorted.map((offer) => offer.priceAmount);
      const secondCheapestPriceAmount = sorted[1]?.priceAmount;
      const averagePriceAmount = Number(
        (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(
          2,
        ),
      );

      return {
        id: productVariantId,
        catalogProductId: bestOffer.catalogProductId,
        productVariantId,
        productName: bestOffer.productName,
        variantName: bestOffer.variantName,
        imageUrl: bestOffer.imageUrl,
        packageLabel: bestOffer.packageLabel,
        bestOffer,
        alternativeOffers: sorted.slice(1),
        offers: sorted,
        establishmentCount: sorted.length,
        cheapestPriceAmount: bestOffer.priceAmount,
        secondCheapestPriceAmount,
        savingsVsSecondCheapest: Number(
          Math.max(
            0,
            (secondCheapestPriceAmount ?? bestOffer.priceAmount) -
              bestOffer.priceAmount,
          ).toFixed(2),
        ),
        averagePriceAmount,
        highestPriceAmount: Math.max(...prices),
      };
    })
    .sort((left, right) => {
      if (left.productName !== right.productName) {
        return left.productName.localeCompare(right.productName);
      }

      return left.cheapestPriceAmount - right.cheapestPriceAmount;
    });
}

function RequireAuthentication({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  const { cityId, cities, isAuthenticated, isBootstrapping, setCityId } =
    usePricely();
  const [isCitySelectionOpen, setIsCitySelectionOpen] = useState(false);

  if (isBootstrapping) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando sua conta</CardTitle>
          <CardDescription>
            Validando sessão e sincronizando listas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isAuthenticated) {
    const isReceiptRoute = title.toLowerCase().includes('nota');

    return (
      <section className="grid gap-5">
        <Alert className="border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)]">
          <MapPinIcon className="size-4" />
          <AlertTitle>Selecione uma cidade para continuar</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Voce pode escolher sua cidade para ver ofertas e lojas
              disponiveis.
            </span>
            <Button
              className="w-fit"
              onClick={() => setIsCitySelectionOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              Selecionar cidade
            </Button>
          </AlertDescription>
        </Alert>

        <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)_minmax(0,0.95fr)]">
            <CardContent className="grid gap-4 p-5 lg:p-6">
              <span className="flex size-18 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-20">
                <LockIcon className="size-9" />
              </span>
              <div className="grid gap-3">
                <h1 className="font-heading text-3xl font-semibold tracking-normal text-foreground">
                  {isReceiptRoute
                    ? 'Entre para enviar sua nota fiscal'
                    : 'Entre para salvar suas listas'}
                </h1>
                <p className="max-w-xl text-base text-muted-foreground">
                  {description}
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    icon: ListChecksIcon,
                    title: isReceiptRoute
                      ? 'Acompanhe suas notas'
                      : 'Salve e organize suas listas',
                    copy: isReceiptRoute
                      ? 'Veja status, revisao e liberacao em tempo real.'
                      : 'Acesse suas listas quando quiser.',
                  },
                  {
                    icon: SmartphoneIcon,
                    title: 'Continue no celular',
                    copy: 'Suas listas e preferencias ficam sincronizadas no app.',
                  },
                  {
                    icon: MapPinIcon,
                    title: 'Compare preços por loja',
                    copy: 'Receba sugestoes das melhores lojas perto de voce.',
                  },
                ].map((item) => (
                  <div className="flex gap-3" key={item.title}>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="size-5" />
                    </span>
                    <div className="grid gap-1">
                      <div className="font-medium text-primary">
                        {item.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.copy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Alert className="border-primary/25 bg-primary/10">
                <InfoIcon className="size-4" />
                <AlertTitle>Dica</AlertTitle>
                <AlertDescription>
                  Sem uma conta, voce pode ver ofertas da cidade, mas nao
                  consegue salvar suas listas.
                </AlertDescription>
              </Alert>
            </CardContent>

              <CardContent className="grid content-center gap-3 border-y border-border/70 p-5 lg:border-x lg:border-y-0 lg:p-6">
              <div className="grid gap-2">
                <StatusBadge
                  icon={ShieldCheckIcon}
                  label="Acesso necessário"
                  tone="neutral"
                />
                <p className="text-sm text-muted-foreground">
                  Esta area e exclusiva para usuarios cadastrados. Escolha uma
                  opcao para continuar.
                </p>
              </div>
              <Button asChild className="w-full justify-between">
                <Link to="/entrar">
                  Entrar agora
                  <ChevronRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between" variant="outline">
                <Link to="/criar-conta">
                  Criar conta
                  <ChevronRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Separator className="flex-1" />
                ou
                <Separator className="flex-1" />
              </div>
              <Button asChild className="w-full justify-center gap-2" variant="outline">
                <Link to="/ofertas">
                  <MapPinIcon data-icon="inline-start" />
                  Ver ofertas da cidade
                </Link>
              </Button>
              <Button
                className="w-full justify-center gap-2"
                onClick={() => setIsCitySelectionOpen(true)}
                type="button"
                variant="outline"
              >
                <MapPinIcon data-icon="inline-start" />
                Selecionar cidade
              </Button>
              <div className="mt-6 grid gap-1 text-sm">
                <div className="flex items-center gap-2 font-medium text-primary">
                  <InfoIcon className="size-4" />
                  Saiba como funciona
                </div>
                <p className="text-muted-foreground">
                  Entenda como salvar listas e otimizar suas compras com o
                  Pricely.
                </p>
                <Button asChild className="w-fit px-0" size="sm" variant="link">
                  <Link to="/">
                    Saiba mais
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </CardContent>

              <CardContent className="grid gap-3 p-5 lg:p-6">
              <div>
                <h2 className="text-xl font-semibold">Depois que voce entrar</h2>
                <p className="text-sm text-muted-foreground">
                  Voce podera ver e gerenciar:
                </p>
              </div>
              {[
                {
                  icon: ListChecksIcon,
                  title: 'Minhas listas',
                  status: null,
                },
                {
                  icon: ReceiptTextIcon,
                  title: 'Notas fiscais',
                  status: 'Aguardando revisao',
                },
                {
                  icon: TagsIcon,
                  title: 'Ofertas personalizadas',
                  status: null,
                },
              ].map((preview) => (
                <div
                  className="grid gap-3 rounded-lg border border-border/70 bg-background/80 p-4 shadow-sm"
                  key={preview.title}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <preview.icon className="size-4" />
                    </span>
                    <div className="font-medium">{preview.title}</div>
                  </div>
                  <div className="grid gap-2">
                    <div className="h-3 w-28 rounded-full bg-muted" />
                    <div className="h-3 w-40 rounded-full bg-muted" />
                    <div className="h-3 w-24 rounded-full bg-muted" />
                  </div>
                  {preview.status ? (
                    <StatusBadge label={preview.status} tone="savings" />
                  ) : null}
                </div>
              ))}
              <Alert className="border-[var(--ds-info-border)] bg-[var(--ds-info-soft)]">
                <ShieldCheckIcon className="size-4" />
                <AlertTitle>Seus dados estao seguros</AlertTitle>
                <AlertDescription>
                  Usamos tecnologia para proteger suas informacoes e sua
                  privacidade.
                </AlertDescription>
              </Alert>
            </CardContent>
          </div>
        </Card>

        <Alert className="justify-center border-primary/25 bg-primary/10 text-center">
          <AlertDescription className="font-medium text-primary">
            Milhoes de brasileiros ja usam o Pricely para economizar tempo e
            dinheiro. Junte-se a eles!
          </AlertDescription>
        </Alert>
        <CitySelectionDialog
          cityId={cityId}
          cities={cities}
          onOpenChange={setIsCitySelectionOpen}
          onSelectCity={setCityId}
          open={isCitySelectionOpen}
        />
      </section>
    );
  }

  return <>{children}</>;
}

function AuthCard({
  initialMode,
  onSignIn,
  onSignUp,
}: {
  initialMode: 'sign-in' | 'sign-up';
  onSignIn: (values: { email: string; password: string }) => Promise<void>;
  onSignUp: (values: {
    displayName: string;
    email: string;
    password: string;
  }) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = initialMode === 'sign-up';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isSignUp) {
        await onSignUp({
          displayName: displayName.trim() || 'Cliente Pricely',
          email,
          password,
        });
      } else {
        await onSignIn({ email, password });
      }
      navigate('/listas');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível concluir o acesso.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
        <div className="grid lg:grid-cols-[0.82fr_1fr]">
          <CardContent className="grid content-start gap-6 border-b border-border/70 bg-[radial-gradient(circle_at_25%_10%,rgba(15,118,110,0.08),transparent_38%)] p-8 lg:border-b-0 lg:border-r lg:p-12">
            <PricelyBrandMark className="justify-center lg:justify-start" to="/" />
            <div className="grid gap-3">
              <h1 className="font-heading text-4xl font-semibold tracking-normal text-foreground">
                Sua conta para comprar melhor
              </h1>
              <p className="max-w-md text-base text-muted-foreground">
                Crie sua conta e aproveite tudo que o Pricely oferece para
                economizar tempo e dinheiro nas suas compras.
              </p>
            </div>
            <div className="grid gap-5">
              {[
                {
                  icon: ListChecksIcon,
                  title: 'Salvar listas',
                  copy: 'Crie listas, otimize e encontre os melhores preços sempre que quiser.',
                },
                {
                  icon: SmartphoneIcon,
                  title: 'Continuar no celular',
                  copy: 'Acesse suas listas e recibos pelo app, onde estiver.',
                },
                {
                  icon: ReceiptTextIcon,
                  title: 'Receber status de nota fiscal',
                  copy: 'Acompanhe a analise da sua nota fiscal em tempo real.',
                },
                {
                  icon: MapPinIcon,
                  title: 'Preservar cidade e localização',
                  copy: 'Mantenha suas preferencias para resultados mais precisos.',
                },
              ].map((benefit) => (
                <div className="flex gap-4" key={benefit.title}>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <benefit.icon className="size-5" />
                  </span>
                  <div className="grid gap-1">
                    <div className="font-medium text-primary">
                      {benefit.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {benefit.copy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto flex gap-3 text-sm text-muted-foreground">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Seus dados estao seguros. Usamos tecnologia para proteger suas
                informacoes e sua privacidade.
              </span>
            </div>
          </CardContent>

          <CardContent className="grid content-start gap-7 p-8 lg:p-12">
            <Tabs
              onValueChange={(value) =>
                navigate(value === 'sign-up' ? '/criar-conta' : '/entrar')
              }
              value={initialMode}
            >
              <TabsList className="h-12 w-full rounded-none bg-transparent p-0" variant="line">
                <TabsTrigger className="text-base" value="sign-in">
                  Entrar
                </TabsTrigger>
                <TabsTrigger className="text-base" value="sign-up">
                  Criar conta
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form className="grid gap-5" onSubmit={handleSubmit}>
              <FieldGroup>
                {isSignUp ? (
                  <Field>
                    <FieldLabel htmlFor="displayName">Nome</FieldLabel>
                    <Input
                      autoComplete="name"
                      id="displayName"
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Como você quer aparecer no Pricely"
                      required
                      value={displayName}
                    />
                  </Field>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input
                    autoComplete="email"
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    required
                    type="email"
                    value={email}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <div className="relative">
                    <Input
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      className="pr-11"
                      id="password"
                      minLength={6}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Digite sua senha"
                      required
                      type={isPasswordVisible ? 'text' : 'password'}
                      value={password}
                    />
                    <Button
                      aria-label={
                        isPasswordVisible
                          ? 'Ocultar palavra secreta'
                          : 'Mostrar palavra secreta'
                      }
                      className="absolute right-1 top-1 h-8 w-8"
                      onClick={() => setIsPasswordVisible((current) => !current)}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <EyeIcon className="size-4" />
                    </Button>
                  </div>
                </Field>
              </FieldGroup>

              {!isSignUp ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input
                      checked={rememberMe}
                      className="size-4 rounded border-border"
                      onChange={(event) => setRememberMe(event.target.checked)}
                      type="checkbox"
                    />
                    Lembrar de mim
                  </label>
                  <Button className="px-0" size="sm" type="button" variant="link">
                    Esqueci minha senha
                  </Button>
                </div>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Falha no acesso</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button className="h-12" disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? 'Enviando...'
                  : isSignUp
                    ? 'Criar conta'
                    : 'Entrar'}
              </Button>
            </form>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Separator className="flex-1" />
              ou
              <Separator className="flex-1" />
            </div>

            <Button className="h-12 gap-3" type="button" variant="outline">
              <span className="font-semibold text-blue-600">G</span>
              Continuar com Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                to={isSignUp ? '/entrar' : '/criar-conta'}
              >
                {isSignUp ? 'Entrar' : 'Criar conta'}
              </Link>
            </p>

            <Separator />

            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, voce concorda com nossos{' '}
              <Link className="text-primary" to="/">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link className="text-primary" to="/">
                Politica de Privacidade
              </Link>
              .
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

export function LandingPage() {
  const { cityId, cities, currentUser, lists, setCityId } = usePricely();
  const city = cityId
    ? (cities.find((entry) => entry.id === cityId) ?? getCityById(cityId))
    : null;
  const activeList =
    lists.find((list) => list.latestOptimizationStatus !== 'completed') ??
    lists[0];
  const completedItemCount =
    activeList?.items.filter((item) => item.status !== 'missing').length ?? 0;
  const activeListCompletion =
    activeList && activeList.items.length > 0
      ? Math.round((completedItemCount / activeList.items.length) * 100)
      : 0;
  const [impact, setImpact] = useState<PublicImpactResponse | null>(null);
  const [featuredOffers, setFeaturedOffers] = useState<
    Array<{
      id: string;
      productName: string;
      storeName: string;
      neighborhood: string;
      imageUrl: string;
      freshness: FreshnessLevel;
      confidence: ConfidenceLevel;
      price: number;
      basePrice?: number;
      promotionalPrice?: number;
      savingsVsRegionalAverage?: number;
    }>
  >([]);
  const [isReceiptInfoOpen, setIsReceiptInfoOpen] = useState(false);
  const [isLocationHelpOpen, setIsLocationHelpOpen] = useState(false);
  const [isCitySelectionOpen, setIsCitySelectionOpen] = useState(false);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      if (!cityId) {
        setFeaturedOffers([]);
        return;
      }

      try {
        const response = await fetchRegionOffers(cityId);
        if (disposed) {
          return;
        }

        setFeaturedOffers(
          response.offers.slice(0, 3).map((offer) => ({
            id: offer.id,
            productName: offer.productName,
            storeName: offer.storeName,
            neighborhood: offer.neighborhood,
            imageUrl: resolveProductImage(offer.imageUrl),
            freshness: 'fresh',
            confidence:
              offer.confidenceLevel === 'high'
                ? 'alta'
                : offer.confidenceLevel === 'medium'
                  ? 'media'
                  : 'baixa',
            price: offer.priceAmount,
            basePrice: offer.basePriceAmount,
            promotionalPrice: offer.promotionalPriceAmount,
            savingsVsRegionalAverage: offer.savingsVsRegionalAverage,
          })),
        );
      } catch {
        setFeaturedOffers([]);
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, [cityId]);

  useEffect(() => {
    let disposed = false;

    const loadImpact = async () => {
      try {
        const response = await fetchPublicImpact();
        if (!disposed) {
          setImpact(response);
        }
      } catch {
        if (!disposed) {
          setImpact(null);
        }
      }
    };

    void loadImpact();

    return () => {
      disposed = true;
    };
  }, []);

  const estimatedSavings = impact?.totalEstimatedSavings ?? 0;
  const optimizedListsCount = impact?.optimizedListsCount ?? 0;
  const hasAccount = Boolean(currentUser);
  const primaryOffer = featuredOffers[0];
  const secondaryOffers = featuredOffers.slice(0, 3);
  const coveragePercent = city ? 100 : 0;
  const activeStoreLabel = city
    ? `${city.activeStoreCount} lojas ativas`
    : 'Cidade pendente';
  const lastReceiptTotal = hasAccount && activeList
    ? Math.max(42.9, activeList.items.length * 20.45)
    : 0;

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
      <section className="grid min-w-0 gap-5">
        <div className="grid gap-3 rounded-lg border border-[var(--ds-location-border)] bg-[var(--ds-location-soft)]/45 p-5 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-[var(--ds-location-border)] bg-[var(--ds-location-soft)] text-[var(--ds-location)]">
            <ClipboardListIcon className="size-7" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">
              Próximo melhor passo
            </div>
            <h1 className="mt-1 font-heading text-xl font-semibold sm:text-2xl">
              {activeList
                ? 'Continue sua lista e otimize preços'
                : city
                  ? 'Crie uma lista para comparar preços'
                  : 'Escolha uma cidade para começar'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeList ? (
                <>
                  Sua lista está pronta para otimização. Última economia
                  estimada:{' '}
                  <MaskedMoney value={formatCurrency(estimatedSavings)} />.
                </>
              ) : city ? (
                'Monte uma lista com produtos comparáveis antes de ir ao mercado.'
              ) : (
                'A cidade define ofertas, lojas e evidências usadas na comparação.'
              )}
            </p>
          </div>
          <div className="grid gap-2 sm:justify-items-end">
            <Button asChild className="min-w-44">
              <Link
                to={
                  activeList ? `/otimizacao/${activeList.id}` : '/listas/nova'
                }
              >
                {activeList ? 'Otimizar agora' : 'Criar lista'}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to={activeList ? `/listas/${activeList.id}` : '/ofertas'}>
                {activeList ? 'Ver minha lista' : 'Ver ofertas'}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/92 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[var(--ds-location-soft)] text-[var(--ds-location)]">
                    <ListIcon className="size-5" />
                  </span>
                  <div>
                    <CardTitle>Sua lista ativa</CardTitle>
                    <CardDescription>
                      {activeList
                        ? `${activeList.items.length} itens`
                        : 'Nenhuma lista criada ainda'}
                    </CardDescription>
                  </div>
                </div>
                <StatusBadge tone={activeList ? 'savings' : 'neutral'}>
                  {activeList ? 'Em andamento' : 'Vazia'}
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div>
                <div className="font-heading text-xl font-semibold">
                  {activeList?.name ?? 'Comece uma lista'}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {activeList
                    ? `${completedItemCount}/${activeList.items.length} itens adicionados`
                    : 'Adicione produtos para liberar a otimização.'}
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-[var(--ds-primary)]"
                  style={{ width: `${Math.max(8, activeListCompletion)}%` }}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild variant="secondary">
                  <Link
                    to={
                      activeList ? `/listas/${activeList.id}` : '/listas/nova'
                    }
                  >
                    Ver lista
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link
                    to={
                      activeList ? `/listas/${activeList.id}` : '/listas/nova'
                    }
                  >
                    Editar itens
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 bg-card/92 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                    <MapPinIcon className="size-5" />
                  </span>
                  <div>
                    <CardTitle>Cobertura local</CardTitle>
                    <CardDescription>
                      {city ? `${city.name}, ${city.stateCode}` : 'Sem cidade'}
                    </CardDescription>
                  </div>
                </div>
                <StatusBadge tone="location">Raio: 5 km</StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1.1fr_0.8fr]">
              <div className="relative min-h-40 overflow-hidden rounded-lg border border-border/70 bg-muted/50">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-400/80" />
                <div className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--ds-location)]/70" />
                <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600" />
                {[StoreIcon, ShoppingCartIcon, StoreIcon, ShoppingCartIcon].map(
                  (Icon, index) => (
                    <span
                      className="absolute flex size-7 items-center justify-center rounded-full bg-[var(--ds-location)] text-primary-foreground shadow-sm"
                      key={index}
                      style={{
                        left: `${30 + index * 14}%`,
                        top: `${32 + (index % 2) * 26}%`,
                      }}
                    >
                      <Icon className="size-3.5" />
                    </span>
                  ),
                )}
              </div>
              <div className="grid content-center gap-3">
                <div>
                  <div className="font-heading text-2xl font-semibold">
                    {activeStoreLabel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    dentro do raio
                  </div>
                </div>
                <div>
                  <div className="font-heading text-2xl font-semibold text-[var(--ds-location)]">
                    {coveragePercent}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cobertura da área
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-blue-600" />
                  Atualizado há 15 min
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/70">
              <Button asChild className="w-full" variant="ghost">
                <Link to="/cidades">Ver todas as lojas</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">
              Ofertas recomendadas para você
            </h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/ofertas">Ver todas as ofertas</Link>
            </Button>
          </div>
          {secondaryOffers.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {secondaryOffers.map((offer) => (
                <Card
                  className="overflow-hidden border-border/70 bg-card/92 shadow-sm"
                  key={offer.id}
                >
                  <CardContent className="grid gap-3 p-4">
                    <div className="flex gap-3">
                      <img
                        alt={offer.productName}
                        className="size-20 rounded-md border border-border/60 object-cover"
                        src={offer.imageUrl}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {offer.productName}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {offer.storeName} · {offer.neighborhood}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="font-heading text-2xl font-semibold text-[var(--ds-location)]">
                          <MaskedMoney value={formatCurrency(offer.price)} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Preço otimizado
                        </div>
                      </div>
                      <div className="rounded-md bg-[var(--ds-savings-soft)] px-3 py-2 text-right text-sm text-[var(--ds-savings)]">
                        <div>Economize</div>
                        <div className="font-semibold">
                          <MaskedMoney
                            value={formatCurrency(
                              offer.savingsVsRegionalAverage ?? 0,
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {confidenceBadge(offer.confidence)}
                      {freshnessBadge(offer.freshness)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <ActionPlaceholder
              icon={<MapPinIcon className="size-5" />}
              title="Escolha uma cidade no header para ver ofertas reais"
              description="A vitrine depende da cidade selecionada no header. Depois mostramos produto, loja, preço observado e confiança da informação."
              primaryAction={
                <button
                  onClick={() => setIsCitySelectionOpen(true)}
                  type="button"
                >
                  Selecionar cidade
                </button>
              }
              secondaryAction={<Link to="/cidades">Ver cidades e lojas</Link>}
            />
          )}
        </section>

        <section className="grid gap-3">
          <h2 className="font-heading text-lg font-semibold">
            Outros estados importantes
          </h2>
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {[
              {
                icon: MapPinIcon,
                title: 'Sem cidade selecionada',
                text: 'Escolha a cidade no header para carregar ofertas, lojas e evidências da região.',
              },
              {
                icon: LockIcon,
                title: 'Permissão de localização negada',
                text: 'Ative a permissão no navegador ou use CEP quando quiser calcular lojas próximas.',
                action: 'Como ativar',
                onAction: () => setIsLocationHelpOpen(true),
              },
              {
                icon: StoreIcon,
                title: 'Nenhuma loja no raio',
                text: 'Não encontramos lojas ativas a 5 km de você',
                action: 'Ver cidades e lojas',
                to: '/cidades',
              },
              {
                icon: Clock3Icon,
                title: 'Carregando dados',
                text: 'Buscando as melhores ofertas',
                action: '',
              },
            ].map((state) => (
              <ActionPlaceholder
                className="min-w-0 bg-card/70"
                key={state.title}
                icon={<state.icon className="size-5" />}
                title={state.title}
                description={state.text}
                primaryAction={
                  state.action ? (
                    state.onAction ? (
                      <button onClick={state.onAction} type="button">
                        {state.action}
                      </button>
                    ) : (
                      <Link to={state.to ?? '/cidades'}>{state.action}</Link>
                    )
                  ) : undefined
                }
                secondaryAction={
                  state.title === 'Carregando dados' ? (
                    <Link to="/ofertas">Ver ofertas públicas</Link>
                  ) : undefined
                }
              >
                {!state.action ? (
                  <div className="mt-4 grid gap-2">
                    <div className="h-2 rounded-full bg-muted" />
                    <div className="h-2 w-2/3 rounded-full bg-muted" />
                  </div>
                ) : null}
              </ActionPlaceholder>
            ))}
          </div>
        </section>
      </section>

      <aside className="grid content-start gap-4">
        <Card className="border-border/70 bg-card/92 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200">
                  <ReceiptTextIcon className="size-5" />
                </span>
                <div>
                  <CardTitle>Nota fiscal</CardTitle>
                  <CardDescription>
                    {hasAccount
                      ? 'Aguardando liberação manual'
                      : 'Envie sua primeira nota fiscal'}
                  </CardDescription>
                </div>
              </div>
              <StatusBadge tone={hasAccount ? 'warning' : 'neutral'}>
                {hasAccount ? 'Aguardando' : 'Primeira nota'}
              </StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <div className="font-medium">
                {hasAccount
                  ? 'Enviada para validação'
                  : 'Acompanhe a validação depois do envio'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {hasAccount ? (
                  <>
                    Total:{' '}
                    <MaskedMoney value={formatCurrency(lastReceiptTotal)} />
                  </>
                ) : (
                  'Entre ou crie conta para salvar a nota e receber status.'
                )}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] p-3 text-sm">
              {hasAccount
                ? 'Nossa equipe vai revisar sua nota fiscal. Você será avisado quando for liberada.'
                : 'Envie a nota para validar preços reais, melhorar a confiança das ofertas e liberar histórico de compra na sua conta.'}
            </div>
            <div className="grid gap-2">
              <Button asChild variant="outline">
                <Link to={hasAccount ? '/notas' : '/entrar'}>
                  {hasAccount ? 'Ver detalhes' : 'Enviar primeira nota fiscal'}
                </Link>
              </Button>
              <Button
                onClick={() => setIsReceiptInfoOpen(true)}
                type="button"
                variant="ghost"
              >
                Saiba como funciona
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/92 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Resumo de economia</CardTitle>
              <InfoTooltip label="Valores monetários podem ser ocultados pelo botão de privacidade no header." />
            </div>
            <CardDescription>Esta semana</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              {hasAccount ? (
                <div className="font-heading text-4xl font-semibold text-[var(--ds-savings)]">
                  <MaskedMoney value={formatCurrency(estimatedSavings)} />
                </div>
              ) : (
                <div className="font-heading text-2xl font-semibold text-foreground">
                  Entre para ver sua economia
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {hasAccount
                  ? 'Economia estimada'
                  : 'Seu resumo aparece depois da primeira lista otimizada.'}
              </div>
            </div>
            <div className="divide-y divide-border/70 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Itens otimizados</span>
                <span>
                  {hasAccount
                    ? `${completedItemCount} de ${activeList?.items.length ?? 0}`
                    : 'Aguardando lista'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Melhor loja</span>
                <span>
                  {hasAccount
                    ? (primaryOffer?.storeName ?? 'Aguardando lista')
                    : 'Aguardando cidade'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  Preços verificados
                </span>
                <span>{hasAccount && city ? '100%' : 'Aguardando lista'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Listas otimizadas</span>
                <span>
                  {hasAccount ? optimizedListsCount : 'Aguardando lista'}
                </span>
              </div>
            </div>
            <Button asChild variant="ghost">
              <Link to={currentUser ? '/listas' : '/entrar'}>
                {hasAccount ? 'Ver detalhes da economia' : 'Saiba como funciona'}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="hidden items-center justify-between rounded-lg border border-border/70 bg-card/80 px-4 py-3 text-sm xl:flex">
          <div className="flex items-center gap-2">
            <BellIcon className="size-4" />
            <span>3 alertas de preço</span>
          </div>
          <StatusBadge tone="savings">Ativo</StatusBadge>
        </div>
      </aside>

      <Dialog
        onOpenChange={setIsReceiptInfoOpen}
        open={isReceiptInfoOpen}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto bg-background sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Como a nota fiscal melhora sua compra</DialogTitle>
            <DialogDescription>
              A nota fiscal transforma uma compra real em evidência útil para
              você e para a qualidade das ofertas da plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 rounded-xl border border-[var(--ds-info-border)] bg-[var(--ds-info-soft)] p-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="relative flex size-24 items-center justify-center rounded-xl border border-[var(--ds-info-border)] bg-background">
              <img
                alt=""
                className="size-14 scale-[2.05] object-contain"
                src={pricelyIcon}
              />
              <ReceiptTextIcon className="absolute -right-2 -top-2 size-9 rounded-full border border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] p-2 text-orange-700 dark:text-orange-200" />
              <BadgeCheckIcon className="absolute -bottom-2 -left-2 size-9 rounded-full border border-[var(--ds-savings-border)] bg-[var(--ds-savings-soft)] p-2 text-[var(--ds-savings)]" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                Roadmap da nota fiscal
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Enviar a nota cria evidência, valida preços e melhora as
                próximas recomendações de compra.
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-xl border border-border/70 bg-card p-3 sm:grid-cols-4">
            {[
              { label: 'Enviar', detail: 'nota da compra' },
              { label: 'Validar', detail: 'preços reais' },
              { label: 'Liberar', detail: 'histórico' },
              { label: 'Melhorar', detail: 'ofertas' },
            ].map((step, index) => (
              <div className="relative grid gap-1" key={step.label}>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  {index < 3 ? (
                    <span className="hidden h-px flex-1 bg-border sm:block" />
                  ) : null}
                </div>
                <div className="text-sm font-medium">{step.label}</div>
                <div className="text-xs text-muted-foreground">
                  {step.detail}
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            {[
              {
                title: '1. Envie a nota depois da compra',
                copy: 'A plataforma registra loja, data, produtos e valores sem depender de preenchimento manual.',
              },
              {
                title: '2. A validação confirma os preços reais',
                copy: 'O envio passa por revisão antes de liberar histórico, status e dados derivados na sua conta.',
              },
              {
                title: '3. Você ganha histórico e comparações melhores',
                copy: 'Com notas validadas, fica mais fácil acompanhar gastos, reutilizar listas e comparar ofertas com evidência real.',
              },
              {
                title: '4. A comunidade recebe ofertas mais confiáveis',
                copy: 'Os preços observados ajudam a indicar confiança, frescor e variação por estabelecimento.',
              },
            ].map((step) => (
              <div
                className="rounded-lg border border-border/70 bg-card p-3"
                key={step.title}
              >
                <div className="font-medium">{step.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--ds-info-border)] bg-[var(--ds-info-soft)] p-3 text-sm text-muted-foreground">
            Valores monetários podem ser ocultados pelo botão de privacidade no
            header e no sidebar.
          </div>
          <DialogFooter>
            <Button asChild>
              <Link to={hasAccount ? '/notas' : '/entrar'}>
                {hasAccount ? 'Abrir notas fiscais' : 'Entrar para enviar'}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={setIsLocationHelpOpen}
        open={isLocationHelpOpen}
      >
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Permissão de localização</DialogTitle>
            <DialogDescription>
              A cidade no header mostra ofertas da região. A permissão de
              localização só é necessária para calcular lojas realmente
              próximas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <div className="rounded-lg border border-border/70 bg-card p-3">
              <div className="font-medium">No navegador</div>
              <p className="mt-1 text-muted-foreground">
                Abra as permissões do site, libere localização e tente usar o
                botão de localização novamente.
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-3">
              <div className="font-medium">Sem localização precisa</div>
              <p className="mt-1 text-muted-foreground">
                Você ainda pode usar a cidade selecionada; o Pricely só não
                promete distância até lojas específicas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLocationHelpOpen(false)} type="button">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CitySelectionDialog
        cityId={cityId}
        cities={cities}
        onOpenChange={setIsCitySelectionOpen}
        onSelectCity={setCityId}
        open={isCitySelectionOpen}
      />
    </div>
  );
}

export function OffersPage() {
  const { cityId, cities, setCityId } = usePricely();
  const [searchParams, setSearchParams] = useSearchParams();
  const city = cityId
    ? (cities.find((entry) => entry.id === cityId) ?? getCityById(cityId))
    : null;
  const [offerGroups, setOfferGroups] = useState<
    NonNullable<RegionOffersApiResponse['groupedOffers']>
  >([]);
  const [offerPagination, setOfferPagination] = useState<
    NonNullable<RegionOffersApiResponse['pagination']>
  >({
    page: 1,
    pageSize: 24,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [availableStores, setAvailableStores] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isCitySelectionOpen, setIsCitySelectionOpen] = useState(false);
  const searchQuery = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(searchQuery);
  const storeFilter = searchParams.get('store') ?? 'all';
  const categoryFilter = searchParams.get('category') ?? 'all';
  const confidenceFilter = searchParams.get('confidence') ?? 'all';
  const offerSort = searchParams.get('sort') ?? 'name';
  const requestedPage = Math.max(
    1,
    Number.parseInt(searchParams.get('page') ?? '1', 10) || 1,
  );

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchInput === searchQuery) {
      return;
    }

    const timeout = globalThis.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        next.set('q', searchInput.trim());
      } else {
        next.delete('q');
      }
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 300);

    return () => globalThis.clearTimeout(timeout);
  }, [searchInput, searchParams, searchQuery, setSearchParams]);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      if (!cityId) {
        setOfferGroups([]);
        setOfferPagination((current) => ({
          ...current,
          page: 1,
          totalItems: 0,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        }));
        return;
      }

      try {
        const response = await fetchRegionOffers(cityId, {
          q: searchQuery,
          store: storeFilter,
          category: categoryFilter,
          confidence: confidenceFilter,
          sort: offerSort,
          page: requestedPage,
          pageSize: 24,
        });
        if (!disposed) {
          setOfferGroups(
            response.groupedOffers ?? groupFlatRegionalOffers(response.offers),
          );
          setOfferPagination(
            response.pagination ?? {
              page: 1,
              pageSize: response.groupedOffers?.length ?? response.offers.length,
              totalItems:
                response.groupedOffers?.length ?? response.offers.length,
              totalPages: 1,
              hasPreviousPage: false,
              hasNextPage: false,
            },
          );
          setAvailableStores(response.filters?.stores ?? []);
          setAvailableCategories(response.filters?.categories ?? []);

          if (
            response.pagination &&
            response.pagination.page !== requestedPage
          ) {
            const next = new URLSearchParams(searchParams);
            if (response.pagination.page === 1) {
              next.delete('page');
            } else {
              next.set('page', String(response.pagination.page));
            }
            setSearchParams(next, { replace: true });
          }
        }
      } catch {
        if (!disposed) {
          setOfferGroups([]);
        }
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, [
    categoryFilter,
    cityId,
    confidenceFilter,
    offerSort,
    requestedPage,
    searchParams,
    searchQuery,
    setSearchParams,
    storeFilter,
  ]);

  const storeOptions = Array.from(
    new Set([
      ...availableStores,
      ...(storeFilter !== 'all' ? [storeFilter] : []),
      ...offerGroups.flatMap((group) =>
        getComparableOffers(group).map((offer) => offer.storeName),
      ),
    ]),
  ).sort((left, right) => left.localeCompare(right));

  const categoryOptions = Array.from(
    new Set(
      [
        ...availableCategories,
        ...(categoryFilter !== 'all' ? [categoryFilter] : []),
        ...offerGroups.map(
          (group) => group.category ?? group.bestOffer.category,
        ),
      ].filter((category): category is string => Boolean(category)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const hasActiveOfferFilters =
    searchQuery.trim() !== '' ||
    storeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    confidenceFilter !== 'all';

  const visibleOfferGroups = offerGroups;

  const updateOfferSearchParams = (
    key: 'q' | 'store' | 'category' | 'confidence' | 'sort' | 'page',
    value: string,
    resetPage = true,
  ) => {
    const next = new URLSearchParams(searchParams);

    if (
      !value ||
      value === 'all' ||
      (key === 'sort' && value === 'name') ||
      (key === 'page' && value === '1')
    ) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    if (resetPage && key !== 'page') {
      next.delete('page');
    }

    setSearchParams(next);
  };

  const clearOfferFilters = () => {
    setSearchInput('');
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('store');
    next.delete('category');
    next.delete('confidence');
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Ofertas por cidade
        </h1>
        <p className="text-muted-foreground">
          {city
            ? `${city.name}. Ofertas públicas mostram loja, frescor, confiança e detalhe completo do item.`
            : 'Selecione uma cidade para carregar as ofertas públicas desta região.'}
        </p>
      </div>

      {!cityId ? (
        <ActionPlaceholder
          icon={<MapPinIcon className="size-5" />}
          title="Escolha uma cidade no header primeiro"
          description="A cidade selecionada no header define quais lojas e preços entram na vitrine pública. Você também pode consultar as cidades e lojas suportadas."
          primaryAction={
            <button onClick={() => setIsCitySelectionOpen(true)} type="button">
              Selecionar cidade
            </button>
          }
          secondaryAction={<Link to="/cidades">Ver cidades e lojas</Link>}
        />
      ) : null}

      {cityId ? (
        <div className="grid gap-4 rounded-lg border border-border/70 bg-card/90 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 font-medium">
                <SlidersHorizontalIcon className="size-4" />
                Buscar e filtrar ofertas
              </div>
              <div className="text-sm text-muted-foreground">
                {offerPagination.totalItems === 0
                  ? 'Nenhum produto encontrado.'
                  : `${visibleOfferGroups.length} produtos nesta página de ${offerPagination.totalItems} produtos encontrados.`}{' '}
                Cada produto aparece uma vez.
              </div>
            </div>
            {hasActiveOfferFilters ? (
              <Button onClick={clearOfferFilters} size="sm" variant="outline">
                Limpar filtros
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="grid gap-1 text-sm xl:col-span-2">
              <span className="font-medium">Pesquisar</span>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Nome, produto, mercado, bairro..."
                  value={searchInput}
                />
              </div>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Mercado</span>
              <Select
                onValueChange={(value) =>
                  updateOfferSearchParams('store', value)
                }
                value={storeFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os mercados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos os mercados</SelectItem>
                    {storeOptions.map((storeName) => (
                      <SelectItem key={storeName} value={storeName}>
                        {storeName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Categoria</span>
              <Select
                disabled={categoryOptions.length === 0}
                onValueChange={(value) =>
                  updateOfferSearchParams('category', value)
                }
                value={categoryFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      categoryOptions.length > 0
                        ? 'Todas as categorias'
                        : 'Aguardando categorias'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Confiança</span>
              <Select
                onValueChange={(value) =>
                  updateOfferSearchParams('confidence', value)
                }
                value={confidenceFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Ordenar por</span>
              <Select
                onValueChange={(value) =>
                  updateOfferSearchParams('sort', value, false)
                }
                value={offerSort}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="lowest-price">Menor preço</SelectItem>
                    <SelectItem value="highest-savings">
                      Maior economia
                    </SelectItem>
                    <SelectItem value="highest-confidence">
                      Maior confiança
                    </SelectItem>
                    <SelectItem value="most-recent">
                      Atualizado recentemente
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
      ) : null}

      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleOfferGroups.map((group) => (
          <Card
            key={group.id}
            className="flex h-full min-h-[360px] flex-col overflow-hidden"
          >
            <div className="h-28 shrink-0 overflow-hidden bg-muted">
              <img
                alt={group.variantName}
                className="h-full w-full object-cover"
                src={resolveProductImage(group.imageUrl)}
              />
            </div>
            <CardHeader className="shrink-0 p-4 pb-2">
              <CardTitle className="line-clamp-2 min-h-10 text-base">
                {group.variantName}
              </CardTitle>
              <CardDescription className="line-clamp-1 text-xs">
                {formatVariantWithPackage(
                  group.productName,
                  group.packageLabel,
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 p-4 pt-0">
              <div className="flex flex-wrap gap-2">
                {confidenceBadge(
                  group.bestOffer.confidenceLevel === 'high'
                    ? 'alta'
                    : group.bestOffer.confidenceLevel === 'medium'
                      ? 'media'
                    : 'baixa',
                )}
                <StatusBadge tone="location" className="text-[0.7rem]">
                  {group.establishmentCount}{' '}
                  {group.establishmentCount === 1
                    ? 'mercado'
                    : 'mercados'}
                </StatusBadge>
              </div>
              <PriceDisplay
                basePriceAmount={group.bestOffer.basePriceAmount}
                priceAmount={group.bestOffer.priceAmount}
                promotionalPriceAmount={group.bestOffer.promotionalPriceAmount}
              />
              <div className="line-clamp-2 text-sm text-muted-foreground">
                Menor preço em {group.bestOffer.storeName} ·{' '}
                {group.bestOffer.neighborhood}
              </div>
              {(group.savingsVsSecondCheapest ?? 0) > 0 &&
              group.secondCheapestPriceAmount ? (
                <div className="line-clamp-2 text-sm font-medium text-[var(--ds-savings)]">
                  <MaskedMoney
                    value={formatCurrency(group.savingsVsSecondCheapest ?? 0)}
                  />{' '}
                  abaixo do próximo menor preço.
                </div>
              ) : group.establishmentCount > 1 ? (
                <div className="text-sm text-muted-foreground">
                  Menor preço empatado.
                </div>
              ) : null}
              {group.averagePriceAmount > 0 ? (
                <div className="text-xs text-muted-foreground">
                  Média na cidade:{' '}
                  <MaskedMoney value={formatCurrency(group.averagePriceAmount)} />
                  {group.averagePriceAmount > group.cheapestPriceAmount ? (
                    <> · acima do menor</>
                  ) : null}
                </div>
              ) : null}
              {group.bestOffer.sourceLabel ? (
                <div className="line-clamp-1 text-xs text-muted-foreground">
                  Origem: {group.bestOffer.sourceLabel} ·{' '}
                  {formatDateTime(group.bestOffer.observedAt)}
                </div>
              ) : null}
              {group.alternativeOffers.length > 0 ? (
                <details className="mt-auto rounded-lg border border-border/70 p-2 text-xs">
                  <summary className="cursor-pointer font-medium">
                    Outros mercados
                  </summary>
                  <div className="mt-3 grid gap-2">
                    {group.alternativeOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-muted-foreground">
                          {offer.storeName} · {offer.neighborhood}
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            <MaskedMoney
                              value={formatCurrency(offer.priceAmount)}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            +
                            <MaskedMoney
                              value={formatCurrency(
                                offer.priceAmount - group.cheapestPriceAmount,
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <div className="mt-auto min-h-8" />
              )}
            </CardContent>
            <CardFooter className="mt-auto shrink-0 justify-end border-t border-border/70 p-3">
              <Button asChild size="sm" variant="outline">
                <Link to={`/ofertas/${group.bestOffer.id}`}>
                  Detalhe
                  <ChevronRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {cityId && offerPagination.totalItems > 0 ? (
        <nav
          aria-label="Paginação de ofertas"
          className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/90 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="text-sm text-muted-foreground">
            Página {offerPagination.page} de {offerPagination.totalPages} ·{' '}
            {offerPagination.totalItems} produtos
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={!offerPagination.hasPreviousPage}
              onClick={() =>
                updateOfferSearchParams(
                  'page',
                  String(offerPagination.page - 1),
                  false,
                )
              }
              size="sm"
              type="button"
              variant="outline"
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Anterior
            </Button>
            <div className="hidden items-center gap-1 sm:flex">
              {getPaginationItems(
                offerPagination.page,
                offerPagination.totalPages,
              ).map((item, index) =>
                item === 'ellipsis' ? (
                  <span
                    aria-hidden="true"
                    className="flex size-8 items-center justify-center text-muted-foreground"
                    key={`ellipsis-${index}`}
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    aria-current={
                      item === offerPagination.page ? 'page' : undefined
                    }
                    aria-label={`Ir para página ${item}`}
                    className="size-8 p-0"
                    key={item}
                    onClick={() =>
                      updateOfferSearchParams('page', String(item), false)
                    }
                    size="sm"
                    type="button"
                    variant={
                      item === offerPagination.page ? 'default' : 'outline'
                    }
                  >
                    {item}
                  </Button>
                ),
              )}
            </div>
            <Button
              disabled={!offerPagination.hasNextPage}
              onClick={() =>
                updateOfferSearchParams(
                  'page',
                  String(offerPagination.page + 1),
                  false,
                )
              }
              size="sm"
              type="button"
              variant="outline"
            >
              Próxima
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </nav>
      ) : null}
      {cityId && visibleOfferGroups.length === 0 ? (
        <ActionPlaceholder
          icon={<MapPinIcon className="size-5" />}
          title={
            hasActiveOfferFilters
              ? 'Nenhuma oferta encontrada'
              : city?.status === 'pilot'
              ? 'Cidade em ativação'
              : 'Nenhuma oferta agrupada disponível'
          }
          description={
            hasActiveOfferFilters
              ? 'Revise busca, mercado, categoria ou confiança para ampliar o resultado.'
              : city?.status === 'pilot'
              ? 'Esta cidade ainda precisa de notas fiscais e validações para liberar ofertas confiáveis.'
              : 'Troque o filtro de estabelecimento ou consulte as cidades e lojas suportadas para comparar preços.'
          }
          primaryAction={
            hasActiveOfferFilters ? (
              <button onClick={clearOfferFilters} type="button">
                Limpar filtros
              </button>
            ) : (
              <Link to="/cidades">Ver cidades e lojas</Link>
            )
          }
          secondaryAction={<Link to="/notas">Enviar nota fiscal</Link>}
        />
      ) : null}
      <CitySelectionDialog
        cityId={cityId}
        cities={cities}
        onOpenChange={setIsCitySelectionOpen}
        onSelectCity={setCityId}
        open={isCitySelectionOpen}
      />
    </div>
  );
}

export function OfferDetailPage() {
  const { offerId } = useParams();
  const [offer, setOffer] = useState<OfferDetailApiResponse | null>(null);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      if (!offerId) {
        return;
      }

      try {
        const response = await fetchOfferDetail(offerId);
        if (!disposed) {
          setOffer(response);
        }
      } catch {
        if (!disposed) {
          setOffer(null);
        }
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, [offerId]);

  if (!offer) {
    return (
      <Alert variant="destructive">
        <ShieldAlertIcon />
        <AlertTitle>Oferta não encontrada</AlertTitle>
        <AlertDescription>O detalhe pedido não existe mais.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            alt={offer.product.name}
            className="h-full w-full object-cover"
            src={resolveProductImage(offer.product.imageUrl)}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{offer.product.name}</CardTitle>
            <CardDescription>
              {offer.activeOffer.storeName} · {offer.activeOffer.neighborhood}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {freshnessBadge('fresh')}
              {confidenceBadge(
                offer.activeOffer.confidenceLevel === 'high'
                  ? 'alta'
                  : offer.activeOffer.confidenceLevel === 'medium'
                    ? 'media'
                    : 'baixa',
              )}
            </div>
            <PriceDisplay
              basePriceAmount={offer.activeOffer.basePriceAmount}
              priceAmount={offer.activeOffer.priceAmount}
              promotionalPriceAmount={offer.activeOffer.promotionalPriceAmount}
              size="lg"
            />
            {offer.activeOffer.savingsVsComparison &&
            offer.activeOffer.savingsVsComparison > 0 ? (
              <p className="text-sm font-medium text-[var(--ds-savings)]">
                Economize{' '}
                <MaskedMoney
                  value={formatCurrency(
                    offer.activeOffer.savingsVsComparison,
                  )}
                />{' '}
                versus o segundo menor preco elegivel para esta variante.
              </p>
            ) : null}
            {offer.activeOffer.regionalAveragePriceAmount ? (
              <p className="text-sm text-muted-foreground">
                Média regional desta variante:{' '}
                <MaskedMoney
                  value={formatCurrency(
                    offer.activeOffer.regionalAveragePriceAmount,
                  )}
                />
                .
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Preço observado em {offer.region.name} com evidência rastreável.
            </p>
            <div className="rounded-lg border border-border/70 p-4 text-sm text-muted-foreground">
              Última atualização: {formatDateTime(offer.activeOffer.observedAt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preços do produto na cidade</CardTitle>
            <CardDescription>
              Compare estabelecimentos, horários e fonte antes de decidir.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {offer.alternativeOffers.map((entry) => (
              <PriceRow
                key={entry.id}
                title={entry.storeName}
                subtitle={entry.neighborhood}
                price={
                  <MaskedMoney
                    value={formatCurrency(
                      entry.promotionalPriceAmount ?? entry.priceAmount,
                    )}
                  />
                }
                comparison={
                  entry.basePriceAmount &&
                  entry.basePriceAmount > entry.priceAmount
                    ? (
                        <>
                          <MaskedMoney
                            value={formatCurrency(
                              entry.basePriceAmount - entry.priceAmount,
                            )}
                          />{' '}
                          abaixo do preco base
                        </>
                      )
                    : undefined
                }
                meta={
                  <>
                    <StatusBadge family="freshness" status="fresh">
                      {formatDateTime(entry.observedAt)}
                    </StatusBadge>
                    <StatusBadge tone="neutral">
                      {entry.packageLabel} · {entry.sourceLabel}
                    </StatusBadge>
                  </>
                }
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CitiesPage() {
  const { cities } = usePricely();
  const [requestForm, setRequestForm] = useState({
    cityName: '',
    stateCode: '',
    contactEmail: '',
    message: '',
  });
  const [requestStatus, setRequestStatus] = useState<
    'idle' | 'submitting' | 'submitted' | 'failed'
  >('idle');

  const handleCityRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestStatus('submitting');

    try {
      await requestCityInclusion({
        cityName: requestForm.cityName,
        stateCode: requestForm.stateCode,
        contactEmail: requestForm.contactEmail || undefined,
        message: requestForm.message || undefined,
      });
      setRequestStatus('submitted');
      setRequestForm({
        cityName: '',
        stateCode: '',
        contactEmail: '',
        message: '',
      });
    } catch {
      setRequestStatus('failed');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cidades suportadas
        </h1>
        <p className="text-muted-foreground">
          Mostramos somente cidades ativas ou em ativação, com contagem
          explícita de estabelecimentos ativos.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cities.map((city) => (
          <Card key={city.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    {city.name} · {city.stateCode}
                  </CardTitle>
                  <CardDescription>
                    {city.activeStoreCount > 0
                      ? `${city.activeStoreCount} estabelecimentos ativos`
                      : city.status === 'pilot'
                        ? 'Em ativação'
                        : 'Sem cobertura ativa'}
                  </CardDescription>
                </div>
                {cityStatusBadge(city)}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {city.stores.length > 0 ? (
                <div className="grid gap-2">
                  {city.stores.map((store) => (
                    <div
                      key={store.id ?? `${city.id}-${store.name}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {store.name}
                        </div>
                        <div className="text-muted-foreground">
                          {store.neighborhood ?? 'Bairro em validação'}
                        </div>
                      </div>
                      <StatusBadge
                        family="city"
                        status={store.offerCount ? 'active' : 'activating'}
                      >
                        {store.offerCount
                          ? `${store.offerCount} ofertas`
                          : 'Em ativação'}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-3 text-muted-foreground">
                  {city.activeStoreCount > 0
                    ? 'Estabelecimentos ativos com ofertas públicas. Veja os nomes no filtro de ofertas.'
                    : city.status === 'pilot'
                      ? 'Cidade em ativação. As ofertas aparecem quando houver estabelecimentos e preços validados.'
                      : 'Ainda sem estabelecimentos ativos.'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Solicitar nova cidade</CardTitle>
          <CardDescription>
            A equipe analisa pedidos de cobertura. Somente admins conseguem
            ativar cidades e estabelecimentos no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-[1fr_120px] lg:grid-cols-[1fr_120px_1fr_auto]"
            onSubmit={handleCityRequestSubmit}
          >
            <Field>
              <FieldLabel htmlFor="city-request-name">Cidade</FieldLabel>
              <Input
                id="city-request-name"
                maxLength={80}
                minLength={2}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    cityName: event.target.value,
                  }))
                }
                placeholder="Campinas"
                required
                value={requestForm.cityName}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="city-request-state">UF</FieldLabel>
              <Input
                id="city-request-state"
                maxLength={2}
                minLength={2}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    stateCode: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="SP"
                required
                value={requestForm.stateCode}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="city-request-email">Contato</FieldLabel>
              <Input
                id="city-request-email"
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    contactEmail: event.target.value,
                  }))
                }
                placeholder="email opcional"
                type="email"
                value={requestForm.contactEmail}
              />
            </Field>
            <div className="flex items-end">
              <Button disabled={requestStatus === 'submitting'} type="submit">
                Solicitar
              </Button>
            </div>
            <Field className="md:col-span-2 lg:col-span-4">
              <FieldLabel htmlFor="city-request-message">
                Estabelecimentos importantes
              </FieldLabel>
              <Textarea
                id="city-request-message"
                maxLength={500}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                placeholder="Mercados ou bairros que deveriam entrar na cobertura"
                value={requestForm.message}
              />
            </Field>
          </form>
          {requestStatus === 'submitted' ? (
            <Alert className="mt-4">
              <BadgeCheckIcon />
              <AlertTitle>Pedido registrado</AlertTitle>
              <AlertDescription>
                Vamos avaliar a cidade e priorizar a ativação quando houver
                cobertura mínima de estabelecimentos e ofertas.
              </AlertDescription>
            </Alert>
          ) : null}
          {requestStatus === 'failed' ? (
            <Alert className="mt-4" variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Não foi possível enviar</AlertTitle>
              <AlertDescription>
                Revise os campos e tente novamente em instantes.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function SignInPage() {
  const { signIn, signUp } = usePricely();

  return (
    <AuthCard
      initialMode="sign-in"
      onSignIn={({ email, password }) => signIn(email, password)}
      onSignUp={({ displayName, email, password }) =>
        signUp(email, password, displayName)
      }
    />
  );
}

export function SignUpPage() {
  const { signIn, signUp } = usePricely();

  return (
    <AuthCard
      initialMode="sign-up"
      onSignIn={({ email, password }) => signIn(email, password)}
      onSignUp={({ displayName, email, password }) =>
        signUp(email, password, displayName)
      }
    />
  );
}

export function ReceiptSubmissionPage() {
  const { accessToken } = usePricely();
  const [form, setForm] = useState({
    storeName: '',
    storeCnpj: '',
    purchaseDate: '',
    qrCodeUrl: '',
    rawProductName: '',
    ean: '',
    quantity: '1',
    unitPrice: '',
  });
  const [submission, setSubmission] = useState<{
    status: 'idle' | 'submitting' | 'submitted' | 'failed';
    message?: string;
    processingStatus?:
      | 'waiting_manual_release'
      | 'queued'
      | 'running'
      | 'completed'
      | 'failed'
      | 'retrying'
      | 'cancelled';
    rewardEligibilityStatus?:
      | 'disabled'
      | 'ineligible'
      | 'eligible_pending'
      | 'granted';
    rewardPoints?: number;
    rewardOptimizationTokens?: number;
  }>({ status: 'idle' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    setSubmission({ status: 'submitting' });
    try {
      const hasManualItem = form.rawProductName.trim() && form.unitPrice.trim();
      const response = await submitReceipt(accessToken, {
        storeName: form.storeName || undefined,
        storeCnpj: form.storeCnpj || undefined,
        purchaseDate: form.purchaseDate || undefined,
        qrCodeUrl: form.qrCodeUrl || undefined,
        items: hasManualItem
          ? [
              {
                rawProductName: form.rawProductName,
                ean: form.ean || undefined,
                quantity: Number(form.quantity || 1),
                unitPrice: Number(form.unitPrice),
              },
            ]
          : undefined,
      });

      setSubmission({
        status: 'submitted',
        message:
          response.processingStatus === 'waiting_manual_release'
            ? 'Nota recebida. Ela fica aguardando liberação manual antes do processamento.'
            : (response.rewardMessage ?? 'Nota enviada para processamento.'),
        processingStatus: response.processingStatus,
        rewardEligibilityStatus: response.rewardEligibilityStatus,
        rewardPoints: response.rewardPoints,
        rewardOptimizationTokens: response.rewardOptimizationTokens,
      });
      setForm({
        storeName: '',
        storeCnpj: '',
        purchaseDate: '',
        qrCodeUrl: '',
        rawProductName: '',
        ean: '',
        quantity: '1',
        unitPrice: '',
      });
    } catch (error) {
      setSubmission({
        status: 'failed',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel enviar a nota fiscal.',
      });
    }
  };

  return (
    <RequireAuthentication
      description="Entre para contribuir com notas fiscais e acompanhar histórico, status e benefícios depois da validação."
      title="Envio de nota fiscal precisa da sua conta"
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Enviar nota fiscal</CardTitle>
            <CardDescription>
              O MVP recebe a nota agora e mantém em fila manual. Um admin libera
              o processamento antes de gerar ofertas e validar rewards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Field>
                <FieldLabel htmlFor="receipt-qrcode">
                  QR code ou URL NFC-e
                </FieldLabel>
                <Textarea
                  id="receipt-qrcode"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      qrCodeUrl: event.target.value,
                    }))
                  }
                  placeholder="Cole a URL lida do QR code da NFC-e"
                  value={form.qrCodeUrl}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="receipt-store">
                    Estabelecimento
                  </FieldLabel>
                  <Input
                    id="receipt-store"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        storeName: event.target.value,
                      }))
                    }
                    placeholder="Mercado Centro"
                    value={form.storeName}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="receipt-date">Data da compra</FieldLabel>
                  <Input
                    id="receipt-date"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        purchaseDate: event.target.value,
                      }))
                    }
                    type="date"
                    value={form.purchaseDate}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="receipt-cnpj">CNPJ</FieldLabel>
                <Input
                  id="receipt-cnpj"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storeCnpj: event.target.value,
                    }))
                  }
                  placeholder="00.000.000/0001-00"
                  value={form.storeCnpj}
                />
              </Field>
              <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <div className="mb-3 text-sm font-medium">
                  Item manual para MVP
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_120px_120px]">
                  <Field>
                    <FieldLabel htmlFor="receipt-item">Produto</FieldLabel>
                    <Input
                      id="receipt-item"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          rawProductName: event.target.value,
                        }))
                      }
                      placeholder="Arroz tipo 1 5kg"
                      value={form.rawProductName}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="receipt-quantity">Qtd.</FieldLabel>
                    <Input
                      id="receipt-quantity"
                      min="0.001"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                      step="0.001"
                      type="number"
                      value={form.quantity}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="receipt-price">Preço</FieldLabel>
                    <Input
                      id="receipt-price"
                      min="0.01"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          unitPrice: event.target.value,
                        }))
                      }
                      step="0.01"
                      type="number"
                      value={form.unitPrice}
                    />
                  </Field>
                </div>
              </div>
              <Button
                disabled={submission.status === 'submitting'}
                type="submit"
              >
                <UploadIcon className="size-4" />
                Enviar nota
              </Button>
            </form>
            {submission.status === 'submitted' ? (
              <div className="mt-4 grid gap-3">
                <Alert>
                  <BadgeCheckIcon />
                  <AlertTitle>Nota recebida</AlertTitle>
                  <AlertDescription>{submission.message}</AlertDescription>
                </Alert>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                    <div className="text-sm font-medium">Fila</div>
                    <div className="mt-1">
                      <StatusBadge
                        family={
                          submission.processingStatus &&
                          submission.processingStatus !==
                            'waiting_manual_release'
                            ? 'queue'
                            : undefined
                        }
                        status={
                          submission.processingStatus ===
                          'waiting_manual_release'
                            ? undefined
                            : submission.processingStatus
                        }
                        tone={
                          submission.processingStatus ===
                          'waiting_manual_release'
                            ? 'warning'
                            : undefined
                        }
                        tooltip="Status da fila após o envio: a nota pode aguardar liberação manual, processamento ou nova tentativa."
                      >
                        {submission.processingStatus ===
                        'waiting_manual_release'
                          ? 'Aguardando liberação manual'
                          : submission.processingStatus === 'queued'
                            ? 'Liberada para processamento'
                            : submission.processingStatus === 'running'
                              ? 'Processando leitura'
                              : submission.processingStatus === 'completed'
                                ? 'Processada'
                                : submission.processingStatus === 'failed'
                                  ? 'Falhou'
                                  : submission.processingStatus === 'retrying'
                                    ? 'Tentando novamente'
                                    : 'Recebida'}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                    <div className="text-sm font-medium">Reward</div>
                    <div className="mt-1">
                      <StatusBadge
                        family="reward"
                        status={
                          submission.rewardEligibilityStatus === 'ineligible'
                            ? 'rejected'
                            : submission.rewardEligibilityStatus
                        }
                        tooltip="Reward depende da qualidade da nota, validação da evidência e regras antifraude."
                      >
                        {submission.rewardEligibilityStatus === 'granted'
                          ? 'Validado e concedido'
                          : submission.rewardEligibilityStatus ===
                              'eligible_pending'
                            ? 'Em processamento'
                            : submission.rewardEligibilityStatus ===
                                'ineligible'
                              ? 'Sem elegibilidade'
                              : 'Aguardando qualidade'}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                    <div className="text-sm font-medium">Próximo passo</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {submission.processingStatus === 'waiting_manual_release'
                        ? 'Admin libera no dashboard'
                        : 'Acompanhar validação no histórico'}
                    </div>
                  </div>
                </div>
                {submission.rewardEligibilityStatus === 'eligible_pending' ||
                submission.rewardEligibilityStatus === 'granted' ? (
                  <div className="rounded-lg border border-[var(--ds-savings-border)] bg-[var(--ds-savings-soft)] p-3 text-sm text-[var(--ds-savings)]">
                    {submission.rewardEligibilityStatus === 'granted'
                      ? 'Reward validado: '
                      : 'Reward previsto após validação: '}
                    {submission.rewardPoints ?? 100} pontos e{' '}
                    {submission.rewardOptimizationTokens ?? 1} crédito de
                    otimização.
                  </div>
                ) : null}
              </div>
            ) : null}
            {submission.status === 'failed' ? (
              <Alert className="mt-4" variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Falha no envio</AlertTitle>
                <AlertDescription>{submission.message}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[var(--ds-savings-border)] bg-[var(--ds-savings-soft)]/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Como o reward funciona</CardTitle>
              <InfoTooltip
                label="O reward só é concedido depois que a nota passa por liberação, processamento e validação de confiança."
                triggerLabel="Entender regras do reward"
              />
            </div>
            <CardDescription>
              Envio recebido, reward em processamento, nota validada e reward
              concedido depois da liberação/admin e processamento da fila.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {[
              'Nota enviada entra na fila manual.',
              'Admin libera o processamento no dashboard.',
              'Matcher compara itens com catálogo e cria ofertas quando aplicável.',
              'Reward sai de processamento para validado quando a nota é confiável.',
            ].map((step, index) => (
              <div
                className="flex items-center gap-3 rounded-lg border border-[var(--ds-savings-border)] bg-card/80 p-3"
                key={step}
              >
                <StatusBadge icon={null} tone="savings">
                  {index + 1}
                </StatusBadge>
                <span>{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </RequireAuthentication>
  );
}

export function ListsPage() {
  const { cityId, currentUser, lists, profile } = usePricely();
  const currentCity = cityId ? getCityById(cityId) : null;
  const nextList =
    lists.find((list) => list.latestOptimizationStatus !== 'completed') ??
    lists[0];
  const shopperAction = !nextList
    ? {
        title: 'Crie sua primeira lista de compra',
        description:
          'Comece pela cidade, adicione produtos comparáveis e salve a lista para otimizar em seguida.',
        primaryAction: { label: 'Nova lista', to: '/listas/nova' },
        secondaryAction: undefined,
        steps: [
          { label: 'Lista', status: 'current' as const },
          { label: 'Otimização', status: 'pending' as const },
          { label: 'Checklist', status: 'pending' as const },
          { label: 'Nota fiscal', status: 'pending' as const },
        ],
      }
    : {
        title:
          nextList.latestOptimizationStatus === 'completed'
            ? 'Use o checklist no mercado'
            : 'Otimize a lista antes de comprar',
        description:
          nextList.latestOptimizationStatus === 'completed'
            ? 'A lista já tem uma recomendação. Confira os itens no mercado, reporte divergências e finalize com a nota fiscal.'
            : 'Compare preços por cidade ou por raio local antes de abrir o checklist.',
        primaryAction: {
          label:
            nextList.latestOptimizationStatus === 'completed'
              ? 'Abrir checklist'
              : 'Otimizar lista',
          to:
            nextList.latestOptimizationStatus === 'completed'
              ? `/listas/${nextList.id}/checklist`
              : `/otimizacao/${nextList.id}`,
        },
        secondaryAction: {
          label: 'Editar lista',
          to: `/listas/${nextList.id}`,
        },
        steps: [
          { label: 'Lista', status: 'done' as const },
          {
            label: 'Otimização',
            status:
              nextList.latestOptimizationStatus === 'completed'
                ? ('done' as const)
                : ('current' as const),
          },
          {
            label: 'Checklist',
            status:
              nextList.latestOptimizationStatus === 'completed'
                ? ('current' as const)
                : ('pending' as const),
          },
          { label: 'Nota fiscal', status: 'pending' as const },
        ],
      };
  const isPremium = profile.entitlementPlan === 'premium';
  const billingEnabled = profile.billingEnabled && profile.checkoutEnabled;

  return (
    <RequireAuthentication
      description="Entre para salvar listas, reaproveitar compras mensais e otimizar quando quiser."
      title="Sua lista precisa da sua conta"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Minhas listas
            </h1>
            <p className="text-muted-foreground">
              Suas listas ficam sincronizadas entre web e mobile. Você pode
              salvar sem otimizar e processar depois.
            </p>
          </div>
          <Button asChild>
            <Link to="/listas/nova">Nova lista</Link>
          </Button>
        </div>

        <NextBestActionStrip {...shopperAction} />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardDescription>Conta ativa</CardDescription>
              <CardTitle>{currentUser?.displayName ?? 'Minha conta'}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {currentUser?.email}
              </div>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardDescription>Cidade salva</CardDescription>
              <CardTitle>
                {currentCity
                  ? `${currentCity.name} · ${currentCity.stateCode}`
                  : 'Cidade pendente'}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {currentCity
                  ? `${currentCity.activeStoreCount} estabelecimentos ativos`
                  : 'Escolha a cidade para carregar cobertura e ofertas'}
              </div>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardDescription>Listas criadas</CardDescription>
              <CardTitle>{profile.listsCreated}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardDescription>Economia estimada acumulada</CardDescription>
              <CardTitle>
                <MaskedMoney
                  value={formatCurrency(profile.totalEstimatedSavings)}
                />
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Esse é o valor total que você economizou com listas otimizadas
                na sua conta.
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-[var(--ds-savings-border)] bg-[var(--ds-savings-soft)]/70 shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                family="reward"
                status={isPremium ? 'granted' : 'eligible_pending'}
              >
                {isPremium ? 'Premium ativo' : 'Plano gratuito'}
              </StatusBadge>
              <StatusBadge tone="neutral">
                {isPremium
                  ? 'Otimizações ilimitadas'
                  : `${profile.availableOptimizationTokens} de ${profile.monthlyFreeOptimizationTokens} listas no mês`}
              </StatusBadge>
            </div>
            <CardTitle>
              {isPremium ? 'Benefícios Premium' : 'Uso do plano gratuito'}
            </CardTitle>
            <CardDescription>
              {isPremium
                ? 'Sua conta Premium está ativa. Você pode otimizar listas sem limite e manter o histórico sincronizado na conta.'
                : billingEnabled
                  ? 'O plano gratuito inclui 2 listas otimizadas por mês. Você pode fazer upgrade quando quiser liberar uso ilimitado.'
                  : 'O plano gratuito inclui 2 listas otimizadas por mês. O upgrade Premium permanece temporariamente indisponível enquanto o billing é validado.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline">
              {isPremium
                ? 'Premium ativo'
                : billingEnabled
                  ? 'Comprar Premium'
                  : 'Premium indisponível'}
            </Button>
          </CardContent>
        </Card>

        {lists.length === 0 ? (
          <ActionPlaceholder
            icon={<BadgeCheckIcon className="size-5" />}
            title="Crie sua primeira lista"
            description="Salve a compra do mês, otimize quando os preços mudarem e acompanhe a economia estimada na sua conta."
            primaryAction={<Link to="/listas/nova">Criar lista</Link>}
            secondaryAction={<Link to="/ofertas">Explorar ofertas</Link>}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {lists.map((list) => (
              <Card
                key={list.id}
                className="border-2 border-border/80 bg-card/95 shadow-sm"
              >
                <CardHeader>
                  <CardTitle>{list.name}</CardTitle>
                  <CardDescription>
                    {getCityById(list.cityId).name} - {list.items.length} itens
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {list.items[0] ? (
                    <PriceRow
                      image={
                        list.items[0].imageUrl ? (
                          <img
                            alt={list.items[0].name}
                            className="size-full object-cover"
                            src={resolveProductImage(list.items[0].imageUrl)}
                          />
                        ) : null
                      }
                      title={list.items[0].name}
                      subtitle={
                        list.items.length > 1
                          ? `Mais ${list.items.length - 1} itens nesta lista`
                          : 'Item principal da lista'
                      }
                      price={
                        <MaskedMoney
                          value={formatCurrency(list.expectedSavings)}
                        />
                      }
                      comparison="economia estimada"
                      meta={
                        <>
                          <StatusBadge
                            family="queue"
                            status={
                              list.latestOptimizationStatus === 'completed'
                                ? 'completed'
                                : list.latestOptimizationStatus === 'running'
                                  ? 'running'
                                  : list.latestOptimizationStatus === 'failed'
                                    ? 'failed'
                                    : 'queued'
                            }
                          >
                            {list.latestOptimizationStatus === 'completed'
                              ? 'Otimizada'
                              : list.latestOptimizationStatus === 'running'
                                ? 'Processando'
                                : list.latestOptimizationStatus === 'failed'
                                  ? 'Falhou'
                                  : 'Pronta para otimizar'}
                          </StatusBadge>
                        </>
                      }
                    />
                  ) : null}
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div>
                      Última atualização: {formatDateTime(list.updatedAt)}
                    </div>
                    <div>
                      Modo de otimização:{' '}
                      {
                        optimizationModes.find(
                          (mode) => mode.id === list.lastMode,
                        )?.label
                      }
                    </div>
                    <div>
                      Economia estimada desta lista:{' '}
                      <MaskedMoney
                        value={formatCurrency(list.expectedSavings)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between gap-3">
                  <Button
                    asChild
                    className="border-2 border-border/90"
                    size="sm"
                    variant="outline"
                  >
                    <Link to={`/listas/${list.id}`}>Editar</Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      className="border-2 border-border/90"
                      size="sm"
                      variant="outline"
                    >
                      <Link to={`/listas/${list.id}/checklist`}>Checklist</Link>
                    </Button>
                    <Button
                      asChild
                      className="border-2 border-primary/70"
                      size="sm"
                    >
                      <Link to={`/otimizacao/${list.id}`}>Otimizar</Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RequireAuthentication>
  );
}

export function SharedListPage() {
  const { shareToken = '' } = useParams();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const loadSharedList = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchSharedShoppingList(shareToken);
        if (!disposed) {
          setList(mapShoppingList(response));
        }
      } catch {
        if (!disposed) {
          setList(null);
          setError('Esta lista não está mais disponível.');
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void loadSharedList();

    return () => {
      disposed = true;
    };
  }, [shareToken]);

  const city = list ? getCityById(list.cityId) : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando lista compartilhada</CardTitle>
          <CardDescription>
            Validando o link público e preparando os itens.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !list) {
    return (
      <ActionPlaceholder
        description="Peça um novo link para quem compartilhou ou crie sua própria lista para otimizar preços."
        primaryAction={<Link to="/listas/nova">Criar lista</Link>}
        title="Link de lista indisponível"
      />
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{list.name}</CardTitle>
            <CardDescription>
              Lista pública somente leitura
              {city ? ` · ${city.name} - ${city.stateCode}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {list.items.map((item) => (
              <div
                className="grid gap-2 rounded-lg border border-border/70 bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                key={item.id}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} {item.unitLabel}
                    {item.note ? ` · ${item.note}` : ''}
                  </div>
                </div>
                <StatusBadge
                  label={
                    item.status === 'resolved'
                      ? 'Catálogo encontrado'
                      : item.status === 'partial'
                        ? 'Revisar variante'
                        : 'Produto pendente'
                  }
                  tone={item.status === 'resolved' ? 'primary' : 'warning'}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Use no Pricely</CardTitle>
            <CardDescription>
              Entre para salvar esta compra, ajustar marcas e rodar uma otimização
              com preços da sua cidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild>
              <Link to="/criar-conta">Criar conta</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/listas/nova">Montar minha lista</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Itens</span>
              <span className="font-medium">{list.items.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Economia estimada</span>
              <MaskedMoney
                className="font-medium"
                value={formatCurrency(list.expectedSavings)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Atualizada</span>
              <span className="font-medium">{formatDateTime(list.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}

export function ChecklistPage() {
  const { listId = '' } = useParams();
  const {
    lists,
    completeListCheckout,
    loadLatestOptimization,
    optimizationResults,
    reportListItemPriceMismatch,
    updateListItemPurchaseStatus,
  } = usePricely();
  const [error, setError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [paidTotal, setPaidTotal] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [reportItem, setReportItem] = useState<ShoppingListItem | null>(null);
  const [reportedPrice, setReportedPrice] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const list = lists.find((entry) => entry.id === listId);
  const optimizationResult = optimizationResults[listId];
  const purchasedCount =
    list?.items.filter((item) => item.purchaseStatus === 'purchased').length ??
    0;
  const allItemsPurchased = Boolean(
    list && list.items.length > 0 && purchasedCount === list.items.length,
  );
  const checklistProgress = list?.items.length
    ? Math.round((purchasedCount / list.items.length) * 100)
    : 0;
  const selectionByItemId = new Map(
    optimizationResult?.selections.map((selection) => [
      selection.shoppingListItemId,
      selection,
    ]) ?? [],
  );
  const expectedTotal =
    list?.items.reduce((total, item) => {
      const selection = selectionByItemId.get(item.id);
      return total + (selection?.priceAmount ?? 0) * Math.max(1, item.quantity);
    }, 0) ?? 0;
  const itemsWithExpectedPrice =
    list?.items.filter((item) => selectionByItemId.has(item.id)).length ?? 0;
  const groupedChecklist = Array.from(
    (list?.items ?? [])
      .reduce(
        (groups, item) => {
          const selection = selectionByItemId.get(item.id);
          const storeName =
            selection?.establishmentName ??
            (optimizationResult ? 'Sem loja definida' : 'Conferência manual');
          const current = groups.get(storeName) ?? {
            storeName,
            neighborhood: selection?.establishmentNeighborhood,
            items: [] as ShoppingListItem[],
          };

          current.items.push(item);
          groups.set(storeName, current);

          return groups;
        },
        new Map<
          string,
          {
            storeName: string;
            neighborhood?: string;
            items: ShoppingListItem[];
          }
        >(),
      )
      .values(),
  );

  useEffect(() => {
    if (!list || optimizationResult) {
      return;
    }

    void loadLatestOptimization(list.id).catch(() => undefined);
  }, [list, loadLatestOptimization, optimizationResult]);

  const toggleItem = async (
    itemId: string,
    purchaseStatus: 'pending' | 'purchased',
  ) => {
    setError(null);
    setPendingItemId(itemId);

    try {
      await updateListItemPurchaseStatus(
        listId,
        itemId,
        purchaseStatus === 'purchased' ? 'pending' : 'purchased',
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Não foi possível atualizar o checklist.',
      );
    } finally {
      setPendingItemId(null);
    }
  };

  const expectedPriceForItem = (itemId: string) =>
    optimizationResult?.selections.find(
      (selection) => selection.shoppingListItemId === itemId,
    )?.priceAmount;

  const completeChecklist = async () => {
    setError(null);
    setIsCompleting(true);

    try {
      await completeListCheckout(
        listId,
        paidTotal.trim() ? Number(paidTotal.replace(',', '.')) : undefined,
      );
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : 'Não foi possível concluir a lista.',
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const submitPriceReport = async () => {
    if (!reportItem) {
      return;
    }

    setError(null);
    const expectedPrice = expectedPriceForItem(reportItem.id);

    try {
      await reportListItemPriceMismatch(listId, reportItem.id, {
        expectedPrice,
        reportedPrice: reportedPrice.trim()
          ? Number(reportedPrice.replace(',', '.'))
          : undefined,
        reason: reportReason,
      });
      setReportSuccess(`Reporte registrado para ${reportItem.name}.`);
      setReportItem(null);
      setReportedPrice('');
      setReportReason('');
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : 'Não foi possível registrar o reporte de preço.',
      );
    }
  };

  return (
    <RequireAuthentication
      description="Entre para usar o checklist sincronizado durante a compra."
      title="Checklist protegido"
    >
      {!list ? (
        <Alert variant="destructive">
          <ShieldAlertIcon />
          <AlertTitle>Lista não encontrada</AlertTitle>
          <AlertDescription>
            Escolha uma lista válida para abrir o checklist.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <div className="grid gap-4 border-b border-border/70 pb-4 lg:grid-cols-[auto_minmax(0,1fr)_200px] lg:items-center">
            <Button asChild className="w-fit px-0" size="sm" variant="link">
              <Link to={`/listas/${list.id}`}>
                <ChevronRightIcon className="size-4 rotate-180" />
                Voltar
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Checklist de compras
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {list.name} · Modo:{' '}
                {optimizationModeCopy[list.lastMode]?.title ??
                  'Menor total na cidade'}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-4">
              <div className="text-xl font-semibold tabular-nums">
                {purchasedCount} de {list.items.length}
              </div>
              <div className="text-xs text-muted-foreground">
                itens comprados
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-[var(--ds-savings)]"
                  style={{ width: `${Math.max(8, checklistProgress)}%` }}
                />
              </div>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <ShieldAlertIcon />
              <AlertTitle>Falha no checklist</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {reportSuccess ? (
            <Alert>
              <BadgeCheckIcon />
              <AlertTitle>Reporte recebido</AlertTitle>
              <AlertDescription>{reportSuccess}</AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-lg border border-[var(--ds-location-border)] bg-[var(--ds-location-soft)]/45 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[var(--ds-location-soft)] text-[var(--ds-location)]">
                  <MapPinIcon className="size-5" />
                </div>
                <div>
                  <div className="font-semibold">Plano de compras</div>
                  <div className="text-sm text-muted-foreground">
                    {groupedChecklist.length}{' '}
                    {groupedChecklist.length === 1 ? 'parada' : 'paradas'} ·{' '}
                    {getCityById(list.cityId).name} ·{' '}
                    {optimizationResult
                      ? 'preços esperados carregados'
                      : 'conferência manual'}
                  </div>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={`/otimizacao/${list.id}`}>
                  Ver otimização
                  <ExternalLinkIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {groupedChecklist.map((group, groupIndex) => (
              <section
                className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm"
                key={group.storeName}
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {groupIndex + 1}
                    </div>
                    <div>
                      <h2 className="font-semibold">{group.storeName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {group.neighborhood ?? getCityById(list.cityId).name}
                      </p>
                    </div>
                  </div>
                  <StatusBadge tone="savings">
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'item' : 'itens'}
                  </StatusBadge>
                </div>

                <div className="divide-y divide-border/70">
                  {group.items.map((item) => {
                    const checked = item.purchaseStatus === 'purchased';
                    const optimizationSelection = selectionByItemId.get(
                      item.id,
                    );
                    const expectedPrice = optimizationSelection?.priceAmount;
                    const optimizedVariantLabel =
                      optimizationSelection?.selectedVariantName ??
                      (item.optimizedProductVariantId
                        ? 'variante definida pela otimização'
                        : undefined);
                    const isReporting = reportItem?.id === item.id;

                    return (
                      <div key={item.id} className="grid gap-0">
                        <div
                          className={`grid gap-3 p-4 sm:grid-cols-[36px_64px_minmax(0,1fr)_150px_auto] sm:items-center ${
                            checked
                              ? 'bg-[var(--ds-savings-soft)]/25'
                              : 'bg-card'
                          }`}
                        >
                          <input
                            aria-label={`Marcar ${item.name} como comprado`}
                            checked={checked}
                            className="size-6 rounded"
                            disabled={pendingItemId === item.id}
                            onChange={() =>
                              void toggleItem(
                                item.id,
                                item.purchaseStatus ?? 'pending',
                              )
                            }
                            type="checkbox"
                          />
                          <img
                            alt={item.name}
                            className="size-16 rounded-md border border-border/70 object-cover"
                            src={resolveProductImage(item.imageUrl)}
                          />
                          <div className="min-w-0">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {optimizedVariantLabel ??
                                `${item.quantity} ${item.unitLabel}`}
                            </div>
                            {expectedPrice !== undefined ? (
                              <div className="text-xs text-muted-foreground">
                                Preço previsto:{' '}
                                <MaskedMoney
                                  value={formatCurrency(expectedPrice)}
                                />
                              </div>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <StatusBadge
                                tone={
                                  item.brandPreferenceMode === 'preferred'
                                    ? 'warning'
                                    : 'savings'
                                }
                              >
                                {describeBrandRule(
                                  item,
                                  item.brandPreferenceMode === 'exact'
                                    ? item.name
                                    : undefined,
                                )}
                              </StatusBadge>
                              <StatusBadge
                                family="queue"
                                status={checked ? 'completed' : 'queued'}
                              >
                                {checked ? 'Comprado' : 'Pendente'}
                              </StatusBadge>
                            </div>
                          </div>
                          <div className="text-sm sm:text-right">
                            <div className="font-semibold">
                              {expectedPrice !== undefined ? (
                                <MaskedMoney
                                  value={formatCurrency(expectedPrice)}
                                />
                              ) : (
                                'Sem preço'
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              cada
                            </div>
                            {optimizationSelection?.trustFactor !==
                            undefined ? (
                              <StatusBadge
                                family="trust"
                                status={
                                  optimizationSelection.trustFactor >= 75
                                    ? 'high'
                                    : 'medium'
                                }
                                className="mt-2"
                              >
                                {optimizationSelection.trustFactor}/100
                              </StatusBadge>
                            ) : null}
                          </div>
                          <Button
                            aria-label={`Reportar preço de ${item.name}`}
                            onClick={() => {
                              setReportItem(isReporting ? null : item);
                              setReportedPrice(
                                expectedPrice !== undefined
                                  ? String(expectedPrice).replace('.', ',')
                                  : '',
                              );
                              setReportReason('');
                            }}
                            size="sm"
                            type="button"
                            variant={isReporting ? 'secondary' : 'ghost'}
                          >
                            Reportar preço
                          </Button>
                        </div>

                        {isReporting ? (
                          <div className="grid gap-3 border-t border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)]/55 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 font-medium text-[var(--ds-warning)]">
                                <FlagIcon className="size-4" />
                                Preço diferente na gôndola
                              </div>
                              <Button
                                onClick={() => {
                                  setReportItem(null);
                                  setReportedPrice('');
                                  setReportReason('');
                                }}
                                size="sm"
                                type="button"
                                variant="link"
                              >
                                Desfazer
                              </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                              <Field>
                                <FieldLabel>Preço encontrado</FieldLabel>
                                <Input
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    setReportedPrice(event.target.value)
                                  }
                                  placeholder="Ex.: 21,90"
                                  value={reportedPrice}
                                />
                              </Field>
                              <Field>
                                <FieldLabel>Observação opcional</FieldLabel>
                                <Textarea
                                  onChange={(event) =>
                                    setReportReason(event.target.value)
                                  }
                                  placeholder="Ex.: etiqueta mostrava outro valor ou item indisponível"
                                  value={reportReason}
                                />
                              </Field>
                              <div className="flex items-end">
                                <Button
                                  onClick={submitPriceReport}
                                  type="button"
                                >
                                  Enviar reporte
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Obrigado. Vamos verificar e atualizar se
                              confirmado.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Resumo da compra</h2>
              <StatusBadge
                family="severity"
                status={allItemsPurchased ? 'healthy' : 'warning'}
              >
                {allItemsPurchased ? 'Completa' : 'Parcial'}
              </StatusBadge>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Itens comprados
                </div>
                <div className="mt-1 text-2xl font-semibold text-primary">
                  {purchasedCount} / {list.items.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Economia estimada
                </div>
                <div className="mt-1 text-2xl font-semibold text-[var(--ds-savings)]">
                  <MaskedMoney
                    value={formatCurrency(list.expectedSavings ?? 0)}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Total esperado
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  <MaskedMoney value={formatCurrency(expectedTotal)} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Cobertura dos itens
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {itemsWithExpectedPrice} de {list.items.length}
                </div>
              </div>
            </div>
          </div>

          {list.completedAt ? (
            <ActionPlaceholder
              icon={<UploadIcon className="size-5" />}
              title={
                list.paidTotal === undefined
                  ? 'Envie a nota desta compra'
                  : 'Compra concluída'
              }
              description={
                list.paidTotal === undefined
                  ? 'A lista foi concluída, mas ainda falta uma nota fiscal para validar os preços encontrados e liberar o histórico confiável.'
                  : 'Use a nota fiscal para validar os preços encontrados e melhorar a cobertura da cidade.'
              }
              primaryAction={<Link to="/notas">Enviar nota fiscal</Link>}
              secondaryAction={<Link to={`/listas/${list.id}`}>Ver lista</Link>}
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Lista concluída em {formatDateTime(list.completedAt)}
                  {list.paidTotal !== undefined ? (
                    <>
                      {' '}
                      · total pago{' '}
                      <MaskedMoney value={formatCurrency(list.paidTotal)} />
                    </>
                  ) : (
                    ''
                  )}
                </p>
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <StatusBadge tone="neutral">Envio recebido</StatusBadge>
                  <StatusBadge family="reward" status="eligible_pending">
                    Reward em processamento
                  </StatusBadge>
                  <StatusBadge family="reward" status="granted">
                    Reward validado após nota confiável
                  </StatusBadge>
                </div>
              </div>
            </ActionPlaceholder>
          ) : null}

          <StickyActionBar id="checklist-actions">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ReceiptTextIcon className="size-5" />
              </div>
              <div>
                <div className="font-medium">Total pago opcional</div>
                <div className="text-sm text-muted-foreground">
                  Ajuda a aumentar a precisão, sem prometer reward antes da
                  validação da nota.
                </div>
              </div>
            </div>
            {!list.completedAt ? (
              <div className="flex flex-col gap-2 sm:min-w-[420px] sm:flex-row">
                <Input
                  inputMode="decimal"
                  onChange={(event) => setPaidTotal(event.target.value)}
                  placeholder="R$ 0,00"
                  value={paidTotal}
                />
                <Button
                  disabled={isCompleting || !allItemsPurchased}
                  onClick={completeChecklist}
                  type="button"
                >
                  <CheckCircle2Icon className="size-4" />
                  Concluir lista
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link to="/notas">Enviar nota fiscal</Link>
              </Button>
            )}
          </StickyActionBar>
        </div>
      )}
    </RequireAuthentication>
  );
}

function buildEditableItems(source?: ShoppingList): EditableListItem[] {
  if (!source) {
    return [];
  }

  return source.items.map((item) => ({
    id: item.id,
    name: item.name,
    catalogProductId: item.catalogProductId,
    lockedProductVariantId: item.lockedProductVariantId,
    brandPreferenceMode: item.brandPreferenceMode ?? 'any',
    preferredBrandNames: item.preferredBrandNames ?? [],
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    unitLabel: item.unitLabel,
    purchaseStatus: item.purchaseStatus,
    note: item.note,
  }));
}

function ListEditorPageLegacy() {
  const navigate = useNavigate();
  const { listId = 'nova' } = useParams();
  const {
    accessToken,
    cityId,
    cities,
    lists,
    preferredMode,
    saveList,
    shareList,
  } = usePricely();
  const editingList =
    listId === 'nova' ? undefined : lists.find((entry) => entry.id === listId);
  const [name, setName] = useState(editingList?.name ?? '');
  const [selectedCityId, setSelectedCityId] = useState(
    editingList?.cityId ?? cityId ?? '',
  );
  const [mode, setMode] = useState<OptimizationModeId>(
    editingList?.lastMode ?? preferredMode,
  );
  const [items, setItems] = useState<EditableListItem[]>(() =>
    buildEditableItems(editingList),
  );
  const [draftName, setDraftName] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('1');
  const [draftUnit, setDraftUnit] = useState('un');
  const [draftNote, setDraftNote] = useState('');
  const [draftBrandPreferenceMode, setDraftBrandPreferenceMode] = useState<
    'any' | 'exact'
  >('any');
  const [catalogResults, setCatalogResults] = useState<
    CatalogProductSearchResponse[]
  >([]);
  const [selectedCatalogProduct, setSelectedCatalogProduct] =
    useState<CatalogProductSearchResponse | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<
    ProductVariantResponse[]
  >([]);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [isMissingProductDialogOpen, setIsMissingProductDialogOpen] =
    useState(false);
  const [missingProductCategory, setMissingProductCategory] = useState('');
  const [missingProductMessage, setMissingProductMessage] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const selectedVariant = selectedVariants.find(
    (variant) => variant.id === selectedVariantId,
  );
  const selectedExactVariantLabel = selectedVariant
    ? `${selectedVariant.brandName ? `${selectedVariant.brandName} · ` : ''}${selectedVariant.displayName}`
    : undefined;
  const selectedCity = selectedCityId
    ? cities.find((entry) => entry.id === selectedCityId)
    : null;

  const persistList = async (optimizeAfterSave: boolean) => {
    setError(null);

    if (!selectedCityId) {
      setError('Escolha a cidade da lista antes de salvar.');
      return;
    }

    if (!name.trim()) {
      setError('Defina um nome para a lista antes de salvar.');
      return;
    }

    if (items.length === 0) {
      setError('Adicione pelo menos um item antes de salvar a lista.');
      return;
    }

    setIsSaving(true);

    try {
      const saved = await saveList({
        id: editingList?.id,
        name: name.trim(),
        cityId: selectedCityId,
        lastMode: mode,
        items: items.map((item) => ({
          name: item.name,
          catalogProductId: item.catalogProductId,
          lockedProductVariantId: item.lockedProductVariantId,
          brandPreferenceMode: item.brandPreferenceMode,
          preferredBrandNames: item.preferredBrandNames,
          purchaseStatus: item.purchaseStatus,
          quantity: item.quantity,
          unitLabel: item.unitLabel,
          note: item.note,
        })),
      });
      navigate(optimizeAfterSave ? `/otimizacao/${saved.id}` : '/listas');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar a lista.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    setError(null);
    setShareMessage(null);

    if (!editingList) {
      setError('Salve a lista antes de gerar um link compartilhável.');
      return;
    }

    setIsSharing(true);

    try {
      const sharedList = await shareList(editingList.id);
      if (sharedList.shareUrl && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sharedList.shareUrl);
        setShareMessage('Link copiado.');
      } else if (sharedList.shareUrl) {
        setShareMessage(sharedList.shareUrl);
      } else {
        setShareMessage('Link público gerado para esta lista.');
      }
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : 'Não foi possível compartilhar a lista.',
      );
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    if (!editingList) {
      return;
    }

    setName(editingList.name);
    setSelectedCityId(editingList.cityId);
    setMode(editingList.lastMode);
    setItems(buildEditableItems(editingList));
  }, [editingList]);

  useEffect(() => {
    let disposed = false;

    const loadCatalog = async () => {
      setIsSearchingCatalog(true);
      try {
        const results = await searchCatalogProducts(draftName.trim());
        if (!disposed) {
          setCatalogResults(results);
        }
      } catch {
        if (!disposed) {
          setCatalogResults([]);
        }
      } finally {
        if (!disposed) {
          setIsSearchingCatalog(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      disposed = true;
    };
  }, [draftName]);

  const addItem = (product = selectedCatalogProduct) => {
    if (!product) {
      return;
    }

    const displayName =
      draftBrandPreferenceMode === 'exact' && selectedVariant
        ? `${selectedVariant.brandName ? `${selectedVariant.brandName} · ` : ''}${selectedVariant.displayName}`
        : product.name;
    setItems((current) => [
      ...current,
      {
        id: `draft-${Date.now()}`,
        name: displayName,
        catalogProductId: product.id,
        lockedProductVariantId:
          draftBrandPreferenceMode === 'exact'
            ? selectedVariantId || undefined
            : undefined,
        brandPreferenceMode: draftBrandPreferenceMode,
        preferredBrandNames: [],
        imageUrl:
          selectedVariant?.imageUrl ??
          getCatalogProductPreviewImage(product) ??
          undefined,
        quantity: Number.isFinite(Number(draftQuantity))
          ? Number(draftQuantity)
          : 1,
        unitLabel: draftUnit.trim() || 'un',
        purchaseStatus: 'pending',
        note: draftNote.trim() || undefined,
      },
    ]);
    setDraftName('');
    setDraftQuantity('1');
    setDraftUnit('un');
    setDraftNote('');
    setDraftBrandPreferenceMode('any');
    setSelectedCatalogProduct(null);
    setSelectedVariantId('');
    setSelectedVariants([]);
    setIsBrandDialogOpen(false);
  };

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await persistList(false);
  };

  return (
    <RequireAuthentication
      description="Entre para editar listas e manter tudo sincronizado no mobile."
      title="Edição protegida"
    >
      <form
        className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_340px]"
        onSubmit={handleSave}
      >
        <aside className="hidden border-r border-border/70 pr-4 lg:grid lg:content-start lg:gap-6">
          <Button asChild className="w-fit px-0" size="sm" variant="link">
            <Link to="/">
              <ChevronRightIcon className="size-4 rotate-180" />
              Voltar para início
            </Link>
          </Button>
          <div className="grid gap-3">
            <div className="text-sm font-medium">Sua lista</div>
            <div className="rounded-lg bg-primary/10 p-3 text-sm">
              <div className="font-medium">{name || 'Compra da semana'}</div>
              <div className="text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/listas/nova">Nova lista</Link>
            </Button>
          </div>
        </aside>

        <section className="grid min-w-0 gap-4">
          <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {editingList ? 'Editar lista' : 'Nova lista'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Monte sua lista com regras de marca e quantidade.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </span>
              <WithTooltip
                label={
                  editingList
                    ? 'Gera um link público somente leitura e copia para a área de transferência.'
                    : 'Salve a lista antes de gerar um link público.'
                }
              >
                <span className="inline-flex">
                  <Button
                    aria-label="Compartilhar lista"
                    disabled={!editingList || isSharing}
                    onClick={handleShare}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ArrowRightIcon className="size-4 rotate-[-35deg]" />
                  </Button>
                </span>
              </WithTooltip>
              <WithTooltip label="Remove todos os itens desta lista antes de salvar.">
                <span className="inline-flex">
                  <Button
                    aria-label="Remover itens"
                    disabled={items.length === 0}
                    onClick={() => setItems([])}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ClipboardListIcon className="size-4" />
                  </Button>
                </span>
              </WithTooltip>
            </div>
          </div>

          {shareMessage ? (
            <Alert>
              <Share2Icon className="size-4" />
              <AlertTitle>Lista compartilhável</AlertTitle>
              <AlertDescription>{shareMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="list-name">Título da lista</FieldLabel>
            <div className="relative">
              <Input
                className="pr-16"
                id="list-name"
                maxLength={60}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                {name.length}/60
              </span>
            </div>
          </Field>

          <div className="sr-only">
            <Field>
              <FieldLabel htmlFor="list-city">Cidade</FieldLabel>
              <select
                id="list-city"
                onChange={(event) => setSelectedCityId(event.target.value)}
                value={selectedCityId}
              >
                <option value="">Selecione a cidade da lista</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} - {city.activeStoreCount} estabelecimentos
                    ativos
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Itens da lista</h2>
              {selectedCity ? (
                <StatusBadge tone="location">
                  {selectedCity.name} · {selectedCity.activeStoreCount} lojas
                </StatusBadge>
              ) : null}
            </div>

            {items.length === 0 ? (
              <ActionPlaceholder
                icon={<ListIcon className="size-5" />}
                title="Adicione o primeiro produto"
                description="Busque arroz, leite, café ou outro item recorrente. A lista precisa de produtos para liberar comparação de preços e checklist."
                primaryAction={<a href="#draft-item-name">Buscar produto</a>}
                secondaryAction={<Link to="/ofertas">Ver ofertas</Link>}
              />
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 md:grid-cols-[72px_minmax(0,1fr)_240px]"
                  >
                    <img
                      alt={item.name}
                      className="size-20 rounded-md border border-border/70 object-cover"
                      src={resolveProductImage(item.imageUrl)}
                    />
                    <div className="grid gap-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {describeBrandRule(
                            item,
                            item.brandPreferenceMode === 'exact'
                              ? item.name
                              : undefined,
                          )}
                        </div>
                      </div>
                      <StatusBadge tone="savings" className="w-fit">
                        {item.brandPreferenceMode === 'exact'
                          ? 'Variante exata'
                          : item.brandPreferenceMode === 'preferred'
                            ? 'Marcas preferidas'
                            : 'Boa correspondência'}
                      </StatusBadge>
                      {item.note ? (
                        <div className="rounded-md border border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] px-3 py-2 text-xs text-[var(--ds-warning)]">
                          {item.note}
                        </div>
                      ) : null}
                    </div>
                    <div className="grid content-start gap-3">
                      <Field>
                        <FieldLabel>Quantidade</FieldLabel>
                        <div className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-2">
                          <Button
                            onClick={() =>
                              setItems((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        quantity: Math.max(
                                          1,
                                          entry.quantity - 1,
                                        ),
                                      }
                                    : entry,
                                ),
                              )
                            }
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            -
                          </Button>
                          <span className="tabular-nums">{item.quantity}</span>
                          <Button
                            onClick={() =>
                              setItems((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        quantity: entry.quantity + 1,
                                      }
                                    : entry,
                                ),
                              )
                            }
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            +
                          </Button>
                        </div>
                      </Field>
                      <Field>
                        <FieldLabel>Regra de marca</FieldLabel>
                        <select
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          onChange={(event) =>
                            setItems((current) =>
                              current.map((entry) =>
                                entry.id === item.id
                                  ? {
                                      ...entry,
                                      brandPreferenceMode: event.target
                                        .value as EditableListItem['brandPreferenceMode'],
                                    }
                                  : entry,
                              ),
                            )
                          }
                          value={item.brandPreferenceMode}
                        >
                          <option value="any">Qualquer variante</option>
                          <option value="preferred">Marcas preferidas</option>
                          <option value="exact">Variante exata</option>
                        </select>
                      </Field>
                      <Button
                        onClick={() => removeItem(item.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="rounded-lg border border-dashed border-border/80 bg-background/70 p-5 text-center text-sm font-medium text-primary"
            onClick={() => {
              document.getElementById('draft-item-name')?.focus();
            }}
            type="button"
          >
            + Adicionar item da lista
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Busque no catálogo ou adicione manualmente
            </span>
          </button>

          <div className="sticky bottom-3 z-20 rounded-lg border border-border/70 bg-card/95 p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                disabled={
                  isSaving ||
                  !selectedCityId ||
                  items.length === 0 ||
                  !name.trim()
                }
                onClick={() => void persistList(false)}
                type="button"
                variant="outline"
              >
                {isSaving ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
              <Button
                disabled={
                  isSaving ||
                  !selectedCityId ||
                  items.length === 0 ||
                  !name.trim()
                }
                onClick={() => void persistList(true)}
                type="button"
              >
                {isSaving ? 'Salvando...' : 'Salvar e otimizar'}
              </Button>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4 border-l border-border/70 pl-0 lg:pl-4">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
            <div>
              <h2 className="font-semibold">Buscar produtos</h2>
              <p className="text-xs text-muted-foreground">
                Produtos comparáveis
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <Field>
              <FieldLabel htmlFor="draft-item-name">Produto</FieldLabel>
              <Input
                id="draft-item-name"
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Ex.: leite integral"
                value={draftName}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="draft-item-quantity">Qtd.</FieldLabel>
                <Input
                  id="draft-item-quantity"
                  min="1"
                  onChange={(event) => setDraftQuantity(event.target.value)}
                  step="1"
                  type="number"
                  value={draftQuantity}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="draft-item-unit">Unidade</FieldLabel>
                <Input
                  id="draft-item-unit"
                  onChange={(event) => setDraftUnit(event.target.value)}
                  placeholder="un, kg, 500 g"
                  value={draftUnit}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="draft-item-note">
                Observação opcional
              </FieldLabel>
              <Textarea
                id="draft-item-note"
                onChange={(event) => setDraftNote(event.target.value)}
                placeholder="Preferências, cortes, tamanho ou substituições."
                value={draftNote}
              />
            </Field>
          </div>

          <div className="grid gap-3">
            {isSearchingCatalog ? (
              <div className="rounded-lg border border-dashed border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                Buscando produtos comparáveis...
              </div>
            ) : null}
            {catalogResults.length === 0 && !isSearchingCatalog ? (
              <ActionPlaceholder
                className="bg-background/80"
                icon={<SearchIcon className="size-5" />}
                title="Nenhum produto comparável encontrado"
                description="Revise o nome ou solicite o produto para o catálogo antes de adicioná-lo à lista otimizada."
                primaryAction={
                  <a href="#draft-item-name">Revisar busca</a>
                }
                secondaryAction={<Link to="/notas">Enviar nota com produto</Link>}
              />
            ) : null}
            {catalogResults.map((product, index) => {
              const isSelected = selectedCatalogProduct?.id === product.id;

              return (
                <div
                  className={`grid gap-3 rounded-lg border p-3 ${
                    isSelected || index === 0
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/70 bg-card'
                  }`}
                  key={product.id}
                >
                  <div className="flex gap-3">
                    <img
                      alt={product.name}
                      className="size-14 rounded-md border border-border/70 object-cover"
                      src={resolveProductImage(
                        getCatalogProductPreviewImage(product),
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.category}
                      </div>
                      <div className="mt-1 text-xs text-[var(--ds-savings)]">
                        {Math.max(72, 99 - index * 5)}% correspondência
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={async () => {
                        setSelectedCatalogProduct(product);
                        setSelectedVariantId('');
                        const variants = await fetchCatalogProductVariants(
                          product.id,
                        );
                        setSelectedVariants(variants);
                        setIsBrandDialogOpen(true);
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Configurar
                    </Button>
                    <Button
                      onClick={async () => {
                        setSelectedCatalogProduct(product);
                        if (selectedCatalogProduct?.id !== product.id) {
                          setSelectedVariantId('');
                          setSelectedVariants(
                            await fetchCatalogProductVariants(product.id),
                          );
                        }
                        addItem(product);
                      }}
                      size="sm"
                      type="button"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button
              onClick={() => setIsMissingProductDialogOpen(true)}
              type="button"
              variant="outline"
            >
              Adicionar produto não encontrado
            </Button>
            {missingProductMessage ? (
              <p className="text-sm text-[var(--ds-savings)]">
                {missingProductMessage}
              </p>
            ) : null}
          </div>
        </aside>

        <Dialog
          open={isMissingProductDialogOpen}
          onOpenChange={setIsMissingProductDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar produto ao catalogo</DialogTitle>
              <DialogDescription>
                A equipe revisara o item e podera transforma-lo em um produto
                comparavel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="missing-product-name">Produto</FieldLabel>
                <Input
                  id="missing-product-name"
                  onChange={(event) => setDraftName(event.target.value)}
                  value={draftName}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="missing-product-category">
                  Categoria sugerida
                </FieldLabel>
                <Input
                  id="missing-product-category"
                  onChange={(event) =>
                    setMissingProductCategory(event.target.value)
                  }
                  placeholder="Ex.: mercearia"
                  value={missingProductCategory}
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsMissingProductDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                disabled={!accessToken || draftName.trim().length < 2}
                onClick={async () => {
                  if (!accessToken) {
                    setError('Entre na conta para solicitar um produto.');
                    return;
                  }
                  try {
                    await requestMissingProduct(accessToken, {
                      requestedName: draftName.trim(),
                      categoryHint: missingProductCategory.trim() || undefined,
                      packageHint: draftUnit.trim() || undefined,
                      notes: draftNote.trim() || undefined,
                    });
                    setMissingProductMessage(
                      'Solicitacao enviada para revisao do catalogo.',
                    );
                    setIsMissingProductDialogOpen(false);
                  } catch (requestError) {
                    setError(
                      requestError instanceof Error
                        ? requestError.message
                        : 'Nao foi possivel enviar a solicitacao.',
                    );
                  }
                }}
                type="button"
              >
                Enviar solicitacao
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar marca</DialogTitle>
              <DialogDescription>
                Defina se este item aceita qualquer variante ou exige uma
                variante exata.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <Field>
                <FieldLabel>Regra de marca</FieldLabel>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  onChange={(event) =>
                    setDraftBrandPreferenceMode(
                      event.target.value as 'any' | 'exact',
                    )
                  }
                  value={draftBrandPreferenceMode}
                >
                  <option value="any">Qualquer variante</option>
                  <option value="exact">Somente variante exata</option>
                </select>
              </Field>
              {draftBrandPreferenceMode === 'exact' ? (
                <div className="grid gap-3">
                  <Field>
                    <FieldLabel>Variante exata</FieldLabel>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      onChange={(event) =>
                        setSelectedVariantId(event.target.value)
                      }
                      value={selectedVariantId}
                    >
                      <option value="">Selecione a variante</option>
                      {selectedVariants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.brandName ? `${variant.brandName} - ` : ''}
                          {variant.displayName}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {selectedVariant ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                      <img
                        alt={selectedExactVariantLabel}
                        className="h-14 w-14 rounded-lg border border-border/70 object-cover"
                        src={resolveProductImage(selectedVariant.imageUrl)}
                      />
                      <div className="grid gap-1">
                        <span className="text-sm font-medium">
                          {selectedExactVariantLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Variante exata selecionada
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBrandDialogOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error ? (
          <Alert className="lg:col-span-3" variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>Falha ao salvar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </form>
    </RequireAuthentication>
  );
}

export function OptimizationPage() {
  const { listId = '' } = useParams();
  const {
    lists,
    optimizationResults,
    loadLatestOptimization,
    preferredMode,
    runOptimization,
    setPreferredMode,
    shareList,
  } = usePricely();
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSharingResult, setIsSharingResult] = useState(false);
  const [latestLoadAttemptedFor, setLatestLoadAttemptedFor] = useState<
    string | null
  >(null);
  const [activeResultTab, setActiveResultTab] =
    useState<OptimizationResultTab>('optimized');
  const [itemFilter, setItemFilter] =
    useState<OptimizationItemFilter>('all');
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<
    Record<string, boolean>
  >({});
  const list = lists.find((entry) => entry.id === listId);
  const result = optimizationResults[listId];
  const activeMode = result?.mode ?? list?.lastMode ?? preferredMode;
  const listItemsById = new Map(
    list?.items.map((item) => [item.id, item]) ?? [],
  );
  const isProcessingResult =
    result?.status === 'queued' || result?.status === 'running';
  const isStaleProcessing =
    isProcessingResult &&
    Date.now() - new Date(result.createdAt).getTime() > 30_000;
  const selectedSelections =
    result?.selections.filter(
      (selection) => selection.selectionStatus === 'selected',
    ) ?? [];
  const reviewSelections =
    result?.selections.filter(
      (selection) => selection.selectionStatus !== 'selected',
    ) ?? [];
  const storePlan = Array.from(
    selectedSelections
      .reduce(
        (stores, selection) => {
          const key = selection.establishmentName ?? 'Sem loja definida';
          const current = stores.get(key) ?? {
            name: key,
            neighborhood: selection.establishmentNeighborhood,
            mapUrl: buildEstablishmentMapUrl(selection),
            items: 0,
            total: 0,
          };
          current.items += 1;
          current.total +=
            selection.priceAmount ?? selection.estimatedCost ?? 0;
          stores.set(key, current);
          return stores;
        },
        new Map<
          string,
          {
            name: string;
            neighborhood?: string;
            mapUrl?: string;
            items: number;
            total: number;
          }
        >(),
      )
      .values(),
  );

  useEffect(() => {
    if (!list || result || latestLoadAttemptedFor === listId) {
      return;
    }

    setLatestLoadAttemptedFor(listId);
    void loadLatestOptimization(listId);
  }, [latestLoadAttemptedFor, list, listId, loadLatestOptimization, result]);

  const handleRun = async (mode: OptimizationModeId) => {
    setError(null);
    setIsRunning(true);

    try {
      setPreferredMode(mode);
      await runOptimization(listId, mode);
    } catch (runError) {
      setError(toOptimizationError(runError));
    } finally {
      setIsRunning(false);
    }
  };

  const handleShareResult = async () => {
    if (!list) {
      return;
    }

    setError(null);
    setIsSharingResult(true);

    try {
      const sharedList = await shareList(list.id);
      if (sharedList.shareUrl && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sharedList.shareUrl);
      }
    } catch (shareError) {
      setError({
        title: 'Não foi possível compartilhar',
        description:
          shareError instanceof Error
            ? shareError.message
            : 'Tente novamente em instantes.',
      });
    } finally {
      setIsSharingResult(false);
    }
  };
  const city = list ? getCityById(list.cityId) : undefined;
  const optimizedItemCount = selectedSelections.length;
  const totalItemCount = result?.selections.length ?? list?.items.length ?? 0;
  const visibleResultSelections =
    result?.selections.filter((selection) => {
      if (activeResultTab === 'optimized') {
        if (itemFilter === 'selected') {
          return selection.selectionStatus === 'selected';
        }

        if (itemFilter === 'review') {
          return selection.selectionStatus !== 'selected';
        }

        return true;
      }

      if (activeResultTab === 'unavailable') {
        return selection.selectionStatus !== 'selected';
      }

      return true;
    }) ?? [];
  const resultTabs: Array<{
    id: OptimizationResultTab;
    label: string;
    count?: number;
  }> = [
    {
      id: 'optimized',
      label: 'Itens da lista',
      count: totalItemCount,
    },
    {
      id: 'unavailable',
      label: 'Indisponíveis',
      count: reviewSelections.length,
    },
    {
      id: 'stores',
      label: 'Resumo por loja',
      count: storePlan.length,
    },
    {
      id: 'savings',
      label: 'Análise de economia',
    },
  ];
  const filterLabel =
    itemFilter === 'selected'
      ? 'Selecionados'
      : itemFilter === 'review'
        ? 'Revisar'
        : 'Todos os itens';
  const firstSelectedSelection = selectedSelections[0];
  const routeDistanceKm = selectedSelections.reduce(
    (total, selection) => total + (selection.distanceKm ?? 0),
    0,
  );
  const completedAtLabel = result?.completedAt ?? result?.createdAt;

  return (
    <RequireAuthentication
      description="Entre para processar sua lista e manter os resultados sincronizados."
      title="Otimização protegida"
    >
      {!list ? (
        <Alert variant="destructive">
          <ShieldAlertIcon />
          <AlertTitle>Lista não encontrada</AlertTitle>
          <AlertDescription>
            Escolha uma lista válida para rodar a otimização.
          </AlertDescription>
        </Alert>
      ) : (
        <div
          className={
            result && !isProcessingResult
              ? '-my-6 grid min-h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-none border-y border-border/70 bg-background lg:grid-cols-[minmax(0,1fr)_300px]'
              : 'flex flex-col gap-6'
          }
        >
          <main
            className={
              result && !isProcessingResult
                ? 'min-w-0 overflow-hidden bg-background'
                : 'contents'
            }
          >
            {result && !isProcessingResult ? (
              <div className="border-b border-border/70 bg-card/95 px-4 py-3 lg:px-6">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <StatusBadge tone="location">
                      <MapPinIcon className="size-3.5" />
                      {city?.name ?? 'Cidade'} - SP
                    </StatusBadge>
                    <span className="text-muted-foreground">
                      Localização salva
                    </span>
                    <span className="text-muted-foreground">raio de 5 km</span>
                    <StatusBadge tone="savings">
                      <CheckCircle2Icon className="size-3.5" />
                      Cobertura ativa
                    </StatusBadge>
                    <span className="text-muted-foreground">
                      {storePlan.length + 6} lojas ativas no raio
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <WithTooltip label="Alertas sobre preço, cobertura e revisão desta otimização aparecerão aqui.">
                      <Button
                        aria-label="Notificações"
                        size="icon"
                        variant="ghost"
                      >
                        <BellIcon className="size-4" />
                      </Button>
                    </WithTooltip>
                    <div className="hidden items-center gap-3 sm:flex">
                      <div className="grid size-9 place-items-center rounded-full bg-[var(--ds-warning-soft)] text-sm font-semibold text-[var(--ds-warning)]">
                        M
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Mariana Silva</div>
                        <div className="text-xs text-muted-foreground">
                          Cliente
                        </div>
                      </div>
                      <ChevronDownIcon className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={
                result && !isProcessingResult
                  ? 'grid gap-4 p-4 lg:p-6'
                  : 'grid gap-6'
              }
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid gap-2">
                  {result && !isProcessingResult ? (
                    <Button
                      asChild
                      className="w-fit px-0"
                      size="sm"
                      variant="link"
                    >
                      <Link to={`/listas/${list.id}`}>
                        <ChevronRightIcon className="size-4 rotate-180" />
                        Voltar para a lista
                      </Link>
                    </Button>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight">
                      Resultado da otimização
                    </h1>
                    {result && !isProcessingResult ? (
                      <StatusBadge tone="savings">
                        <CheckCircle2Icon className="size-3.5" />
                        Salvo
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground">
                    Lista: {list.name}
                    {completedAtLabel
                      ? ` · Otimizado em ${formatDateTime(completedAtLabel)}`
                      : ` - ${city?.name ?? 'cidade selecionada'}. Compare o melhor total, a cobertura e a economia estimada da sua compra.`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Recomendação pronta para virar checklist
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    disabled={isRunning}
                    onClick={() => handleRun(activeMode)}
                    variant="outline"
                  >
                    <RefreshCwIcon className="size-4" />
                    Recalcular
                  </Button>
                  <InfoTooltip
                    label="Recalcula a lista com preços, cobertura e regras atuais da cidade selecionada."
                    triggerLabel="Como funciona o recálculo"
                  />
                  <Button asChild>
                    <Link to={`/listas/${list.id}/checklist`}>
                      <ListChecksIcon className="size-4" />
                      Abrir checklist
                    </Link>
                  </Button>
                </div>
              </div>

              {result && !isProcessingResult ? (
                <>
                  <div className="grid overflow-hidden rounded-lg border border-border/70 bg-card md:grid-cols-5">
                    {[
                      {
                        label: 'Custo estimado total',
                        value: (
                          <MaskedMoney
                            value={formatCurrency(
                              result.totalEstimatedCost ?? 0,
                            )}
                          />
                        ),
                        detail: undefined,
                        accent: 'text-primary',
                      },
                      {
                        label: 'Economia estimada',
                        value: (
                          <MaskedMoney
                            value={formatCurrency(result.estimatedSavings ?? 0)}
                          />
                        ),
                        detail: 'vs. próximas alternativas elegíveis',
                        accent: 'text-[var(--ds-savings)]',
                      },
                      {
                        label: 'Cobertura dos itens',
                        value: `${optimizedItemCount} de ${Math.max(
                          totalItemCount,
                          optimizedItemCount,
                        )}`,
                        detail: coverageStatusLabel(result.coverageStatus),
                        accent: 'text-foreground',
                      },
                      {
                        label: 'Lojas no raio',
                        value: String(storePlan.length + 6),
                        detail: 'até 5 km',
                        accent: 'text-foreground',
                      },
                      {
                        label: 'Paradas recomendadas',
                        value: String(storePlan.length),
                        detail: 'trajeto otimizado',
                        accent: 'text-foreground',
                      },
                    ].map((metric) => (
                      <div
                        className="grid gap-2 border-b border-border/70 p-4 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
                        key={metric.label}
                      >
                        <div className="text-xs text-muted-foreground">
                          {metric.label}
                        </div>
                        <div
                          className={`text-2xl font-semibold tabular-nums ${metric.accent}`}
                        >
                          {metric.value}
                        </div>
                        {metric.detail ? (
                          <div className="text-xs text-muted-foreground">
                            {metric.detail}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 rounded-lg border border-border/70 bg-card p-4 md:grid-cols-4">
                    <div className="flex gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <MapPinIcon className="size-5" />
                      </span>
                      <div className="grid gap-1 text-sm">
                        <div className="text-xs text-primary">
                          Modo selecionado
                        </div>
                        <div className="font-medium">
                          {optimizationModeCopy[activeMode].title}
                        </div>
                        <div className="text-muted-foreground">
                          {optimizationModeCopy[activeMode].summary}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      <div className="text-xs text-primary">
                        Cobertura local
                      </div>
                      <div className="font-medium">
                        {storePlan.length + 6} lojas dentro de 5 km
                      </div>
                      <div className="h-16 rounded-md bg-[radial-gradient(circle_at_45%_45%,var(--ds-primary)_0_4px,transparent_5px),radial-gradient(circle_at_68%_35%,var(--ds-savings)_0_3px,transparent_4px),radial-gradient(circle_at_58%_70%,var(--ds-info)_0_3px,transparent_4px),linear-gradient(135deg,var(--ds-primary-soft),transparent)] opacity-80" />
                    </div>
                    <div className="grid gap-1 text-sm">
                      <div className="text-xs text-primary">
                        Precisão dos preços
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <ShieldAlertIcon className="size-4 text-[var(--ds-savings)]" />
                        Alta
                      </div>
                      <div className="text-muted-foreground">
                        {optimizedItemCount} itens com confiança alta
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      <div className="text-xs text-[var(--ds-warning)]">
                        Avisos
                      </div>
                      <div className="font-medium">
                        {reviewSelections.length} item indisponível
                      </div>
                      <div className="text-muted-foreground">
                        Ver detalhes abaixo
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70">
                    <div className="flex gap-4 overflow-x-auto text-sm">
                      {resultTabs.map((tab) => (
                        <button
                          className={`whitespace-nowrap border-b-2 px-2 py-3 font-medium ${
                            activeResultTab === tab.id
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted-foreground'
                          }`}
                          key={tab.id}
                          onClick={() => setActiveResultTab(tab.id)}
                          type="button"
                        >
                          {tab.count === undefined
                            ? tab.label
                            : `${tab.label} (${tab.count})`}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      Exibir:
                      <select
                        className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                        onChange={(event) =>
                          setItemFilter(
                            event.target.value as OptimizationItemFilter,
                          )
                        }
                        value={itemFilter}
                      >
                        <option value="all">Todos os itens</option>
                        <option value="selected">Selecionados</option>
                        <option value="review">Revisar</option>
                      </select>
                      <span className="sr-only">{filterLabel}</span>
                    </label>
                  </div>

                  {activeResultTab === 'stores' ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Resumo por loja</CardTitle>
                        <CardDescription>
                          Paradas sugeridas, quantidade de itens e subtotal
                          previsto por estabelecimento.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        {storePlan.map((store) => (
                          <div
                            className="grid gap-2 rounded-lg border border-border/70 bg-background/80 p-3"
                            key={store.name}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{store.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {store.neighborhood ?? 'Bairro não informado'}
                                </div>
                              </div>
                              <StatusBadge tone="location">
                                {store.items}{' '}
                                {store.items === 1 ? 'item' : 'itens'}
                              </StatusBadge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Subtotal previsto:{' '}
                              <span className="font-medium tabular-nums text-foreground">
                                <MaskedMoney
                                  value={formatCurrency(store.total)}
                                />
                              </span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : activeResultTab === 'savings' ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Análise de economia</CardTitle>
                        <CardDescription>
                          Economia estimada contra alternativas elegíveis e
                          cobertura atual da lista.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-3">
                        <PriceRow
                          title="Economia estimada"
                          subtitle="Comparada com próximas alternativas elegíveis"
                          price={
                            <MaskedMoney
                              value={formatCurrency(
                                result.estimatedSavings ?? 0,
                              )}
                            />
                          }
                        />
                        <PriceRow
                          title="Custo estimado"
                          subtitle={coverageStatusLabel(result.coverageStatus)}
                          price={
                            <MaskedMoney
                              value={formatCurrency(
                                result.totalEstimatedCost ?? 0,
                              )}
                            />
                          }
                        />
                        <PriceRow
                          title="Itens com oferta"
                          subtitle={`${reviewSelections.length} para revisar`}
                          price={`${optimizedItemCount} de ${Math.max(
                            totalItemCount,
                            optimizedItemCount,
                          )}`}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="hidden grid-cols-[1.1fr_1fr_0.55fr_1fr] gap-4 px-4 text-xs text-muted-foreground md:grid">
                    <span>
                      Item solicitado
                      <br />
                      Regra de marca
                    </span>
                    <span>
                      Selecionado
                      <br />
                      Loja
                    </span>
                    <span>
                      Preço
                      <br />
                      Unitário
                    </span>
                    <span>
                      Confiança da oferta
                      <br />
                      Fonte e validade
                    </span>
                      </div>

                      <div className="grid gap-0 overflow-hidden rounded-lg border border-border/70 bg-card">
                        {visibleResultSelections.map((selection, index) => {
                      const listItem = listItemsById.get(
                        selection.shoppingListItemId,
                      );
                      const evidenceKey = `${selection.shoppingListItemId}-${selection.id ?? selection.shoppingListItemName}`;
                      const isEvidenceExpanded =
                        expandedEvidenceIds[evidenceKey] ?? index === 0;
                      const imageUrl =
                        selection.selectedVariantImageUrl ?? listItem?.imageUrl;
                      const selectedVariantLabel = selection.selectedVariantName
                        ? formatVariantWithPackage(
                            selection.selectedVariantName,
                            selection.selectedPackageLabel,
                          )
                        : undefined;
                      const confidenceLabel =
                        selection.trustLevel === 'high'
                          ? 'Alta'
                          : selection.trustLevel === 'medium'
                            ? 'Média'
                            : 'Revisar';

                      return (
                        <div
                          className={`grid gap-4 border-b border-border/70 p-4 last:border-b-0 ${
                            index === 0 && activeResultTab === 'optimized'
                              ? 'border-primary/70 bg-primary/5 ring-1 ring-primary/40'
                              : 'bg-card'
                          }`}
                          key={evidenceKey}
                        >
                          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr_0.55fr_1fr]">
                            <div className="flex gap-3">
                              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-border/70 bg-muted">
                                {imageUrl ? (
                                  <img
                                    alt={selection.shoppingListItemName}
                                    className="size-full object-cover"
                                    src={resolveProductImage(imageUrl)}
                                  />
                                ) : (
                                  <ShoppingCartIcon className="size-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="grid gap-1 text-sm">
                                <div className="font-medium">
                                  {selection.shoppingListItemName}
                                </div>
                                <div className="text-muted-foreground">
                                  Qtd: {listItem?.quantity ?? 1} un
                                  {listItem?.unitLabel
                                    ? ` (${listItem.unitLabel})`
                                    : ''}
                                </div>
                                <StatusBadge tone="savings" className="w-fit">
                                  {describeBrandRule(
                                    listItem ?? {
                                      brandPreferenceMode: 'any',
                                      preferredBrandNames: [],
                                    },
                                    listItem?.brandPreferenceMode === 'exact'
                                      ? listItem.name
                                      : undefined,
                                  )}
                                </StatusBadge>
                              </div>
                            </div>
                            <div className="grid gap-1 text-sm">
                              <div className="font-medium">
                                {selectedVariantLabel
                                  ? `Selecionado: ${selectedVariantLabel}`
                                  : 'Selecionado: variante em revisão'}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge family="queue" status="completed">
                                  {selectionStatusLabel(
                                    selection.selectionStatus,
                                  )}
                                </StatusBadge>
                                {decisionReasonLabel(
                                  selection.decisionReason,
                                ) ? (
                                  <StatusBadge tone="neutral">
                                    {decisionReasonLabel(
                                      selection.decisionReason,
                                    )}
                                  </StatusBadge>
                                ) : null}
                              </div>
                              <div>
                                {selection.establishmentName ??
                                  'Sem loja definida'}
                              </div>
                              <div className="text-muted-foreground">
                                {selection.establishmentNeighborhood ??
                                  'Bairro não informado'}
                              </div>
                              {selection.distanceKm !== undefined ? (
                                <div className="text-muted-foreground">
                                  {selection.distanceKm.toFixed(1)} km do local
                                  salvo
                                </div>
                              ) : null}
                            </div>
                            <div className="grid gap-1 text-sm">
                              <div className="text-lg font-semibold tabular-nums">
                                <MaskedMoney
                                  value={formatCurrency(
                                    selection.priceAmount ??
                                      selection.estimatedCost ??
                                      0,
                                  )}
                                />
                              </div>
                              <div className="text-muted-foreground">cada</div>
                              {selection.savingsVsComparison &&
                              selection.savingsVsComparison > 0 ? (
                                <div className="text-xs text-muted-foreground">
                                  {savingsComparisonLabel(selection)}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex items-start justify-between gap-3 text-sm">
                              <div className="grid gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <StatusBadge tone="savings">
                                    {confidenceLabel}
                                  </StatusBadge>
                                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                    score {selection.trustFactor ?? 0}
                                  </span>
                                </div>
                                <div className="text-muted-foreground">
                                  {selection.sourceLabel ??
                                    'Origem operacional'}
                                </div>
                                <div className="text-muted-foreground">
                                  {selection.trustEvidenceCount ?? 0} notas
                                  fiscais aceitas
                                </div>
                                {selection.observedAt ? (
                                  <div className="text-muted-foreground">
                                    {formatFreshnessLabel(selection.observedAt)}
                                  </div>
                                ) : null}
                              </div>
                              <Button
                                onClick={() =>
                                  setExpandedEvidenceIds((current) => ({
                                    ...current,
                                    [evidenceKey]: !isEvidenceExpanded,
                                  }))
                                }
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {isEvidenceExpanded
                                  ? 'Ocultar evidência'
                                  : 'Ver evidência'}
                              </Button>
                            </div>
                          </div>
                          {isEvidenceExpanded ? (
                            <div className="rounded-md border border-border/70 bg-background p-3">
                              <ShopperEvidenceModule
                                listId={list.id}
                                selection={selection}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                      </div>
                    </>
                  )}

                  {reviewSelections.length > 0 &&
                  activeResultTab === 'unavailable' &&
                  visibleResultSelections.length === 0 ? (
                    <Card className="border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)]/40">
                      <CardHeader>
                        <CardTitle>Itens sem confirmação completa</CardTitle>
                        <CardDescription>
                          Revise antes de comprar ou envie nota fiscal para
                          melhorar a cobertura da cidade.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        {reviewSelections.map((selection) => (
                          <PriceRow
                            key={`${selection.shoppingListItemId}-review`}
                            title={selection.shoppingListItemName}
                            subtitle={
                              selection.rejectedReason
                                ? rejectedReasonLabel(selection.rejectedReason)
                                : 'Sem oferta confirmada suficiente'
                            }
                            price={
                              selection.priceAmount !== undefined
                                ? (
                                    <MaskedMoney
                                      value={formatCurrency(
                                        selection.priceAmount,
                                      )}
                                    />
                                  )
                                : 'Sem preço'
                            }
                            meta={
                              <StatusBadge
                                family="queue"
                                status={
                                  selection.selectionStatus === 'review'
                                    ? 'retrying'
                                    : 'failed'
                                }
                              >
                                {selectionStatusLabel(
                                  selection.selectionStatus,
                                )}
                              </StatusBadge>
                            }
                            actions={
                              <Button asChild size="sm" variant="outline">
                                <Link to="/notas">Enviar nota</Link>
                              </Button>
                            }
                          />
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}

                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <InfoIcon className="size-4 text-primary" />
                    Preços e ofertas baseados em notas fiscais validadas e
                    origem operacional. Mais dados = mais economia para você.
                  </p>
                </>
              ) : (
                <>
                  <NextBestActionStrip
                    title={
                      result && !isProcessingResult
                        ? 'Recomendação pronta para virar checklist'
                        : 'Escolha um modo para comparar a lista'
                    }
                    description={
                      result && !isProcessingResult
                        ? 'Leve a recomendação para o mercado, marque o que comprou e reporte qualquer preço diferente.'
                        : 'O resultado mostra preço, loja, fonte e confiança antes de você começar a compra.'
                    }
                    primaryAction={{
                      label:
                        result && !isProcessingResult
                          ? 'Abrir checklist'
                          : 'Manter modo recomendado',
                      to:
                        result && !isProcessingResult
                          ? `/listas/${list.id}/checklist`
                          : '#optimization-modes',
                    }}
                    secondaryAction={{ label: 'Enviar nota', to: '/notas' }}
                    steps={[
                      { label: 'Lista', status: 'done' },
                      {
                        label: 'Otimização',
                        status:
                          result && !isProcessingResult
                            ? 'done'
                            : isProcessingResult
                              ? 'current'
                              : 'current',
                      },
                      {
                        label: 'Checklist',
                        status:
                          result && !isProcessingResult ? 'current' : 'pending',
                      },
                      { label: 'Nota fiscal', status: 'pending' },
                    ]}
                  />

                  <Card id="optimization-modes">
                    <CardHeader>
                      <CardTitle>Escolha o modo</CardTitle>
                      <CardDescription>
                        Cada modo comunica um equilíbrio diferente entre
                        deslocamento, cobertura e menor total.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 lg:grid-cols-3">
                      {optimizationModes.map((mode) => (
                        <button
                          key={mode.id}
                          className={`grid gap-3 rounded-lg border p-4 text-left transition-colors ${
                            activeMode === mode.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border/70 bg-card hover:border-primary/50'
                          }`}
                          disabled={isRunning}
                          onClick={() => handleRun(mode.id)}
                          type="button"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">
                              {optimizationModeCopy[mode.id].title}
                            </span>
                            {activeMode === mode.id ? (
                              <BadgeCheckIcon className="text-primary" />
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {optimizationModeCopy[mode.id].summary}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {optimizationModeCopy[mode.id].tradeoff}
                          </p>
                          <span className="text-sm font-medium">
                            {isRunning && activeMode === mode.id
                              ? 'Processando...'
                              : 'Usar este modo'}
                          </span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {error ? (
                    <Alert variant="destructive">
                      <ShieldAlertIcon />
                      <AlertTitle>{error.title}</AlertTitle>
                      <AlertDescription>{error.description}</AlertDescription>
                    </Alert>
                  ) : null}

                  {isProcessingResult ? (
                    <Alert>
                      <AlertCircleIcon />
                      <AlertTitle>
                        {result?.status === 'running'
                          ? 'Processamento em andamento'
                          : 'Fila de processamento'}
                      </AlertTitle>
                      <AlertDescription className="space-y-3">
                        <p>
                          {isStaleProcessing
                            ? 'A lista ainda está sendo processada. Atualize novamente em instantes se o resultado não aparecer.'
                            : 'Sua lista está sendo comparada com os preços disponíveis agora.'}
                        </p>
                        {isStaleProcessing ? (
                          <Button
                            onClick={() => handleRun(activeMode)}
                            size="sm"
                            variant="outline"
                          >
                            Tentar novamente
                          </Button>
                        ) : null}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {!result ? (
                    <ActionPlaceholder
                      icon={<AlertCircleIcon className="size-5" />}
                      title="Nenhum resultado ainda"
                      description="Escolha um modo e gere a comparação desta lista com os preços disponíveis. Depois você poderá abrir o checklist com lojas, preços e confiança."
                      primaryAction={
                        <a href="#optimization-modes">Escolher modo</a>
                      }
                      secondaryAction={
                        <Link to={`/listas/${list.id}`}>Voltar para lista</Link>
                      }
                    />
                  ) : isProcessingResult ? null : (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardHeader>
                            <CardDescription>Custo estimado</CardDescription>
                            <CardTitle className="tabular-nums">
                              <MaskedMoney
                                value={formatCurrency(
                                  result.totalEstimatedCost ?? 0,
                                )}
                              />
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardDescription>Economia estimada</CardDescription>
                            <CardTitle className="tabular-nums text-[var(--ds-savings)]">
                              <MaskedMoney
                                value={formatCurrency(
                                  result.estimatedSavings ?? 0,
                                )}
                              />
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardDescription>Paradas</CardDescription>
                            <CardTitle className="tabular-nums">
                              {storePlan.length}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardDescription>Cobertura</CardDescription>
                            <CardTitle className="flex items-center gap-2">
                              {coverageStatusLabel(result.coverageStatus)}
                              <StatusBadge
                                icon={
                                  result.coverageStatus === 'complete'
                                    ? CheckCircle2Icon
                                    : AlertCircleIcon
                                }
                                tone={
                                  result.coverageStatus === 'complete'
                                    ? 'savings'
                                    : 'warning'
                                }
                              >
                                {result.coverageStatus === 'complete'
                                  ? 'Cobertura total'
                                  : 'Cobertura parcial'}
                              </StatusBadge>
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      </div>

                      {storePlan.length > 0 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Plano por loja</CardTitle>
                            <CardDescription>
                              Paradas sugeridas, quantidade de itens e subtotal
                              previsto.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="grid gap-3 md:grid-cols-2">
                            {storePlan.map((store) => (
                              <div
                                key={store.name}
                                className="grid gap-2 rounded-lg border border-border/70 bg-background/80 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-medium">
                                      {store.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {store.neighborhood ??
                                        'Bairro não informado'}
                                    </div>
                                  </div>
                                  <StatusBadge tone="location">
                                    {store.items}{' '}
                                    {store.items === 1 ? 'item' : 'itens'}
                                  </StatusBadge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Subtotal previsto:{' '}
                                  <span className="font-medium tabular-nums text-foreground">
                                    <MaskedMoney
                                      value={formatCurrency(store.total)}
                                    />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ) : (
                        <ActionPlaceholder
                          icon={<RouteIcon className="size-5" />}
                          title="Sem parada definida"
                          description="O resultado ainda não tem plano por loja. Use o modo de menor total na cidade ou revise itens sem oferta confirmada para gerar paradas."
                          primaryAction={
                            <a href="#optimization-modes">Trocar modo</a>
                          }
                          secondaryAction={
                            <Link to={`/listas/${list.id}/checklist`}>
                              Abrir checklist
                            </Link>
                          }
                        />
                      )}

                      <Card>
                        <CardHeader>
                          <CardTitle>Decisões por item</CardTitle>
                          <CardDescription>
                            Cada item separa pedido original, variante
                            selecionada, loja, comparação verdadeira e evidência
                            da oferta.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                          {result.selections.map((selection) => {
                            const listItem = listItemsById.get(
                              selection.shoppingListItemId,
                            );
                            const imageUrl =
                              selection.selectedVariantImageUrl ??
                              listItem?.imageUrl;
                            const selectedVariantLabel =
                              selection.selectedVariantName
                                ? formatVariantWithPackage(
                                    selection.selectedVariantName,
                                    selection.selectedPackageLabel,
                                  )
                                : undefined;
                            const status =
                              selection.selectionStatus === 'selected'
                                ? 'completed'
                                : selection.selectionStatus === 'review'
                                  ? 'retrying'
                                  : 'failed';

                            return (
                              <div
                                key={`${selection.shoppingListItemId}-${selection.id ?? selection.shoppingListItemName}`}
                                className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3"
                              >
                                <PriceRow
                                  image={
                                    imageUrl ? (
                                      <img
                                        alt={selection.shoppingListItemName}
                                        className="size-full object-cover"
                                        src={resolveProductImage(imageUrl)}
                                      />
                                    ) : null
                                  }
                                  title={selection.shoppingListItemName}
                                  subtitle={
                                    <span className="grid gap-0.5">
                                      {selectedVariantLabel ? (
                                        <span>
                                          Selecionado: {selectedVariantLabel}
                                        </span>
                                      ) : null}
                                      <span>
                                        {describeBrandRule(
                                          listItem ?? {
                                            brandPreferenceMode: 'any',
                                            preferredBrandNames: [],
                                          },
                                          listItem?.brandPreferenceMode ===
                                            'exact'
                                            ? listItem.name
                                            : undefined,
                                        )}
                                      </span>
                                      {selection.establishmentName ? (
                                        <span>
                                          {selection.establishmentName}
                                          {selection.establishmentNeighborhood
                                            ? ` · ${selection.establishmentNeighborhood}`
                                            : ''}
                                        </span>
                                      ) : (
                                        <span>Sem loja definida</span>
                                      )}
                                      {selection.distanceKm !== undefined ? (
                                        <span>
                                          {selection.distanceKm.toFixed(1)} km
                                          do local salvo
                                        </span>
                                      ) : null}
                                    </span>
                                  }
                                  price={
                                    <MaskedMoney
                                      value={formatCurrency(
                                        selection.priceAmount ??
                                          selection.estimatedCost ??
                                          0,
                                      )}
                                    />
                                  }
                                  comparison={
                                    selection.savingsVsComparison &&
                                    selection.savingsVsComparison > 0
                                      ? savingsComparisonLabel(selection)
                                      : undefined
                                  }
                                  meta={
                                    <>
                                      <StatusBadge
                                        family="queue"
                                        status={status}
                                      >
                                        {selectionStatusLabel(
                                          selection.selectionStatus,
                                        )}
                                      </StatusBadge>
                                      {decisionReasonLabel(
                                        selection.decisionReason,
                                      ) ? (
                                        <StatusBadge tone="neutral">
                                          {decisionReasonLabel(
                                            selection.decisionReason,
                                          )}
                                        </StatusBadge>
                                      ) : null}
                                      {selection.observedAt ? (
                                        <StatusBadge
                                          family="freshness"
                                          status="fresh"
                                        >
                                          {formatFreshnessLabel(
                                            selection.observedAt,
                                          )}
                                        </StatusBadge>
                                      ) : null}
                                      {selection.rejectedReason ? (
                                        <StatusBadge tone="critical">
                                          {rejectedReasonLabel(
                                            selection.rejectedReason,
                                          )}
                                        </StatusBadge>
                                      ) : null}
                                    </>
                                  }
                                />
                                <ShopperEvidenceModule
                                  listId={list.id}
                                  selection={selection}
                                />
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>

                      {reviewSelections.length > 0 ? (
                        <Card className="border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)]/40">
                          <CardHeader>
                            <CardTitle>
                              Itens sem confirmação completa
                            </CardTitle>
                            <CardDescription>
                              Revise antes de comprar ou envie nota fiscal para
                              melhorar a cobertura da cidade.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="grid gap-3">
                            {reviewSelections.map((selection) => (
                              <PriceRow
                                key={`${selection.shoppingListItemId}-review`}
                                title={selection.shoppingListItemName}
                                subtitle={
                                  selection.rejectedReason
                                    ? rejectedReasonLabel(
                                        selection.rejectedReason,
                                      )
                                    : 'Sem oferta confirmada suficiente'
                                }
                                price={
                                  selection.priceAmount !== undefined
                                    ? (
                                        <MaskedMoney
                                          value={formatCurrency(
                                            selection.priceAmount,
                                          )}
                                        />
                                      )
                                    : 'Sem preço'
                                }
                                meta={
                                  <StatusBadge
                                    family="queue"
                                    status={
                                      selection.selectionStatus === 'review'
                                        ? 'retrying'
                                        : 'failed'
                                    }
                                  >
                                    {selectionStatusLabel(
                                      selection.selectionStatus,
                                    )}
                                  </StatusBadge>
                                }
                                actions={
                                  <Button asChild size="sm" variant="outline">
                                    <Link to="/notas">Enviar nota</Link>
                                  </Button>
                                }
                              />
                            ))}
                          </CardContent>
                        </Card>
                      ) : null}
                    </>
                  )}
                </>
              )}
            </div>
          </main>

          {result && !isProcessingResult ? (
            <aside className="grid gap-4 border-l border-border/70 bg-card/60 p-4 lg:content-start lg:p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RouteIcon className="size-4 text-primary" />
                    Plano de compras ({storePlan.length}{' '}
                    {storePlan.length === 1 ? 'parada' : 'paradas'})
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {storePlan.map((store, index) => {
                    const storeItems = selectedSelections.filter(
                      (selection) =>
                        (selection.establishmentName ?? 'Sem loja definida') ===
                        store.name,
                    );

                    return (
                      <div
                        className="rounded-lg border border-border/70 bg-background p-3"
                        key={store.name}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex gap-2">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                              {index + 1}
                            </span>
                            <div className="grid gap-0.5 text-sm">
                              <div className="font-medium">{store.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {store.neighborhood ?? 'Bairro'} ·{' '}
                                {firstSelectedSelection?.distanceKm?.toFixed(
                                  1,
                                ) ?? '1.2'}{' '}
                                km
                              </div>
                            </div>
                          </div>
                          <StatusBadge tone="savings">
                            {store.items} {store.items === 1 ? 'item' : 'itens'}
                          </StatusBadge>
                        </div>
                        <div className="grid gap-2 text-sm">
                          {storeItems.slice(0, 5).map((selection) => (
                            <div
                              className="flex items-center justify-between gap-3"
                              key={`${store.name}-${selection.shoppingListItemId}`}
                            >
                              <span className="truncate">
                                {selection.shoppingListItemName}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                1 un
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button
                          asChild
                          className="mt-3 w-full"
                          size="sm"
                          variant="link"
                        >
                          <Link to={`/listas/${list.id}/checklist`}>
                            Ver itens da parada
                          </Link>
                        </Button>
                        {store.mapUrl ? (
                          <Button
                            asChild
                            className="mt-1 w-full"
                            size="sm"
                            variant="outline"
                          >
                            <a
                              href={store.mapUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Abrir loja no mapa
                              <ExternalLinkIcon className="size-3.5" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                  <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
                    <div className="font-medium">Trajeto otimizado</div>
                    <div>
                      {storePlan.length} paradas ·{' '}
                      {Math.max(
                        routeDistanceKm,
                        storePlan.length * 1.2,
                      ).toFixed(1)}{' '}
                      km estimados
                    </div>
                    <div className="mt-2 text-xs">
                      Os links usam apenas o endereco publico das lojas.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ações rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {[
                    {
                      icon: FlagIcon,
                      title: 'Corrigir preço',
                      description: 'Ajude a manter os preços atualizados',
                      to: `/listas/${list.id}/checklist`,
                    },
                    {
                      icon: ReceiptTextIcon,
                      title: 'Enviar nota fiscal',
                      description: 'Aumente a confiança das ofertas',
                      to: '/notas',
                    },
                    {
                      icon: SlidersHorizontalIcon,
                      title: 'Atualizar lista',
                      description: 'Rever itens e preferências',
                      to: `/listas/${list.id}`,
                    },
                    {
                      icon: Share2Icon,
                      title: 'Compartilhar resultado',
                      description: 'Copiar link público somente leitura',
                      onClick: handleShareResult,
                    },
                  ].map((action) => (
                    <Button
                      className="h-auto justify-start gap-3 rounded-md bg-muted/70 p-3 text-left"
                      disabled={'onClick' in action && isSharingResult}
                      key={action.title}
                      onClick={'onClick' in action ? action.onClick : undefined}
                      asChild={'to' in action}
                      variant="ghost"
                    >
                      {'to' in action ? (
                      <Link to={action.to!}>
                        <action.icon className="size-4 shrink-0" />
                        <span className="grid gap-0.5">
                          <span className="font-medium">{action.title}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {action.description}
                          </span>
                        </span>
                      </Link>
                      ) : (
                        <>
                          <action.icon className="size-4 shrink-0" />
                          <span className="grid gap-0.5">
                            <span className="font-medium">{action.title}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {action.description}
                            </span>
                          </span>
                        </>
                      )}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </aside>
          ) : null}
        </div>
      )}
    </RequireAuthentication>
  );
}
