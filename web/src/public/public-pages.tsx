import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  ChevronRightIcon,
  ReceiptTextIcon,
  ShieldAlertIcon,
} from 'lucide-react';

import { formatCurrency, formatDateTime, formatFreshnessLabel } from '@/app/format';
import { usePricely } from '@/app/pricely-context';
import {
  getCityById,
  getOfferById,
  getOffersForCity,
  getOptimizationScenarios,
  optimizationModes,
  supportedCities,
} from '@/app/mock-data';
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
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

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
    return <Badge className="bg-sky-100 text-sky-900 hover:bg-sky-100">Confiança alta</Badge>;
  }
  if (level === 'media') {
    return <Badge variant="secondary">Confiança média</Badge>;
  }

  return <Badge variant="destructive">Revisar</Badge>;
}

function cityStatusBadge(city: SupportedCity) {
  if (city.status === 'supported') {
    return <Badge className="bg-lime-100 text-lime-900 hover:bg-lime-100">Disponível</Badge>;
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

export function LandingPage() {
  const { cityId, profile, selectedListId } = usePricely();
  const city = getCityById(cityId);
  const featuredOffers = getOffersForCity(cityId).slice(0, 3);
  const featuredScenarios = getOptimizationScenarios(selectedListId);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/85 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5">
            <Badge variant="secondary" className="w-fit">
              leitura comunitária de preços, notas e promoções
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                O jeito mais claro de decidir onde comprar melhor na sua região.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                O Pricely cruza ofertas locais, lista de compras e evidência real para
                recomendar economia com contexto. Quando faltar dado, a tela mostra isso
                sem esconder o risco.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/listas">
                  Abrir minhas listas
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/ofertas">Explorar ofertas por região</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Conta única</CardTitle>
                <CardDescription>Mesmo login no mobile e no web.</CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Economia estimada</CardTitle>
                <CardDescription>{formatCurrency(profile.totalEstimatedSavings)} já rastreados.</CardDescription>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Cidade ativa</CardTitle>
                <CardDescription>
                  {city.name} · {city.regionLabel}
                </CardDescription>
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
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {featuredScenarios.slice(0, 2).map((scenario) => (
                <Card key={scenario.mode} className="bg-background/92">
                  <CardHeader>
                    <CardTitle>{scenario.label}</CardTitle>
                    <CardDescription>{scenario.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total estimado</span>
                      <span className="font-medium">{formatCurrency(scenario.totalEstimatedCost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Economia estimada</span>
                      <span className="font-medium text-lime-700">
                        {formatCurrency(scenario.estimatedSavings)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {optimizationModes.map((mode) => (
          <Card key={mode.id}>
            <CardHeader>
              <CardTitle>{mode.label}</CardTitle>
              <CardDescription>{mode.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {mode.id === 'local'
                ? 'Ideal para ida rápida. A interface expõe itens sem cobertura suficiente.'
                : mode.id === 'global_unique'
                  ? 'Compara lojas como candidatas únicas e mostra a troca entre cobertura e economia.'
                  : 'Quebra a compra entre mercados quando isso reduz o total com evidência real.'}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Valor claro para o usuário</CardTitle>
            <CardDescription>
              Perfil, listas e contribuição comunitária mostram por que o app vale a pena.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Listas criadas</div>
              <div className="mt-2 text-3xl font-semibold">{profile.listsCreated}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Notas e recibos enviados</div>
              <div className="mt-2 text-3xl font-semibold">{profile.receiptsShared}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Promoções reportadas</div>
              <div className="mt-2 text-3xl font-semibold">{profile.invalidPromotionReports}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Economia estimada</div>
              <div className="mt-2 text-3xl font-semibold text-lime-700">
                {formatCurrency(profile.totalEstimatedSavings)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ofertas em destaque em {city.name}</CardTitle>
            <CardDescription>
              Cartões públicos por região, sempre com loja, bairro, evidência e frescor.
            </CardDescription>
            <CardAction>
              <Button asChild size="sm" variant="outline">
                <Link to="/ofertas">Ver todas</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {featuredOffers.map((offer) => (
              <Link key={offer.id} to={`/ofertas/${offer.id}`}>
                <Card size="sm" className="h-full transition-transform hover:-translate-y-0.5">
                  <div className="aspect-[4/3] overflow-hidden">
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
                    <div className="text-2xl font-semibold">{formatCurrency(offer.price)}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function OffersPage() {
  const { cityId } = usePricely();
  const city = getCityById(cityId);
  const offers = useMemo(() => getOffersForCity(cityId), [cityId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ofertas por região</h1>
        <p className="text-muted-foreground">
          {city.name} · {city.regionLabel}. Ofertas públicas ficam disponíveis por cidade
          suportada, com indicação de confiança e data da última evidência.
        </p>
      </div>

      {city.status !== 'supported' && (
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>Cobertura ainda parcial</AlertTitle>
          <AlertDescription>
            Esta cidade ainda está em {city.status === 'pilot' ? 'piloto assistido' : 'preparação'}.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {offers.map((offer) => (
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
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {freshnessBadge(offer.freshness)}
                {confidenceBadge(offer.confidence)}
              </div>
              <div className="grid gap-1">
                <div className="text-3xl font-semibold">{formatCurrency(offer.price)}</div>
                <div className="text-sm text-muted-foreground">
                  {offer.packageLabel} · {formatFreshnessLabel(offer.updatedAt)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{offer.highlight}</p>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-sm text-muted-foreground">{offer.evidence[0]?.sourceLabel}</span>
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
  const offer = getOfferById(offerId ?? '');

  if (!offer) {
    return (
      <Alert variant="destructive">
        <ShieldAlertIcon />
        <AlertTitle>Oferta não encontrada</AlertTitle>
        <AlertDescription>
          O detalhe pedido não existe mais ou ficou fora da cidade selecionada.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden">
          <img alt={offer.productName} className="h-full w-full object-cover" src={offer.imageUrl} />
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{offer.productName}</CardTitle>
            <CardDescription>
              {offer.storeName} · {offer.neighborhood}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {freshnessBadge(offer.freshness)}
              {confidenceBadge(offer.confidence)}
            </div>
            <div className="text-4xl font-semibold">{formatCurrency(offer.price)}</div>
            <div className="text-sm text-muted-foreground">
              Preço anterior: {offer.previousPrice ? formatCurrency(offer.previousPrice) : 'sem histórico'}
            </div>
            <p className="text-sm text-muted-foreground">{offer.highlight}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidência da oferta</CardTitle>
            <CardDescription>
              Cada registro aponta de onde o preço veio e quando foi capturado.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {offer.evidence.map((evidence) => (
              <div
                key={`${offer.id}-${evidence.capturedAt}`}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/70 p-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{evidence.sourceLabel}</span>
                  <span className="text-sm text-muted-foreground">
                    {evidence.sourceType === 'nota'
                      ? 'Nota fiscal'
                      : evidence.sourceType === 'panfleto'
                        ? 'Panfleto'
                        : 'Site do mercado'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(evidence.capturedAt)}
                </span>
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-sm text-muted-foreground">
              Reportar promoção encerrada ou preço divergente
            </span>
            <Button size="sm" variant="destructive">
              Reportar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function CitiesPage() {
  const { cityId, setCityId } = usePricely();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Cidades suportadas</h1>
        <p className="text-muted-foreground">
          A entrada do produto começa na cidade. Essa escolha define ofertas públicas,
          bairros cobertos, mercados elegíveis e otimizações disponíveis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {supportedCities.map((city) => (
          <Card key={city.id} className={city.id === cityId ? 'ring-2 ring-primary/30' : undefined}>
            <CardHeader>
              <CardTitle>
                {city.name} · {city.stateCode}
              </CardTitle>
              <CardDescription>{city.regionLabel}</CardDescription>
              <CardAction>{cityStatusBadge(city)}</CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-foreground">Mercados mapeados</span>
                <span>{city.stores.join(' · ')}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-medium text-foreground">Bairros</span>
                <span>{city.neighborhoods.join(' · ')}</span>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-sm text-muted-foreground">
                {city.status === 'supported'
                  ? 'Pronto para ofertas públicas'
                  : city.status === 'pilot'
                    ? 'Acesso monitorado'
                    : 'Sem ofertas públicas ainda'}
              </span>
              <Button
                disabled={city.status === 'soon'}
                onClick={() => setCityId(city.id)}
                size="sm"
                variant={city.id === cityId ? 'secondary' : 'outline'}
              >
                {city.id === cityId ? 'Selecionada' : 'Escolher cidade'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuthCard({ mode }: { mode: 'signin' | 'signup' }) {
  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>{mode === 'signin' ? 'Entrar no Pricely' : 'Criar conta no Pricely'}</CardTitle>
        <CardDescription>
          A mesma conta funciona no mobile e no web. Suas listas, cidade ativa e economia
          estimada acompanham você.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" placeholder="voce@exemplo.com" />
          </Field>
          <Field>
            <FieldLabel htmlFor="senha">Senha</FieldLabel>
            <Input id="senha" placeholder="••••••••" type="password" />
          </Field>
          {mode === 'signup' && (
            <Field>
              <FieldLabel htmlFor="cidade">Cidade inicial</FieldLabel>
              <Input id="cidade" placeholder="Ex.: São Paulo - SP" />
              <FieldDescription>
                Você pode trocar a cidade depois sem perder suas listas.
              </FieldDescription>
            </Field>
          )}
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-sm text-muted-foreground">
          {mode === 'signin'
            ? 'Entrar sincroniza web e mobile.'
            : 'Criando conta você mantém um único histórico em todos os dispositivos.'}
        </span>
        <Button>{mode === 'signin' ? 'Entrar' : 'Criar conta'}</Button>
      </CardFooter>
    </Card>
  );
}

export function SignInPage() {
  return <AuthCard mode="signin" />;
}

export function SignUpPage() {
  return <AuthCard mode="signup" />;
}

export function ListsPage() {
  const { lists, setSelectedListId } = usePricely();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Minhas listas</h1>
          <p className="text-muted-foreground">
            A mesma lista pode ser criada no mobile ou no web. O resultado mais recente
            continua disponível nas duas superfícies.
          </p>
        </div>
        <Button asChild>
          <Link to="/listas/nova">Nova lista</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {lists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle>{list.name}</CardTitle>
              <CardDescription>
                {getCityById(list.cityId).name} · atualizada em {formatDateTime(list.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Economia estimada</span>
                  <span className="text-2xl font-semibold text-lime-700">
                    {formatCurrency(list.expectedSavings)}
                  </span>
                </div>
                <Badge variant="secondary">
                  {optimizationModes.find((mode) => mode.id === list.lastMode)?.label}
                </Badge>
              </div>
              <div className="grid gap-2">
                {list.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{item.name}</span>
                    <span className={listStatusTone(item.status)}>
                      {item.quantity} x {item.unitLabel}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                asChild
                onClick={() => setSelectedListId(list.id)}
                size="sm"
                variant="outline"
              >
                <Link to={`/listas/${list.id}`}>Editar lista</Link>
              </Button>
              <Button asChild onClick={() => setSelectedListId(list.id)} size="sm">
                <Link to={`/otimizacao/${list.id}`}>Otimizar</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ListEditorPage() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const { cityId, addList, lists, updateList } = usePricely();
  const isNew = listId === 'nova';
  const existingList = lists.find((list) => list.id === listId);
  const [name, setName] = useState(existingList?.name ?? 'Nova lista');
  const [draftItems, setDraftItems] = useState<ShoppingListItem[]>(
    existingList?.items ?? [
      {
        id: `item-${Date.now()}`,
        name: 'Arroz tipo 1',
        quantity: 1,
        unitLabel: '5 kg',
        status: 'resolved',
      },
    ],
  );
  const [newItemName, setNewItemName] = useState('');

  const saveList = () => {
    const list: ShoppingList = {
      id: existingList?.id ?? `lista-${Date.now()}`,
      cityId: existingList?.cityId ?? cityId,
      expectedSavings: existingList?.expectedSavings ?? 0,
      lastMode: existingList?.lastMode ?? 'global_full',
      name,
      updatedAt: new Date().toISOString(),
      items: draftItems,
    };

    if (isNew) {
      addList(list);
    } else {
      updateList(list);
    }

    navigate('/listas');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'Criar lista' : 'Editar lista de compras'}</CardTitle>
          <CardDescription>
            Os mesmos itens e observações ficam disponíveis depois no app mobile.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nome-lista">Nome da lista</FieldLabel>
              <Input
                id="nome-lista"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="novo-item">Adicionar item</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="novo-item"
                  onChange={(event) => setNewItemName(event.target.value)}
                  placeholder="Ex.: tomate italiano"
                  value={newItemName}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    disabled={!newItemName.trim()}
                    onClick={() => {
                      if (!newItemName.trim()) {
                        return;
                      }

                      setDraftItems((current) => [
                        ...current,
                        {
                          id: `item-${Date.now()}`,
                          name: newItemName.trim(),
                          quantity: 1,
                          unitLabel: 'un',
                          status: 'partial',
                        },
                      ]);
                      setNewItemName('');
                    }}
                    size="sm"
                  >
                    Adicionar
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="observacao">Observação geral</FieldLabel>
              <Textarea
                id="observacao"
                placeholder="Ex.: evitar substituições silenciosas e priorizar embalagem de 5 kg."
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between">
          <Button onClick={() => navigate('/listas')} size="sm" variant="outline">
            Cancelar
          </Button>
          <Button onClick={saveList} size="sm">
            Salvar lista
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens da lista</CardTitle>
          <CardDescription>
            Cada item mantém estado de cobertura para futuras otimizações.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {draftItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/70 p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground">
                  {item.quantity} x {item.unitLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={item.status === 'resolved' ? 'secondary' : 'outline'}>
                  {item.status === 'resolved'
                    ? 'Coberto'
                    : item.status === 'partial'
                      ? 'Parcial'
                      : 'Sem preço'}
                </Badge>
                <Button
                  onClick={() =>
                    setDraftItems((current) => current.filter((entry) => entry.id !== item.id))
                  }
                  size="sm"
                  variant="ghost"
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function OptimizationPage() {
  const { listId } = useParams();
  const { lists, preferredMode, setPreferredMode } = usePricely();
  const list = lists.find((entry) => entry.id === listId) ?? lists[0];
  const scenarios = getOptimizationScenarios(list.id);
  const activeScenario =
    scenarios.find((scenario) => scenario.mode === preferredMode) ?? scenarios[0];

  if (!activeScenario) {
    return (
      <Alert>
        <AlertCircleIcon />
        <AlertTitle>Sem cenário disponível</AlertTitle>
        <AlertDescription>
          Essa lista ainda não tem um resultado local para exibir.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Resultado da otimização da lista
        </h1>
        <p className="text-muted-foreground">
          {list.name} · {getCityById(list.cityId).name}. O mesmo resultado pode ser aberto
          depois no mobile com a mesma conta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparador de modos</CardTitle>
          <CardDescription>
            Mude entre os três modos sem perder a leitura de cobertura, confiança e custo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <ToggleGroup
            onValueChange={(value) => {
              if (value) {
                setPreferredMode(value as OptimizationModeId);
              }
            }}
            type="single"
            value={activeScenario.mode}
          >
            {scenarios.map((scenario) => (
              <ToggleGroupItem key={scenario.mode} value={scenario.mode}>
                {scenario.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="grid gap-4 lg:grid-cols-4">
            <Card size="sm">
              <CardHeader>
                <CardDescription>Total estimado</CardDescription>
                <CardTitle>{formatCurrency(activeScenario.totalEstimatedCost)}</CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardDescription>Economia estimada</CardDescription>
                <CardTitle className="text-lime-700">
                  {formatCurrency(activeScenario.estimatedSavings)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardDescription>Cobertura</CardDescription>
                <CardTitle>{activeScenario.coverageLabel}</CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardDescription>Trade-off</CardDescription>
                <CardTitle>{activeScenario.tradeoffLabel}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="comparativo">
        <TabsList>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="detalhes">Itens e lojas</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
        </TabsList>
        <TabsContent value="comparativo">
          <div className="grid gap-4 md:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card key={scenario.mode} className={scenario.mode === activeScenario.mode ? 'ring-2 ring-primary/30' : undefined}>
                <CardHeader>
                  <CardTitle>{scenario.label}</CardTitle>
                  <CardDescription>{scenario.summary}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span>{formatCurrency(scenario.totalEstimatedCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Economia</span>
                    <span className="text-lime-700">{formatCurrency(scenario.estimatedSavings)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="detalhes">
          <Card>
            <CardHeader>
              <CardTitle>Decisão por item</CardTitle>
              <CardDescription>
                Fonte, data e confiança seguem visíveis para cada escolha.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Atualização</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeScenario.decisions.map((decision) => (
                    <TableRow key={decision.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{decision.itemName}</span>
                          <span className="text-xs text-muted-foreground">{decision.quantityLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {decision.storeName ? (
                          <div className="flex flex-col gap-1">
                            <span>{decision.storeName}</span>
                            <span className="text-xs text-muted-foreground">{decision.neighborhood}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sem loja sugerida</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {decision.price ? formatCurrency(decision.price) : 'Sem preço confirmado'}
                      </TableCell>
                      <TableCell>{decision.sourceLabel ?? 'Revisão manual'}</TableCell>
                      <TableCell>
                        {decision.updatedAt ? formatFreshnessLabel(decision.updatedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {confidenceBadge(decision.confidence)}
                          <span className="text-xs text-muted-foreground">{decision.note}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="observacoes">
          <div className="grid gap-4 lg:grid-cols-2">
            <Alert>
              <BadgeCheckIcon />
              <AlertTitle>Recomendado para você</AlertTitle>
              <AlertDescription>{activeScenario.summary}</AlertDescription>
            </Alert>
            <Alert>
              <ReceiptTextIcon />
              <AlertTitle>Observação de confiança</AlertTitle>
              <AlertDescription>
                Se algum item cair para confiança baixa, o app mantém o item visível e
                marca a decisão para revisão, sem preencher preço inventado.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
