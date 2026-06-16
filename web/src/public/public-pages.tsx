import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  FlagIcon,
  LocateFixedIcon,
  LogInIcon,
  MapPinIcon,
  ShieldAlertIcon,
  UploadIcon,
} from 'lucide-react';

import {
  formatCurrency,
  formatDateTime,
  formatFreshnessLabel,
} from '@/app/format';
import { landingHeroImage, resolveProductImage } from '@/app/media';
import { getCityById, optimizationModes } from '@/app/mock-data';
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
  requestCityInclusion,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  EvidenceModule,
  PriceRow,
  StatusBadge,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
      <Badge className="bg-lime-100 text-lime-900 hover:bg-lime-100">
        Atualizado hoje
      </Badge>
    );
  }
  if (level === 'aging') {
    return <Badge variant="secondary">Cobertura parcial</Badge>;
  }

  return <Badge variant="destructive">Dado antigo</Badge>;
}

function confidenceBadge(level: ConfidenceLevel) {
  if (level === 'alta') {
    return (
      <Badge className="bg-sky-100 text-sky-900 hover:bg-sky-100">
        Confiança alta
      </Badge>
    );
  }
  if (level === 'media') {
    return <Badge variant="secondary">Confiança média</Badge>;
  }

  return <Badge variant="destructive">Revisar</Badge>;
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
    done: 'border-lime-200 bg-lime-50 text-lime-950',
    current: 'border-teal-200 bg-teal-50 text-teal-950',
    pending: 'border-border/70 bg-background text-muted-foreground',
  };

  return (
    <div className="rounded-lg border border-border/70 bg-card/95 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-2">
          <Badge variant="secondary" className="w-fit">
            {eyebrow}
          </Badge>
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
      price={formatCurrency(selection.priceAmount ?? selection.estimatedCost ?? 0)}
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
          {formatCurrency(basePriceAmount)}
        </div>
      ) : null}
      <div
        className={
          size === 'lg' ? 'text-4xl font-semibold' : 'text-2xl font-semibold'
        }
      >
        {formatCurrency(priceAmount)}
      </div>
    </div>
  );
}

function cityStatusBadge(city: SupportedCity) {
  if (city.status === 'supported') {
    return (
      <Badge className="bg-lime-100 text-lime-900 hover:bg-lime-100">
        Disponível
      </Badge>
    );
  }
  if (city.status === 'pilot') {
    return <Badge variant="secondary">Piloto</Badge>;
  }

  return <Badge variant="outline">Em breve</Badge>;
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
    return `${formatCurrency(selection.comparisonPriceAmount)} segundo menor elegivel · ${formatCurrency(
      savings,
    )} abaixo`;
  }

  if (selection.regionalAveragePriceAmount !== undefined) {
    return `${formatCurrency(selection.regionalAveragePriceAmount)} media da variante · ${formatCurrency(
      savings,
    )} abaixo`;
  }

  return `${formatCurrency(savings)} de economia estimada nas ofertas disponíveis`;
}

type PublicOfferGroup = NonNullable<
  RegionOffersApiResponse['groupedOffers']
>[number];

function getComparableOffers(group: PublicOfferGroup) {
  return group.offers.length > 0
    ? group.offers
    : [group.bestOffer, ...group.alternativeOffers];
}

function buildOfferGroupFromOffers(
  group: PublicOfferGroup,
  offers: PublicOfferGroup['offers'],
): PublicOfferGroup | null {
  if (offers.length === 0) {
    return null;
  }

  const sorted = [...offers].sort((left, right) => {
    if (left.priceAmount !== right.priceAmount) {
      return left.priceAmount - right.priceAmount;
    }

    return (
      new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime()
    );
  });
  const prices = sorted.map((offer) => offer.priceAmount);
  const cheapestPriceAmount = sorted[0].priceAmount;
  const secondCheapestPriceAmount = sorted[1]?.priceAmount;
  const averagePriceAmount = Number(
    (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2),
  );

  return {
    ...group,
    bestOffer: sorted[0],
    alternativeOffers: sorted.slice(1),
    offers: sorted,
    establishmentCount: sorted.length,
    cheapestPriceAmount,
    secondCheapestPriceAmount,
    savingsVsSecondCheapest: Number(
      Math.max(
        0,
        (secondCheapestPriceAmount ?? cheapestPriceAmount) -
          cheapestPriceAmount,
      ).toFixed(2),
    ),
    averagePriceAmount,
    highestPriceAmount: Math.max(...prices),
  };
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
  const { isAuthenticated, isBootstrapping } = usePricely();

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
    return (
      <Alert>
        <LogInIcon />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{description}</p>
          <Button asChild size="sm">
            <Link to="/entrar">Entrar agora</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

function AuthCard({
  title,
  description,
  ctaLabel,
  onSubmit,
  includeDisplayName = false,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  includeDisplayName?: boolean;
  onSubmit: (values: {
    displayName?: string;
    email: string;
    password: string;
  }) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ displayName, email, password });
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
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <FieldGroup>
              {includeDisplayName ? (
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
                  placeholder="voce@exemplo.com"
                  required
                  type="email"
                  value={email}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  autoComplete={
                    includeDisplayName ? 'new-password' : 'current-password'
                  }
                  id="password"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </Field>
            </FieldGroup>

            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Falha no acesso</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Enviando...' : ctaLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function LandingPage() {
  const { cityId, cities, currentUser } = usePricely();
  const city = cityId
    ? (cities.find((entry) => entry.id === cityId) ?? getCityById(cityId))
    : null;
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

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/85 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5">
            <Badge
              variant="secondary"
              className="max-w-full whitespace-normal text-left"
            >
              lista salva, cidade persistida e compra pronta no mercado
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Decida sua compra por cidade, lista e preço observado.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Monte a lista no computador, continue no celular e chegue ao
                mercado com a cidade certa, os produtos comparáveis definidos e
                a melhor estratégia de compra.
              </p>
              {impact && impact.totalEstimatedSavings > 0 ? (
                <div className="rounded-lg border border-border/70 bg-background/75 px-4 py-3">
                  <div className="text-sm font-medium text-foreground">
                    O Pricely já ajudou pessoas a economizar{' '}
                    {formatCurrency(impact.totalEstimatedSavings)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Economia estimada acumulada em {impact.optimizedListsCount}{' '}
                    listas otimizadas.
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={currentUser ? '/listas' : '/criar-conta'}>
                  {currentUser ? 'Abrir minhas listas' : 'Criar minha conta'}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/ofertas">Explorar ofertas</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Continue sua compra em qualquer tela</CardTitle>
                <CardDescription>
                  Salve a cidade, monte a lista no computador e finalize a
                  compra com checklist no celular.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Lista reaproveitável</CardTitle>
                <CardDescription>
                  Salve uma vez e reotimize depois quando os preços mudarem.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Cidade com contexto real</CardTitle>
                <CardDescription>
                  {city
                    ? `${city.name} - ${city.activeStoreCount} estabelecimentos ativos`
                    : 'Escolha uma cidade para carregar cobertura e ofertas públicas'}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border/70 shadow-sm">
          <img
            alt="Visao geral do fluxo de compras por cidade no Pricely"
            className="h-full min-h-[360px] w-full object-cover"
            src={landingHeroImage}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>1. Escolha a cidade</CardTitle>
            <CardDescription>
              Mostramos somente cidades ativas ou em ativação, sempre com a
              contagem atual de estabelecimentos ativos.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>2. Monte a lista</CardTitle>
            <CardDescription>
              Selecione um produto comparável primeiro e, se precisar, trave uma
              variante exata.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>3. Compare os modos</CardTitle>
            <CardDescription>
              Local, Global único e Global completo deixam claro o equilíbrio
              entre deslocamento e economia.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {featuredOffers.length > 0 ? (
          featuredOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  alt={offer.productName}
                  className="h-full w-full object-cover"
                  src={offer.imageUrl}
                />
              </div>
              <CardHeader>
                <CardTitle>{offer.productName}</CardTitle>
                <CardDescription>
                  {offer.storeName} · {offer.neighborhood}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {freshnessBadge(offer.freshness)}
                  {confidenceBadge(offer.confidence)}
                </div>
                <PriceDisplay
                  basePriceAmount={offer.basePrice}
                  priceAmount={offer.price}
                  promotionalPriceAmount={offer.promotionalPrice}
                />
                {offer.savingsVsRegionalAverage &&
                offer.savingsVsRegionalAverage > 0 ? (
                  <div className="text-sm text-emerald-700">
                    {formatCurrency(offer.savingsVsRegionalAverage)} abaixo da
                    média da cidade
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Escolha uma cidade para ver ofertas reais</CardTitle>
              <CardDescription>
                A vitrine pública depende da cidade selecionada. Depois disso
                mostramos produtos, lojas, preço observado e confiança da
                informação.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  );
}

export function OffersPage() {
  const { cityId, cities } = usePricely();
  const city = cityId
    ? (cities.find((entry) => entry.id === cityId) ?? getCityById(cityId))
    : null;
  const [offerGroups, setOfferGroups] = useState<
    NonNullable<RegionOffersApiResponse['groupedOffers']>
  >([]);
  const [storeFilter, setStoreFilter] = useState('all');

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      if (!cityId) {
        setOfferGroups([]);
        return;
      }

      try {
        const response = await fetchRegionOffers(cityId);
        if (!disposed) {
          setOfferGroups(
            response.groupedOffers ?? groupFlatRegionalOffers(response.offers),
          );
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
  }, [cityId]);

  const storeOptions = Array.from(
    new Set(
      offerGroups.flatMap((group) =>
        getComparableOffers(group).map((offer) => offer.storeName),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const visibleOfferGroups =
    storeFilter === 'all'
      ? offerGroups
      : offerGroups
          .map((group) => {
            const filteredOffers = getComparableOffers(group).filter(
              (offer) => offer.storeName === storeFilter,
            );

            return buildOfferGroupFromOffers(group, filteredOffers);
          })
          .filter((group): group is NonNullable<typeof group> =>
            Boolean(group),
          );

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
        <Alert>
          <MapPinIcon />
          <AlertTitle>Escolha uma cidade primeiro</AlertTitle>
          <AlertDescription>
            A cidade define quais lojas e preços entram na vitrine pública.
          </AlertDescription>
        </Alert>
      ) : null}

      {cityId ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">Filtro por estabelecimento</div>
            <div className="text-sm text-muted-foreground">
              Cada produto aparece uma vez, com o menor preço primeiro e outras
              lojas abertas no detalhe.
              {storeFilter === 'all'
                ? ` ${storeOptions.length} estabelecimentos disponíveis neste recorte.`
                : ` Recorte atual: ${storeFilter}.`}
            </div>
          </div>
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            onChange={(event) => setStoreFilter(event.target.value)}
            value={storeFilter}
          >
            <option value="all">Todos os estabelecimentos</option>
            {storeOptions.map((storeName) => (
              <option key={storeName} value={storeName}>
                {storeName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {visibleOfferGroups.map((group) => (
          <Card key={group.id} className="overflow-hidden">
            <div className="aspect-[16/9] overflow-hidden">
              <img
                alt={group.variantName}
                className="h-full w-full object-cover"
                src={resolveProductImage(group.imageUrl)}
              />
            </div>
            <CardHeader>
              <CardTitle>{group.variantName}</CardTitle>
              <CardDescription>
                {formatVariantWithPackage(group.productName, group.packageLabel)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                {freshnessBadge('fresh')}
                {confidenceBadge(
                  group.bestOffer.confidenceLevel === 'high'
                    ? 'alta'
                    : group.bestOffer.confidenceLevel === 'medium'
                      ? 'media'
                      : 'baixa',
                )}
                <Badge variant="secondary">
                  {group.establishmentCount}{' '}
                  {group.establishmentCount === 1
                    ? 'estabelecimento'
                    : 'estabelecimentos'}
                </Badge>
              </div>
              <PriceDisplay
                basePriceAmount={group.bestOffer.basePriceAmount}
                priceAmount={group.bestOffer.priceAmount}
                promotionalPriceAmount={group.bestOffer.promotionalPriceAmount}
              />
              <div className="text-sm text-muted-foreground">
                Menor preço em {group.bestOffer.storeName} ·{' '}
                {group.bestOffer.neighborhood}
              </div>
              {(group.savingsVsSecondCheapest ?? 0) > 0 &&
              group.secondCheapestPriceAmount ? (
                <div className="text-sm font-medium text-emerald-700">
                  {formatCurrency(group.savingsVsSecondCheapest ?? 0)} abaixo do
                  próximo menor preço (
                  {formatCurrency(group.secondCheapestPriceAmount)}).
                </div>
              ) : group.establishmentCount > 1 ? (
                <div className="text-sm text-muted-foreground">
                  Menor preço empatado entre estabelecimentos elegíveis.
                </div>
              ) : null}
              {group.averagePriceAmount > 0 ? (
                <div className="text-sm text-muted-foreground">
                  Média da variante na cidade:{' '}
                  {formatCurrency(group.averagePriceAmount)}
                  {group.averagePriceAmount > group.cheapestPriceAmount ? (
                    <>
                      {' '}
                      ·{' '}
                      {formatCurrency(
                        group.averagePriceAmount - group.cheapestPriceAmount,
                      )}{' '}
                      acima do menor preço
                    </>
                  ) : null}
                </div>
              ) : null}
              {group.bestOffer.sourceLabel ? (
                <div className="text-sm text-muted-foreground">
                  Origem: {group.bestOffer.sourceLabel} ·{' '}
                  {formatDateTime(group.bestOffer.observedAt)}
                </div>
              ) : null}
              {group.alternativeOffers.length > 0 ? (
                <details className="rounded-lg border border-border/70 p-3 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Ver outros estabelecimentos
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
                            {formatCurrency(offer.priceAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            +
                            {formatCurrency(
                              offer.priceAmount - group.cheapestPriceAmount,
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </CardContent>
            <CardFooter className="justify-end">
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
      {cityId && visibleOfferGroups.length === 0 ? (
        <Alert>
          <MapPinIcon />
          <AlertTitle>Nenhuma oferta agrupada disponível</AlertTitle>
          <AlertDescription>
            {city?.status === 'pilot'
              ? 'Esta cidade está em ativação. Vamos exibir ofertas assim que houver validação suficiente.'
              : 'Troque o filtro de estabelecimento ou escolha outra cidade para comparar preços.'}
          </AlertDescription>
        </Alert>
      ) : null}
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
              <p className="text-sm font-medium text-emerald-700">
                Economize{' '}
                {formatCurrency(offer.activeOffer.savingsVsComparison)} versus o
                segundo menor preco elegivel para esta variante.
              </p>
            ) : null}
            {offer.activeOffer.regionalAveragePriceAmount ? (
              <p className="text-sm text-muted-foreground">
                Média regional desta variante:{' '}
                {formatCurrency(offer.activeOffer.regionalAveragePriceAmount)}.
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
              <div
                key={entry.id}
                className="rounded-lg border border-border/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{entry.storeName}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.neighborhood}
                    </div>
                  </div>
                  <PriceDisplay
                    basePriceAmount={entry.basePriceAmount}
                    priceAmount={entry.priceAmount}
                    promotionalPriceAmount={entry.promotionalPriceAmount}
                  />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {entry.packageLabel} · {entry.sourceLabel} ·{' '}
                  {formatDateTime(entry.observedAt)}
                </div>
              </div>
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
                      <Badge
                        variant={store.offerCount ? 'secondary' : 'outline'}
                      >
                        {store.offerCount
                          ? `${store.offerCount} ofertas`
                          : 'Em ativação'}
                      </Badge>
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
  const { signIn } = usePricely();

  return (
    <AuthCard
      ctaLabel="Entrar"
      description="Entre para salvar sua cidade, reaproveitar listas e continuar a compra no celular."
      onSubmit={({ email, password }) => signIn(email, password)}
      title="Entrar no Pricely"
    />
  );
}

export function SignUpPage() {
  const { signUp } = usePricely();

  return (
    <AuthCard
      ctaLabel="Criar conta"
      description="Crie uma conta para salvar sua cidade, sincronizar listas e usar checklist no mercado."
      includeDisplayName
      onSubmit={({ displayName, email, password }) =>
        signUp(email, password, displayName ?? 'Cliente Pricely')
      }
      title="Criar conta"
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
      | 'retrying';
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
      description="Entre para contribuir com notas fiscais e acompanhar rewards depois da validação."
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
                    <div className="mt-1 text-sm text-muted-foreground">
                      {submission.processingStatus === 'waiting_manual_release'
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
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                    <div className="text-sm font-medium">Reward</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {submission.rewardEligibilityStatus === 'granted'
                        ? 'Validado e concedido'
                        : submission.rewardEligibilityStatus ===
                            'eligible_pending'
                          ? 'Em processamento'
                          : submission.rewardEligibilityStatus === 'ineligible'
                            ? 'Sem elegibilidade'
                            : 'Aguardando qualidade'}
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
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
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

        <Card className="border-border/70 bg-emerald-50/80 shadow-sm">
          <CardHeader>
            <CardTitle>Como o reward funciona</CardTitle>
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
                className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white/70 p-3"
                key={step}
              >
                <Badge className="bg-emerald-100 text-emerald-950 hover:bg-emerald-100">
                  {index + 1}
                </Badge>
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
                {formatCurrency(profile.totalEstimatedSavings)}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Esse é o valor total que você economizou com listas otimizadas
                na sua conta.
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-border/70 bg-emerald-50/80 shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-950 hover:bg-emerald-100">
                {isPremium ? 'Premium ativo' : 'Plano gratuito'}
              </Badge>
              <Badge variant="secondary">
                {isPremium
                  ? 'Otimizações ilimitadas'
                  : `${profile.availableOptimizationTokens} de ${profile.monthlyFreeOptimizationTokens} listas no mês`}
              </Badge>
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
          <Alert>
            <BadgeCheckIcon />
            <AlertTitle>Nenhuma lista ainda</AlertTitle>
            <AlertDescription>
              Crie sua primeira lista para salvar a compra do mês e reprocessar
              quando os preços mudarem.
            </AlertDescription>
          </Alert>
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
                  {list.items[0]?.imageUrl ? (
                    <div className="overflow-hidden rounded-lg border border-border/70">
                      <img
                        alt={list.items[0].name}
                        className="h-32 w-full object-cover"
                        src={resolveProductImage(list.items[0].imageUrl)}
                      />
                    </div>
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
                      {formatCurrency(list.expectedSavings)}
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
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Checklist de compra
              </h1>
              <p className="text-muted-foreground">
                {list.name} - {getCityById(list.cityId).name}. Marque os itens
                conforme a compra acontece no mercado.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={`/listas/${list.id}`}>Voltar para a lista</Link>
            </Button>
          </div>

          <NextBestActionStrip
            title={
              list.completedAt
                ? 'Compra fechada, valide com a nota fiscal'
                : allItemsPurchased
                  ? 'Todos os itens marcados, conclua a lista'
                  : 'Use o checklist dentro do mercado'
            }
            description={
              list.completedAt
                ? 'A nota fiscal confirma preços, melhora o trust factor e deixa o reward em validação.'
                : allItemsPurchased
                  ? 'O total pago é opcional. Depois disso, envie a nota fiscal para reforçar as ofertas.'
                  : 'Marque os produtos, reporte divergências de preço e finalize quando a compra estiver completa.'
            }
            primaryAction={{
              label: list.completedAt
                ? 'Enviar nota fiscal'
                : allItemsPurchased
                  ? 'Concluir lista'
                  : 'Continuar checklist',
              to: list.completedAt ? '/notas' : '#checklist-actions',
            }}
            secondaryAction={{
              label: 'Ver otimização',
              to: `/otimizacao/${list.id}`,
            }}
            steps={[
              { label: 'Lista', status: 'done' },
              {
                label: 'Otimização',
                status: optimizationResult ? 'done' : 'pending',
              },
              {
                label: 'Checklist',
                status: list.completedAt ? 'done' : 'current',
              },
              {
                label: 'Nota fiscal',
                status: list.completedAt ? 'current' : 'pending',
              },
            ]}
          />

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

          <Card
            id="checklist-actions"
            className="sticky bottom-3 z-20 border-border/70 bg-card/95 shadow-sm"
          >
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">
                  {purchasedCount} de {list.items.length} itens comprados
                </div>
                <div className="text-sm text-muted-foreground">
                  {list.completedAt
                    ? `Lista concluída em ${formatDateTime(list.completedAt)}${
                        list.paidTotal !== undefined
                          ? ` · total pago ${formatCurrency(list.paidTotal)}`
                          : ''
                      }`
                    : allItemsPurchased
                      ? 'Todos os itens foram marcados. Informe o total pago se quiser salvar essa conferência.'
                      : 'Marque os itens conforme encontra os produtos no estabelecimento.'}
                </div>
              </div>
              {allItemsPurchased && !list.completedAt ? (
                <div className="flex flex-col gap-2 sm:min-w-72 sm:flex-row">
                  <Input
                    inputMode="decimal"
                    onChange={(event) => setPaidTotal(event.target.value)}
                    placeholder="Total pago opcional"
                    value={paidTotal}
                  />
                  <Button disabled={isCompleting} onClick={completeChecklist}>
                    Concluir
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {list.completedAt ? (
            <Alert>
              <UploadIcon />
              <AlertTitle>Compra concluída</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  Use a nota fiscal para validar os preços encontrados e ajudar
                  a melhorar a confiança das próximas ofertas.
                </p>
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <span className="rounded-md border border-border/70 bg-background px-3 py-2">
                    Envio recebido
                  </span>
                  <span className="rounded-md border border-border/70 bg-background px-3 py-2">
                    Reward em processamento
                  </span>
                  <span className="rounded-md border border-border/70 bg-background px-3 py-2">
                    Reward validado após nota confiável
                  </span>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/notas">Enviar nota fiscal</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4">
            {list.items.map((item) => {
              const checked = item.purchaseStatus === 'purchased';
              const optimizationSelection = optimizationResult?.selections.find(
                (selection) => selection.shoppingListItemId === item.id,
              );
              const expectedPrice = optimizationSelection?.priceAmount;
              const optimizedVariantLabel =
                optimizationSelection?.selectedVariantName ??
                (item.optimizedProductVariantId
                  ? 'variante definida pela otimizacao'
                  : undefined);

              return (
                <Card
                  key={item.id}
                  className={checked ? 'border-lime-300' : 'border-border/70'}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <input
                      checked={checked}
                      className="h-5 w-5"
                      disabled={pendingItemId === item.id}
                      onChange={() =>
                        void toggleItem(
                          item.id,
                          item.purchaseStatus ?? 'pending',
                        )
                      }
                      type="checkbox"
                    />
                    {item.imageUrl ? (
                      <img
                        alt={item.name}
                        className="h-16 w-16 rounded-lg border border-border/70 object-cover"
                        src={resolveProductImage(item.imageUrl)}
                      />
                    ) : null}
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unitLabel} -{' '}
                        {describeBrandRule(
                          item,
                          item.brandPreferenceMode === 'exact'
                            ? item.name
                            : undefined,
                        )}
                      </div>
                      {item.note ? (
                        <div className="text-sm text-muted-foreground">
                          {item.note}
                        </div>
                      ) : null}
                      {optimizedVariantLabel ? (
                        <div className="mt-2 inline-flex rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                          Variante otimizada: {optimizedVariantLabel}
                        </div>
                      ) : null}
                      {expectedPrice !== undefined ? (
                        <div className="text-sm text-muted-foreground">
                          Preço previsto: {formatCurrency(expectedPrice)}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={checked ? 'secondary' : 'outline'}>
                        {checked ? 'Comprado' : 'Pendente'}
                      </Badge>
                      <Button
                        onClick={() => {
                          setReportItem(item);
                          setReportedPrice(
                            expectedPrice !== undefined
                              ? String(expectedPrice).replace('.', ',')
                              : '',
                          );
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Reportar preço
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Dialog
            open={Boolean(reportItem)}
            onOpenChange={(open) => {
              if (!open) {
                setReportItem(null);
                setReportedPrice('');
                setReportReason('');
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reportar preço diferente</DialogTitle>
                <DialogDescription>
                  Avise quando o produto não estiver com o preço citado no app.
                  Isso ajuda a revisar a oferta e a confiança da evidência.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <Field>
                  <FieldLabel>Preço encontrado</FieldLabel>
                  <Input
                    inputMode="decimal"
                    onChange={(event) => setReportedPrice(event.target.value)}
                    placeholder="Ex.: 21,90"
                    value={reportedPrice}
                  />
                </Field>
                <Field>
                  <FieldLabel>Observação opcional</FieldLabel>
                  <Textarea
                    onChange={(event) => setReportReason(event.target.value)}
                    placeholder="Ex.: etiqueta mostrava outro valor ou item indisponível"
                    value={reportReason}
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button onClick={submitPriceReport}>Enviar reporte</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

export function ListEditorPage() {
  const navigate = useNavigate();
  const { listId = 'nova' } = useParams();
  const { cityId, cities, lists, preferredMode, saveList } = usePricely();
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
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
      <form className="grid gap-6" onSubmit={handleSave}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {editingList ? 'Editar lista' : 'Nova lista'}
            </h1>
            <p className="text-muted-foreground">
              Monte a lista em etapas. Salve sem processar ou siga direto para a
              otimização.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
              {isSaving ? 'Salvando...' : 'Salvar'}
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

        <NextBestActionStrip
          title={
            items.length > 0
              ? 'Lista pronta para salvar e comparar'
              : 'Adicione produtos para liberar a otimização'
          }
          description={
            items.length > 0
              ? 'Depois de salvar, siga direto para a comparação ou deixe a lista pronta para comprar depois.'
              : 'A otimização fica disponível quando a lista tem cidade, nome e pelo menos um item.'
          }
          primaryAction={{
            label:
              items.length > 0 ? 'Continuar para otimização' : 'Adicionar item',
            to: '#draft-item-name',
          }}
          secondaryAction={
            editingList
              ? {
                  label: 'Abrir checklist',
                  to: `/listas/${editingList.id}/checklist`,
                }
              : undefined
          }
          steps={[
            {
              label: 'Cidade',
              status: selectedCityId ? 'done' : 'current',
            },
            {
              label: 'Itens',
              status:
                items.length > 0
                  ? 'done'
                  : selectedCityId
                    ? 'current'
                    : 'pending',
            },
            {
              label: 'Otimização',
              status: items.length > 0 ? 'current' : 'pending',
            },
            { label: 'Checklist', status: 'pending' },
          ]}
        />

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>1. Defina o contexto da compra</CardTitle>
            <CardDescription>
              A cidade vira o contexto da comparação. A lista continua
              sincronizada com a conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="list-name">Nome da lista</FieldLabel>
              <Input
                id="list-name"
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="list-city">Cidade</FieldLabel>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
            <div className="rounded-lg border border-border/70 bg-background/80 p-3 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LocateFixedIcon className="size-4 text-primary" />
                Preview de localização
              </div>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <span>
                  Cidade:{' '}
                  {selectedCity
                    ? `${selectedCity.name} · ${selectedCity.stateCode}`
                    : 'selecione uma cidade'}
                </span>
                <span>Raio local padrão: 5 km</span>
                <span>
                  {selectedCity
                    ? `${selectedCity.activeStoreCount} lojas candidatas na cidade`
                    : 'sem cobertura carregada'}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Nesta fase, o raio é exibido para orientar a escolha. A
                distância ainda não altera a otimização nem gera promessa de
                proximidade.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>2. Adicione itens reais da sua compra</CardTitle>
            <CardDescription>
              Digite o produto e filtre em tempo real. Se não digitar nada,
              mostramos o catálogo completo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 md:grid-cols-[1.8fr_0.7fr_0.7fr]">
              <Field>
                <FieldLabel htmlFor="draft-item-name">Produto</FieldLabel>
                <Input
                  id="draft-item-name"
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Ex.: arroz tipo 1 1kg"
                  value={draftName}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="draft-item-quantity">
                  Quantidade
                </FieldLabel>
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
              <Field className="md:col-span-3">
                <FieldLabel>Produtos comparáveis</FieldLabel>
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right">Adicionar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catalogResults.length === 0 && !isSearchingCatalog ? (
                        <TableRow>
                          <TableCell
                            className="text-muted-foreground"
                            colSpan={4}
                          >
                            Nenhum produto comparável encontrado.
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {catalogResults.map((product) => {
                        const isSelected =
                          selectedCatalogProduct?.id === product.id;
                        return (
                          <TableRow
                            key={product.id}
                            className={isSelected ? 'bg-primary/5' : undefined}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  alt={product.name}
                                  className="h-14 w-14 rounded-lg border border-border/70 object-cover"
                                  src={resolveProductImage(
                                    getCatalogProductPreviewImage(product),
                                  )}
                                />
                                <div className="grid gap-1">
                                  <div className="font-medium">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {product.category} ·{' '}
                                    {product.defaultUnit ??
                                      'sem unidade padrão'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="grid gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {isSelected
                                    ? describeBrandRule(
                                        {
                                          brandPreferenceMode:
                                            draftBrandPreferenceMode,
                                          preferredBrandNames: [],
                                        },
                                        selectedExactVariantLabel,
                                      )
                                    : 'Qualquer variante'}
                                </span>
                                <Button
                                  onClick={async () => {
                                    setSelectedCatalogProduct(product);
                                    setSelectedVariantId('');
                                    const variants =
                                      await fetchCatalogProductVariants(
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
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {draftQuantity} {draftUnit.trim() || 'un'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={async () => {
                                  setSelectedCatalogProduct(product);
                                  if (
                                    selectedCatalogProduct?.id !== product.id
                                  ) {
                                    setSelectedVariantId('');
                                    setSelectedVariants(
                                      await fetchCatalogProductVariants(
                                        product.id,
                                      ),
                                    );
                                  }
                                  addItem(product);
                                }}
                                type="button"
                              >
                                Adicionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Field>
              <Field className="md:col-span-3">
                <FieldLabel htmlFor="draft-item-note">
                  Observação opcional
                </FieldLabel>
                <Textarea
                  id="draft-item-note"
                  onChange={(event) => setDraftNote(event.target.value)}
                  placeholder="Observação opcional para ajudar você a reconhecer o item depois."
                  value={draftNote}
                />
              </Field>
            </div>

            {items.length === 0 ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>Lista vazia</AlertTitle>
                <AlertDescription>
                  Adicione pelo menos um item antes de salvar.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-lg border-2 border-border/80 bg-background/80 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        alt={item.name}
                        className="h-16 w-16 rounded-lg border border-border/70 object-cover"
                        src={resolveProductImage(item.imageUrl)}
                      />
                      <div className="grid gap-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} - {item.unitLabel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {describeBrandRule(
                            item,
                            item.brandPreferenceMode === 'exact'
                              ? item.name
                              : undefined,
                          )}
                        </div>
                        {item.note ? (
                          <div className="text-sm text-muted-foreground">
                            {item.note}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      onClick={() => removeItem(item.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>3. Salve agora ou otimize depois</CardTitle>
            <CardDescription>
              O checklist fica disponível depois que a lista for salva. Aqui
              você decide entre apenas salvar ou salvar e otimizar.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="sticky bottom-3 z-20 rounded-lg border border-border/70 bg-card/95 p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <div className="font-medium">
                {items.length} itens na lista
                {selectedCity ? ` · ${selectedCity.name}` : ''}
              </div>
              <div className="text-muted-foreground">
                Salve para continuar no checklist ou compare preços agora.
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
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
                {isSaving ? 'Salvando...' : 'Salvar lista'}
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
                {isSaving ? 'Salvando...' : 'Salvar e otimizar agora'}
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
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
  } = usePricely();
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [latestLoadAttemptedFor, setLatestLoadAttemptedFor] = useState<
    string | null
  >(null);
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
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Resultado da otimização
              </h1>
              <p className="text-muted-foreground">
                {list.name} - {getCityById(list.cityId).name}. Compare o melhor
                total, a cobertura e a economia estimada da sua compra.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={`/listas/${list.id}`}>Editar lista</Link>
            </Button>
          </div>

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
                status: result && !isProcessingResult ? 'current' : 'pending',
              },
              { label: 'Nota fiscal', status: 'pending' },
            ]}
          />

          <Card id="optimization-modes">
            <CardHeader>
              <CardTitle>Escolha o modo</CardTitle>
              <CardDescription>
                Cada modo comunica um equilíbrio diferente entre deslocamento,
                cobertura e menor total.
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
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>Nenhum resultado ainda</AlertTitle>
              <AlertDescription>
                Rode um dos modos acima para gerar a comparação desta lista com
                os preços disponíveis.
              </AlertDescription>
            </Alert>
          ) : isProcessingResult ? null : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardDescription>Custo estimado</CardDescription>
                    <CardTitle>
                      {formatCurrency(result.totalEstimatedCost ?? 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Economia estimada</CardDescription>
                    <CardTitle>
                      {formatCurrency(result.estimatedSavings ?? 0)}
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

              <Card>
                <CardHeader>
                  <CardTitle>Decisões por item</CardTitle>
                  <CardDescription>
                    Cada item separa pedido original, variante selecionada,
                    loja, comparação verdadeira e evidência da oferta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {result.selections.map((selection) => {
                    const listItem = listItemsById.get(
                      selection.shoppingListItemId,
                    );
                    const imageUrl =
                      selection.selectedVariantImageUrl ?? listItem?.imageUrl;
                    const selectedVariantLabel = selection.selectedVariantName
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
                                <span>Selecionado: {selectedVariantLabel}</span>
                              ) : null}
                              <span>
                                {describeBrandRule(
                                  listItem ?? {
                                    brandPreferenceMode: 'any',
                                    preferredBrandNames: [],
                                  },
                                  listItem?.brandPreferenceMode === 'exact'
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
                                  {selection.distanceKm.toFixed(1)} km do local
                                  salvo
                                </span>
                              ) : null}
                            </span>
                          }
                          price={formatCurrency(
                            selection.priceAmount ??
                              selection.estimatedCost ??
                              0,
                          )}
                          comparison={
                            selection.savingsVsComparison &&
                            selection.savingsVsComparison > 0
                              ? savingsComparisonLabel(selection)
                              : undefined
                          }
                          meta={
                            <>
                              <StatusBadge family="queue" status={status}>
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
                                <StatusBadge family="freshness" status="fresh">
                                  {formatFreshnessLabel(selection.observedAt)}
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
            </>
          )}
        </div>
      )}
    </RequireAuthentication>
  );
}
