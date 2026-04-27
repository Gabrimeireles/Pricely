import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  ChevronRightIcon,
  LogInIcon,
  ShieldAlertIcon,
} from 'lucide-react';

import { formatCurrency, formatDateTime, formatFreshnessLabel } from '@/app/format';
import {
  getCityById,
  optimizationModes,
} from '@/app/mock-data';
import {
  type CatalogProductSearchResponse,
  type OfferDetailApiResponse,
  type ProductVariantResponse,
  type RegionOffersApiResponse,
  fetchCatalogProductVariants,
  fetchOfferDetail,
  fetchRegionOffers,
  searchCatalogProducts,
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

function describeBrandRule(item: {
  brandPreferenceMode?: 'any' | 'preferred' | 'exact';
  preferredBrandNames?: string[];
}) {
  if (item.brandPreferenceMode === 'preferred') {
    return (item.preferredBrandNames ?? []).length > 0
      ? `Preferir: ${(item.preferredBrandNames ?? []).join(', ')}`
      : 'Preferencia de marca configurada';
  }

  if (item.brandPreferenceMode === 'exact') {
    return 'Variante exata selecionada';
  }

  return 'Qualquer marca';
}

function freshnessBadge(level: FreshnessLevel) {
  if (level === 'fresh') {
    return <Badge className="bg-lime-100 text-lime-900 hover:bg-lime-100">Atualizado hoje</Badge>;
  }
  if (level === 'aging') {
    return <Badge variant="secondary">Cobertura parcial</Badge>;
  }

  return <Badge variant="destructive">Dado antigo</Badge>;
}

function confidenceBadge(level: ConfidenceLevel) {
  if (level === 'alta') {
    return <Badge className="bg-sky-100 text-sky-900 hover:bg-sky-100">Confianca alta</Badge>;
  }
  if (level === 'media') {
    return <Badge variant="secondary">Confianca media</Badge>;
  }

  return <Badge variant="destructive">Revisar</Badge>;
}

function cityStatusBadge(city: SupportedCity) {
  if (city.status === 'supported') {
    return <Badge className="bg-lime-100 text-lime-900 hover:bg-lime-100">Disponivel</Badge>;
  }
  if (city.status === 'pilot') {
    return <Badge variant="secondary">Piloto</Badge>;
  }

  return <Badge variant="outline">Em breve</Badge>;
}

function listStatusTone(status: ShoppingListItem['status']) {
  if (status === 'resolved') {
    return 'text-lime-700';
  }
  if (status === 'partial') {
    return 'text-amber-700';
  }

  return 'text-rose-700';
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
          <CardDescription>Validando sessao e sincronizando listas.</CardDescription>
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
  onSubmit: (values: { displayName?: string; email: string; password: string }) => Promise<void>;
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
      setError(submitError instanceof Error ? submitError.message : 'Nao foi possivel concluir o acesso.');
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
                    placeholder="Como voce quer aparecer no Pricely"
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
                  autoComplete={includeDisplayName ? 'new-password' : 'current-password'}
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
  const { cityId, cities, currentUser, profile } = usePricely();
  const city = cities.find((entry) => entry.id === cityId) ?? getCityById(cityId);
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
    }>
  >([]);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      try {
        const response = await fetchRegionOffers(cityId);
        if (disposed) {
          return;
        }

        setFeaturedOffers(
          response.offers.slice(0, 3).map((offer, index) => ({
            id: offer.id,
            productName: offer.productName,
            storeName: offer.storeName,
            neighborhood: offer.neighborhood,
            imageUrl: offer.imageUrl ?? [
              'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80',
            ][index % 3],
            freshness: 'fresh',
            confidence:
              offer.confidenceLevel === 'high'
                ? 'alta'
                : offer.confidenceLevel === 'medium'
                  ? 'media'
                  : 'baixa',
            price: offer.priceAmount,
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

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/85 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5">
            <Badge variant="secondary" className="w-fit">
              mesma conta no mobile e no web
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Decida onde comprar melhor com evidencia real.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                O Pricely cruza lista de compras, ofertas e preco observado para mostrar o que
                vale a pena agora na sua regiao.
              </p>
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
                <CardTitle>Conta unica</CardTitle>
                <CardDescription>Mesmo login em todas as superficies.</CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Economia estimada</CardTitle>
                <CardDescription>{formatCurrency(profile.totalEstimatedSavings)} acumulados.</CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Cidade ativa</CardTitle>
                <CardDescription>{city.name}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border/70 shadow-sm">
          <img
            alt="Pessoa organizando compras no supermercado"
            className="h-full min-h-[360px] w-full object-cover"
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {featuredOffers.map((offer) => (
          <Card key={offer.id} className="overflow-hidden">
            <div className="aspect-[16/9] overflow-hidden">
              <img alt={offer.productName} className="h-full w-full object-cover" src={offer.imageUrl} />
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
              <div className="text-2xl font-semibold">{formatCurrency(offer.price)}</div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function OffersPage() {
  const { cityId, cities } = usePricely();
  const city = cities.find((entry) => entry.id === cityId) ?? getCityById(cityId);
  const [offers, setOffers] = useState<RegionOffersApiResponse['offers']>([]);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      try {
        const response = await fetchRegionOffers(cityId);
        if (!disposed) {
          setOffers(response.offers);
        }
      } catch {
        if (!disposed) {
          setOffers([]);
        }
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, [cityId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ofertas por regiao</h1>
        <p className="text-muted-foreground">
          {city.name}. Ofertas publicas ficam visiveis com origem, frescor e confianca.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {offers.map((offer) => (
          <Card key={offer.id} className="overflow-hidden">
            <div className="aspect-[16/9] overflow-hidden">
              <img
                alt={offer.productName}
                className="h-full w-full object-cover"
                src={offer.imageUrl ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80'}
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
                {freshnessBadge('fresh')}
                {confidenceBadge(
                  offer.confidenceLevel === 'high'
                    ? 'alta'
                    : offer.confidenceLevel === 'medium'
                      ? 'media'
                      : 'baixa',
                )}
              </div>
              <div className="text-2xl font-semibold">{formatCurrency(offer.priceAmount)}</div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button asChild size="sm" variant="outline">
                <Link to={`/ofertas/${offer.id}`}>
                  Detalhe
                  <ChevronRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
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
        <AlertTitle>Oferta nao encontrada</AlertTitle>
        <AlertDescription>O detalhe pedido nao existe mais.</AlertDescription>
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
            src={offer.product.imageUrl ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80'}
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
            <div className="text-4xl font-semibold">
              {formatCurrency(offer.activeOffer.priceAmount)}
            </div>
            <p className="text-sm text-muted-foreground">
              Preco observado em {offer.region.name} com evidencia rastreavel.
            </p>
            <div className="rounded-lg border border-border/70 p-4 text-sm text-muted-foreground">
              Ultima atualizacao: {formatDateTime(offer.activeOffer.observedAt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precos do produto na regiao</CardTitle>
            <CardDescription>
              Compare estabelecimentos, horarios e fonte antes de decidir.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {offer.alternativeOffers.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{entry.storeName}</div>
                    <div className="text-sm text-muted-foreground">{entry.neighborhood}</div>
                  </div>
                  <div className="text-lg font-semibold">{formatCurrency(entry.priceAmount)}</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {entry.packageLabel} · {entry.sourceLabel} · {formatDateTime(entry.observedAt)}
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Cidades suportadas</h1>
        <p className="text-muted-foreground">
          O app lista regioes com estabelecimentos ativos e mostra quando ainda estamos coletando cobertura.
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
                  <CardDescription>{city.regionLabel}</CardDescription>
                </div>
                {cityStatusBadge(city)}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div>
                <div className="font-medium">Estabelecimentos na regiao</div>
                <div className="text-muted-foreground">{city.stores.join(', ')}</div>
              </div>
              <div>
                <div className="font-medium">Bairros com cobertura</div>
                <div className="text-muted-foreground">{city.neighborhoods.join(', ')}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SignInPage() {
  const { signIn } = usePricely();

  return (
    <AuthCard
      ctaLabel="Entrar"
      description="Use a mesma conta do mobile para acessar listas, otimizacoes e historico."
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
      description="Sua conta sera compartilhada entre web e mobile com o mesmo historico."
      includeDisplayName
      onSubmit={({ displayName, email, password }) =>
        signUp(email, password, displayName ?? 'Cliente Pricely')
      }
      title="Criar conta"
    />
  );
}

export function ListsPage() {
  const { lists, profile } = usePricely();

  return (
    <RequireAuthentication
      description="Entre para salvar listas, reaproveitar compras mensais e otimizar quando quiser."
      title="Sua lista precisa da sua conta"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Minhas listas</h1>
            <p className="text-muted-foreground">
              Suas listas ficam sincronizadas entre web e mobile. Voce pode salvar sem otimizar e processar depois.
            </p>
          </div>
          <Button asChild>
            <Link to="/listas/nova">Nova lista</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Listas criadas</CardDescription>
              <CardTitle>{profile.listsCreated}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Economia estimada</CardDescription>
              <CardTitle>{formatCurrency(profile.totalEstimatedSavings)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Contribuicoes</CardDescription>
              <CardTitle>{profile.receiptsShared + profile.invalidPromotionReports}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {lists.length === 0 ? (
          <Alert>
            <BadgeCheckIcon />
            <AlertTitle>Nenhuma lista ainda</AlertTitle>
            <AlertDescription>
              Crie sua primeira lista para salvar a compra do mes e reprocessar quando os precos mudarem.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {lists.map((list) => (
              <Card key={list.id}>
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
                        src={list.items[0].imageUrl}
                      />
                    </div>
                  ) : null}
                  <div className="grid gap-2 text-sm text-muted-foreground">
                  <div>Ultima atualizacao: {formatDateTime(list.updatedAt)}</div>
                    <div>
                      Modo preferido: {optimizationModes.find((mode) => mode.id === list.lastMode)?.label}
                    </div>
                    {list.items[0] ? (
                      <div>
                        Primeiro item: {list.items[0].name} - {describeBrandRule(list.items[0])}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
                <CardFooter className="justify-between gap-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/listas/${list.id}`}>Editar</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to={`/otimizacao/${list.id}`}>Otimizar</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
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
  const editingList = listId === 'nova' ? undefined : lists.find((entry) => entry.id === listId);
  const [name, setName] = useState(editingList?.name ?? '');
  const [selectedCityId, setSelectedCityId] = useState(editingList?.cityId ?? cityId);
  const [mode, setMode] = useState<OptimizationModeId>(editingList?.lastMode ?? preferredMode);
  const [items, setItems] = useState<EditableListItem[]>(() => buildEditableItems(editingList));
  const [draftName, setDraftName] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('1');
  const [draftUnit, setDraftUnit] = useState('un');
  const [draftNote, setDraftNote] = useState('');
  const [draftBrandPreferenceMode, setDraftBrandPreferenceMode] = useState<'any' | 'preferred' | 'exact'>('any');
  const [draftPreferredBrand, setDraftPreferredBrand] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogProductSearchResponse[]>([]);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProductSearchResponse | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<ProductVariantResponse[]>([]);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

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
      if (draftName.trim().length < 2) {
        setCatalogResults([]);
        return;
      }

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

  const addItem = () => {
    if (!draftName.trim()) {
      return;
    }

    setItems((current) => [
      ...current,
      {
        id: `draft-${Date.now()}`,
        name: draftName.trim(),
        catalogProductId: selectedCatalogProduct?.id,
        lockedProductVariantId: draftBrandPreferenceMode === 'exact' ? selectedVariantId || undefined : undefined,
        brandPreferenceMode: draftBrandPreferenceMode,
        preferredBrandNames:
          draftBrandPreferenceMode === 'preferred' && draftPreferredBrand.trim()
            ? [draftPreferredBrand.trim()]
            : [],
        imageUrl:
          selectedVariants.find((variant) => variant.id === selectedVariantId)?.imageUrl ??
          selectedCatalogProduct?.imageUrl ??
          undefined,
        quantity: Number.isFinite(Number(draftQuantity)) ? Number(draftQuantity) : 1,
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
    setDraftPreferredBrand('');
    setSelectedCatalogProduct(null);
    setSelectedVariantId('');
    setSelectedVariants([]);
    setIsBrandDialogOpen(false);
    setCatalogResults([]);
  };

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const togglePurchased = (itemId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              purchaseStatus: item.purchaseStatus === 'purchased' ? 'pending' : 'purchased',
            }
          : item,
      ),
    );
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
      navigate(`/otimizacao/${saved.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar a lista.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RequireAuthentication
      description="Entre para editar listas e manter tudo sincronizado no mobile."
      title="Edicao protegida"
    >
      <form className="grid gap-6" onSubmit={handleSave}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {editingList ? 'Editar lista' : 'Nova lista'}
            </h1>
            <p className="text-muted-foreground">
              Salve a lista sem processar ou otimize agora. O mesmo conteudo aparece no mobile.
            </p>
          </div>
          <Button disabled={isSaving} type="submit">
            {isSaving ? 'Salvando...' : 'Salvar lista'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuracao</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="list-name">Nome da lista</FieldLabel>
              <Input id="list-name" onChange={(event) => setName(event.target.value)} required value={name} />
            </Field>
            <Field>
              <FieldLabel htmlFor="list-city">Cidade</FieldLabel>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                id="list-city"
                onChange={(event) => setSelectedCityId(event.target.value)}
                value={selectedCityId}
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} · {city.stateCode}
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens da compra</CardTitle>
            <CardDescription>
              O nome pode ser bruto. O backend vai normalizar e tentar casar com o catalogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-lg border border-dashed border-border/70 p-4 md:grid-cols-[1.8fr_0.7fr_0.7fr]">
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
                <FieldLabel htmlFor="draft-item-quantity">Quantidade</FieldLabel>
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
                <FieldLabel>Produto comparavel</FieldLabel>
                <div className="grid gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    onChange={async (event) => {
                      const product =
                        catalogResults.find((entry) => entry.id === event.target.value) ?? null;
                      setSelectedCatalogProduct(product);
                      setSelectedVariantId('');

                      if (!product) {
                        setSelectedVariants([]);
                        return;
                      }

                      const variants = await fetchCatalogProductVariants(product.id);
                      setSelectedVariants(variants);
                    }}
                    value={selectedCatalogProduct?.id ?? ''}
                  >
                    <option value="">
                      {isSearchingCatalog ? 'Buscando no catalogo...' : 'Selecione um produto comparavel'}
                    </option>
                    {catalogResults.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {selectedCatalogProduct ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {selectedCatalogProduct.imageUrl ? (
                          <img
                            alt={selectedCatalogProduct.name}
                            className="h-12 w-12 rounded-lg border border-border/70 object-cover"
                            src={selectedCatalogProduct.imageUrl}
                          />
                        ) : null}
                        <div className="grid gap-1">
                          <span>Produto base: {selectedCatalogProduct.name}</span>
                          <span>{describeBrandRule({ brandPreferenceMode: draftBrandPreferenceMode, preferredBrandNames: draftPreferredBrand.trim() ? [draftPreferredBrand.trim()] : [] })}</span>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsBrandDialogOpen(true)}>
                        Configurar marca
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Field>
              <Field className="md:col-span-3">
                <FieldLabel htmlFor="draft-item-note">Observacao opcional</FieldLabel>
                <Textarea
                  id="draft-item-note"
                  onChange={(event) => setDraftNote(event.target.value)}
                  placeholder="Marca preferida, restricao ou comparacao que ajude o parser."
                  value={draftNote}
                />
              </Field>
              <div className="md:col-span-3">
                <Button onClick={addItem} type="button" variant="outline">
                  Adicionar item
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>Lista vazia</AlertTitle>
                <AlertDescription>Adicione pelo menos um item antes de salvar.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-border/70 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        checked={item.purchaseStatus === 'purchased'}
                        className="mt-5 h-4 w-4"
                        onChange={() => togglePurchased(item.id)}
                        type="checkbox"
                      />
                      {item.imageUrl ? (
                        <img
                          alt={item.name}
                          className="h-16 w-16 rounded-lg border border-border/70 object-cover"
                          src={item.imageUrl}
                        />
                      ) : null}
                      <div className="grid gap-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} - {item.unitLabel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {describeBrandRule(item)}
                        </div>
                      {item.note ? <div className="text-sm text-muted-foreground">{item.note}</div> : null}
                      </div>
                    </div>
                    <Button onClick={() => removeItem(item.id)} size="sm" type="button" variant="ghost">
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
                Defina se este item aceita qualquer marca, prefere uma marca ou exige uma variante exata.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <Field>
                <FieldLabel>Regra de marca</FieldLabel>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  onChange={(event) =>
                    setDraftBrandPreferenceMode(
                      event.target.value as 'any' | 'preferred' | 'exact',
                    )
                  }
                  value={draftBrandPreferenceMode}
                >
                  <option value="any">Qualquer marca</option>
                  <option value="preferred">Preferir marca</option>
                  <option value="exact">Somente variante exata</option>
                </select>
              </Field>
              {draftBrandPreferenceMode === 'preferred' ? (
                <Field>
                  <FieldLabel htmlFor="draft-item-brand">Marca preferida</FieldLabel>
                  <Input
                    id="draft-item-brand"
                    onChange={(event) => setDraftPreferredBrand(event.target.value)}
                    placeholder="Ex.: Camil"
                    value={draftPreferredBrand}
                  />
                </Field>
              ) : null}
              {draftBrandPreferenceMode === 'exact' ? (
                <Field>
                  <FieldLabel>Variante exata</FieldLabel>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    onChange={(event) => setSelectedVariantId(event.target.value)}
                    value={selectedVariantId}
                  >
                    <option value="">Selecione a variante</option>
                    {selectedVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.brandName ? `${variant.brandName} - ` : ''}{variant.displayName}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBrandDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
  const { lists, optimizationResults, preferredMode, runOptimization, setPreferredMode } = usePricely();
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const list = lists.find((entry) => entry.id === listId);
  const result = optimizationResults[listId];
  const activeMode = result?.mode ?? list?.lastMode ?? preferredMode;
  const listItemsById = new Map(list?.items.map((item) => [item.id, item]) ?? []);
  const isProcessingResult =
    result?.status === 'queued' || result?.status === 'running';
  const isStaleProcessing =
    isProcessingResult &&
    Date.now() - new Date(result.createdAt).getTime() > 30_000;

  const handleRun = async (mode: OptimizationModeId) => {
    setError(null);
    setIsRunning(true);

    try {
      setPreferredMode(mode);
      await runOptimization(listId, mode);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Nao foi possivel otimizar a lista.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <RequireAuthentication
      description="Entre para processar sua lista no backend e manter os resultados sincronizados."
      title="Otimizacao protegida"
    >
      {!list ? (
        <Alert variant="destructive">
          <ShieldAlertIcon />
          <AlertTitle>Lista nao encontrada</AlertTitle>
          <AlertDescription>Escolha uma lista valida para rodar a otimizacao.</AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">Resultado da otimizacao</h1>
              <p className="text-muted-foreground">
                {list.name} · {getCityById(list.cityId).name}. O processamento roda no backend para garantir consistencia.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={`/listas/${list.id}`}>Editar lista</Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Escolha o modo</CardTitle>
              <CardDescription>
                Voce pode reprocessar a mesma lista quantas vezes quiser sem perder o historico.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {optimizationModes.map((mode) => (
                <Button
                  key={mode.id}
                  disabled={isRunning}
                  onClick={() => handleRun(mode.id)}
                  variant={activeMode === mode.id ? 'default' : 'outline'}
                >
                  {isRunning && activeMode === mode.id ? 'Processando...' : mode.label}
                </Button>
              ))}
            </CardContent>
          </Card>

            {error ? (
              <Alert variant="destructive">
              <ShieldAlertIcon />
              <AlertTitle>Falha no processamento</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {isProcessingResult ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>
                  {result?.status === 'running' ? 'Processamento em andamento' : 'Fila de processamento'}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                  {isStaleProcessing
                    ? 'A lista ainda esta sendo processada. Atualize novamente em instantes se o resultado nao aparecer.'
                    : 'O backend aceitou a lista e esta calculando o melhor resultado agora.'}
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
                Rode um dos modos acima para gerar a comparacao desta lista com os precos disponiveis.
              </AlertDescription>
            </Alert>
            ) : isProcessingResult ? null : (
              <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardDescription>Custo estimado</CardDescription>
                    <CardTitle>{formatCurrency(result.totalEstimatedCost ?? 0)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Economia estimada</CardDescription>
                    <CardTitle>{formatCurrency(result.estimatedSavings ?? 0)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Cobertura</CardDescription>
                    <CardTitle>{result.coverageStatus}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Decisoes por item</CardTitle>
                  <CardDescription>
                    Cada item mostra loja, preco, origem e status de confianca.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Loja</TableHead>
                        <TableHead>Preco</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Atualizacao</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.selections.map((selection) => (
                        <TableRow key={`${selection.shoppingListItemId}-${selection.id ?? selection.shoppingListItemName}`}>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              {listItemsById.get(selection.shoppingListItemId)?.imageUrl ? (
                                <img
                                  alt={selection.shoppingListItemName}
                                  className="h-14 w-14 rounded-lg border border-border/70 object-cover"
                                  src={listItemsById.get(selection.shoppingListItemId)?.imageUrl}
                                />
                              ) : null}
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{selection.shoppingListItemName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {describeBrandRule(
                                    listItemsById.get(selection.shoppingListItemId) ?? {
                                      brandPreferenceMode: 'any',
                                      preferredBrandNames: [],
                                    },
                                  )}
                                </span>
                                {selection.confidenceNotice ? (
                                  <span className="text-xs text-muted-foreground">{selection.confidenceNotice}</span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {selection.establishmentName ? (
                              <div className="flex flex-col gap-1">
                                <span>{selection.establishmentName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {selection.establishmentNeighborhood ?? 'bairro nao informado'}
                                </span>
                              </div>
                            ) : (
                              'Sem loja definida'
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(selection.priceAmount ?? selection.estimatedCost ?? 0)}</TableCell>
                          <TableCell>{selection.sourceLabel ?? 'Sem evidencia suficiente'}</TableCell>
                          <TableCell>
                            {selection.observedAt ? formatFreshnessLabel(selection.observedAt) : 'Sem data'}
                          </TableCell>
                          <TableCell>
                            <span className={listStatusTone(
                              selection.selectionStatus === 'selected'
                                ? 'resolved'
                                : selection.selectionStatus === 'review'
                                  ? 'partial'
                                  : 'missing',
                            )}>
                              {selection.selectionStatus}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </RequireAuthentication>
  );
}

