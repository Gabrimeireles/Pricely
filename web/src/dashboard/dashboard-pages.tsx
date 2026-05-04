import { useEffect, useState, type FormEvent } from 'react';

import { ChevronDownIcon, ChevronUpIcon, ImageUpIcon, InfoIcon } from 'lucide-react';

import {
  type AdminEstablishmentResponse,
  type AdminMetricsResponse,
  type AdminOfferResponse,
  type AdminProcessingJobResponse,
  type AdminProductResponse,
  type AdminProductVariantResponse,
  type AdminQueueHealthResponse,
  type AdminRegionResponse,
  type AdminShoppingListAuditResponse,
  createAdminEstablishment,
  createAdminOffer,
  createAdminProduct,
  createAdminProductVariant,
  createAdminRegion,
  fetchAdminEstablishments,
  fetchAdminMetrics,
  fetchAdminOffers,
  fetchAdminProcessingJobs,
  fetchAdminProducts,
  fetchAdminProductVariants,
  fetchAdminQueueHealth,
  fetchAdminRegions,
  fetchAdminShoppingLists,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function useAdminData<T>(loader: (token: string) => Promise<T>, initialValue: T) {
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
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar dados administrativos.');
    }
  };

  useEffect(() => {
    void reload();
  }, [accessToken]);

  return { data, error, reload };
}

export function AdminOverviewPage() {
  const { data, error } = useAdminData<AdminMetricsResponse | null>(fetchAdminMetrics, null);
  const { data: queueHealth } = useAdminData<AdminQueueHealthResponse | null>(fetchAdminQueueHealth, null);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Falha ao carregar métricas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return <Card><CardHeader><CardTitle>Carregando métricas</CardTitle></CardHeader></Card>;
  }

  const cards = [
    { label: 'Usuarios ativos', value: String(data.activeUsers), numericValue: data.activeUsers },
    { label: 'Listas criadas', value: String(data.shoppingListsCount), numericValue: data.shoppingListsCount },
    { label: 'Otimizacoes concluidas', value: String(data.optimizationRunsCount), numericValue: data.optimizationRunsCount },
    { label: 'Economia global', value: formatCurrency(data.globalEstimatedSavings), numericValue: data.globalEstimatedSavings },
    { label: 'Regioes ativas', value: String(data.activeRegions), numericValue: data.activeRegions },
    { label: 'Estabelecimentos ativos', value: String(data.activeEstablishments), numericValue: data.activeEstablishments },
    { label: 'Ofertas ativas', value: String(data.activeOffers), numericValue: data.activeOffers },
    { label: 'Produtos ativos', value: String(data.productCount), numericValue: data.productCount },
    { label: 'Jobs em fila', value: String(data.queuedJobs), numericValue: data.queuedJobs },
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
    Math.round((data.optimizationRunsCount / Math.max(data.shoppingListsCount, 1)) * 100),
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
            Math.max(queueHealth.completedJobs + queueHealth.failedJobs + queueHealth.queuedJobs + queueHealth.runningJobs, 1)) *
            100,
        ),
      )
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Visao geral operacional</h1>
        <p className="text-muted-foreground">
          O dashboard administrativo consolida cidade, catálogo, filas e uso real do produto.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map((entry) => (
          <Card key={entry.label} className="border-border/70 bg-card/90 shadow-sm">
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
            <CardDescription>Leituras visuais para listas, catálogo e fila.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Listas processadas</span>
                <span className="font-medium">{completionRatio}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-[#0F766E]" style={{ width: `${completionRatio}%` }} />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Catálogo com oferta ativa</span>
                <span className="font-medium">{catalogRatio}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-[#2563EB]" style={{ width: `${catalogRatio}%` }} />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pressao atual de fila</span>
                <span className="font-medium">{queuePressure}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-[#84CC16]" style={{ width: `${queuePressure}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Sinais do dia</CardTitle>
            <CardDescription>Resumo rapido para identificar onde a operacao esta apertando.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border border-border/70 bg-[#ECFDF5] p-4">
              <div className="text-sm text-[#166534]">Regioes ativas</div>
              <div className="mt-2 text-2xl font-semibold text-[#14532D]">{data.activeRegions}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-[#EFF6FF] p-4">
              <div className="text-sm text-[#1D4ED8]">Ofertas ativas</div>
              <div className="mt-2 text-2xl font-semibold text-[#1E3A8A]">{data.activeOffers}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-[#FFF7ED] p-4">
              <div className="text-sm text-[#C2410C]">Jobs aguardando</div>
              <div className="mt-2 text-2xl font-semibold text-[#9A3412]">{data.queuedJobs}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Prioridade operacional</div>
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
                <Badge variant={queuePressure >= 60 ? 'destructive' : 'secondary'}>
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
            Leitura lado a lado para volume de usuarios, listas, ofertas e filas.
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
              <div key={String(label)} className="grid gap-2 rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-lg font-semibold">{value}</span>
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[0.25, 0.45, 0.65, 0.85, 1].map((ratio, index) => (
                    <div key={`${label}-${index}`} className="flex-1 rounded-md bg-muted">
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
            O ambiente ainda não registrou usuários ativos, listas, ofertas ou jobs. Use seed ou operações admin para popular o sistema.
          </AlertDescription>
        </Alert>
      ) : null}

      {queueHealth ? (
        <Card>
          <CardHeader>
            <CardTitle>Saude das filas</CardTitle>
            <CardDescription>Resumo persistido de fila, retry e falha.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Em fila</div>
              <div className="text-2xl font-semibold">{queueHealth.queuedJobs}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Executando</div>
              <div className="text-2xl font-semibold">{queueHealth.runningJobs}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Falhos</div>
              <div className="text-2xl font-semibold">{queueHealth.failedJobs}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Filas</div>
              <div className="text-2xl font-semibold">{queueHealth.queues.length}</div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function AdminPricesPage() {
  const { data: offers, error, reload } = useAdminData<AdminOfferResponse[]>(fetchAdminOffers, []);
  const { data: products } = useAdminData<AdminProductResponse[]>(fetchAdminProducts, []);
  const { data: establishments } = useAdminData<AdminEstablishmentResponse[]>(fetchAdminEstablishments, []);
  const { accessToken } = usePricely();
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
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

    const payload = {
      catalogProductId: form.catalogProductId,
      productVariantId: form.productVariantId,
      establishmentId: form.establishmentId,
      displayName: form.displayName,
      packageLabel: form.packageLabel,
      priceAmount: Number(form.priceAmount),
      basePriceAmount: form.basePriceAmount ? Number(form.basePriceAmount) : Number(form.priceAmount),
      promotionalPriceAmount: form.promotionalPriceAmount ? Number(form.promotionalPriceAmount) : null,
      availabilityStatus: 'available',
      confidenceLevel: 'high',
    };

    if (editingOfferId) {
      await updateAdminOffer(accessToken, editingOfferId, payload);
    } else {
      await createAdminOffer(accessToken, payload);
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
          <CardTitle>{editingOfferId ? 'Editar oferta' : 'Criar oferta'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-6" onSubmit={handleCreate}>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.productVariantId}
              onChange={(event) => {
                const selected = productVariants.find((variant) => variant.id === event.target.value);
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
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.establishmentId} onChange={(event) => setForm((current) => ({ ...current, establishmentId: event.target.value }))}>
              <option value="">Estabelecimento</option>
              {establishments.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.unitName}</option>
              ))}
            </select>
            <Input placeholder="Nome exibido" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
            <Input placeholder="Embalagem" value={form.packageLabel} onChange={(event) => setForm((current) => ({ ...current, packageLabel: event.target.value }))} />
            <Input placeholder="Preço base" value={form.basePriceAmount} onChange={(event) => setForm((current) => ({ ...current, basePriceAmount: event.target.value }))} />
            <Input placeholder="Preço promocional" value={form.promotionalPriceAmount} onChange={(event) => setForm((current) => ({ ...current, promotionalPriceAmount: event.target.value, priceAmount: event.target.value || current.basePriceAmount || current.priceAmount }))} />
            <div className="flex gap-2">
              <Input placeholder="Preço efetivo" value={form.priceAmount} onChange={(event) => setForm((current) => ({ ...current, priceAmount: event.target.value }))} />
              <Button type="submit">{editingOfferId ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preços e ofertas</CardTitle>
          <CardDescription>Produto original, variantes disponíveis e ofertas por estabelecimento.</CardDescription>
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
                <div key={product.id} className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Produto original · {groupedOffers.length} ofertas cadastradas
                      </div>
                    </div>
                    <Button
                      onClick={() => setExpandedProductId(expanded ? null : product.id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
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
                                <div className="grid gap-1">
                                  <span className="font-medium">{offer.productVariant.displayName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {offer.productVariant.brandName ?? 'Marca livre'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{offer.establishment.unitName}</TableCell>
                              <TableCell>
                                <div className="grid gap-1">
                                  {offer.promotionalPriceAmount && offer.basePriceAmount ? (
                                    <span className="text-xs text-muted-foreground line-through">
                                      {formatCurrency(Number(offer.basePriceAmount))}
                                    </span>
                                  ) : null}
                                  <span>{formatCurrency(Number(offer.priceAmount))}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatFreshnessLabel(offer.observedAt)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant={offer.isActive ? 'secondary' : 'outline'}>
                                    {offer.availabilityStatus}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingOfferId(offer.id);
                                      setForm({
                                        catalogProductId: offer.catalogProduct.id,
                                        productVariantId: offer.productVariant.id,
                                        establishmentId: offer.establishment.id,
                                        displayName: offer.displayName,
                                        packageLabel: offer.packageLabel,
                                        priceAmount: String(offer.priceAmount),
                                        basePriceAmount: offer.basePriceAmount ? String(offer.basePriceAmount) : '',
                                        promotionalPriceAmount: offer.promotionalPriceAmount ? String(offer.promotionalPriceAmount) : '',
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

                                      await updateAdminOffer(accessToken, offer.id, { isActive: !offer.isActive });
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
  const { data: products, error, reload } = useAdminData<AdminProductResponse[]>(fetchAdminProducts, []);
  const { data: variants, reload: reloadVariants } = useAdminData<AdminProductVariantResponse[]>(fetchAdminProductVariants, []);
  const { accessToken } = usePricely();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantImageFile, setVariantImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    category: '',
    defaultUnit: '',
    alias: '',
  });
  const [variantForm, setVariantForm] = useState({
    catalogProductId: '',
    slug: '',
    displayName: '',
    brandName: '',
    variantLabel: '',
    packageLabel: '',
  });

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

    setForm({ slug: '', name: '', category: '', defaultUnit: '', alias: '' });
    setEditingProductId(null);
    await reload();
  };

  const handleCreateVariant = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    const savedVariant = editingVariantId
      ? await updateAdminProductVariant(accessToken, editingVariantId, variantForm)
      : await createAdminProductVariant(accessToken, variantForm);

    if (variantImageFile) {
      await uploadAdminProductVariantImage(accessToken, savedVariant.id, variantImageFile);
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
            <CardTitle>{editingProductId ? 'Editar produto' : 'Novo produto'}</CardTitle>
            <CardDescription>
              O produto original é o item comparável. A imagem fica nas variantes e a vitrine usa a primeira variante com imagem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreate}>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                O identificador público vira o endereço amigável do produto no sistema interno e nas rotas públicas.
              </div>
              <Input placeholder="Identificador público do produto" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <Input placeholder="Nome do produto" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="Categoria" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
              <Input placeholder="Unidade padrão" value={form.defaultUnit} onChange={(event) => setForm((current) => ({ ...current, defaultUnit: event.target.value }))} />
              <Input placeholder="Alias inicial" value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} />
              <Button type="submit">{editingProductId ? 'Salvar produto' : 'Criar produto'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingVariantId ? 'Editar variante' : 'Nova variante'}</CardTitle>
            <CardDescription>Cadastre marca e imagem por produto base. A variante é o item real exibido para o cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreateVariant}>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={variantForm.catalogProductId}
                onChange={(event) => setVariantForm((current) => ({ ...current, catalogProductId: event.target.value }))}
              >
                <option value="">Produto base</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <Input placeholder="Identificador público da variante" value={variantForm.slug} onChange={(event) => setVariantForm((current) => ({ ...current, slug: event.target.value }))} />
              <Input placeholder="Nome exibido" value={variantForm.displayName} onChange={(event) => setVariantForm((current) => ({ ...current, displayName: event.target.value }))} />
              <Input placeholder="Marca" value={variantForm.brandName} onChange={(event) => setVariantForm((current) => ({ ...current, brandName: event.target.value }))} />
              <Input placeholder="Apresentação opcional" value={variantForm.packageLabel} onChange={(event) => setVariantForm((current) => ({ ...current, packageLabel: event.target.value }))} />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-background/80 px-4 py-3 text-sm font-medium">
                <ImageUpIcon className="size-4" />
                <span>{variantImageFile ? variantImageFile.name : 'Enviar imagem da variante'}</span>
                <input accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setVariantImageFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
              <Button type="submit" variant="outline">{editingVariantId ? 'Salvar variante' : 'Criar variante'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <CardDescription>Produtos, imagens, aliases e variantes saem do banco real.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar catálogo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            products.map((product) => {
              const productVariants = variants.filter((variant) => variant.catalogProductId === product.id);
              const previewImage = productVariants.find((variant) => variant.imageUrl)?.imageUrl ?? product.imageUrl;

              return (
                <div key={product.id} className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm">
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
                      <div className="text-sm text-muted-foreground">{product.category} - {product.defaultUnit ?? 'sem unidade padrão'}</div>
                      <div className="text-xs text-muted-foreground">Identificador público: {product.slug}</div>
                    </div>
                    <Badge variant="secondary">{product._count.productOffers} ofertas</Badge>
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
                          alias: '',
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
                        await updateAdminProduct(accessToken, product.id, { isActive: !product.isActive });
                        await reload();
                      }}
                    >
                      {product.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.aliases.map((alias) => (
                      <Badge key={alias.id} variant="outline">{alias.alias}</Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {productVariants.map((variant) => (
                      <div key={variant.id} className="min-w-[280px] rounded-lg border-2 border-border/70 bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              alt={variant.displayName}
                              className="h-12 w-12 rounded-lg border border-border/70 object-cover"
                              src={resolveProductImage(variant.imageUrl)}
                            />
                            <div className="grid gap-1">
                              <div className="text-sm font-medium">
                                {variant.brandName ? `${variant.brandName} - ` : ''}{variant.displayName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {variant.packageLabel ?? 'Apresentação não informada'} · Identificador público: {variant.slug ?? 'não definido'}
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
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                          <span className="text-sm font-medium">Ativo</span>
                          <Switch
                            checked={variant.isActive}
                            onCheckedChange={async (checked) => {
                              if (!accessToken) {
                                return;
                              }
                              await updateAdminProductVariant(accessToken, variant.id, { isActive: checked });
                              await reloadVariants();
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
  const { data: regions, error, reload } = useAdminData<AdminRegionResponse[]>(fetchAdminRegions, []);
  const { accessToken } = usePricely();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    stateCode: '',
    implantationStatus: 'activating',
    publicSortOrder: '0',
  });

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    try {
      setMutationError(null);
      await createAdminRegion(accessToken, {
        ...form,
        publicSortOrder: Number(form.publicSortOrder),
      });
      setForm({ slug: '', name: '', stateCode: '', implantationStatus: 'activating', publicSortOrder: '0' });
      await reload();
    } catch (createError) {
      setMutationError(createError instanceof Error ? createError.message : 'Não foi possível criar a cidade.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cidades e implantacao</CardTitle>
          <CardDescription>Gerencie quais cidades aparecem para o usuário final.</CardDescription>
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
                  <span className="font-medium text-foreground">Como preencher</span>
                  <span>
                    O identificador público vira o endereço público da cidade, por exemplo
                    <span className="font-medium"> sao-paulo-sp</span>.
                  </span>
                  <span>
                    A quantidade de estabelecimentos ativos é calculada automaticamente pelo backend.
                  </span>
                </div>
              </div>
            </div>
            <Input placeholder="Identificador público da cidade" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            <Input placeholder="Nome da cidade" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="UF" value={form.stateCode} onChange={(event) => setForm((current) => ({ ...current, stateCode: event.target.value }))} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.implantationStatus} onChange={(event) => setForm((current) => ({ ...current, implantationStatus: event.target.value }))}>
              <option value="active">Ativa</option>
              <option value="activating">Em ativação</option>
              <option value="inactive">Inativa</option>
            </select>
            <Input placeholder="Ordem pública" value={form.publicSortOrder} onChange={(event) => setForm((current) => ({ ...current, publicSortOrder: event.target.value }))} />
            <Button type="submit">Criar cidade</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cidades públicas</CardTitle>
          <CardDescription>Cada cidade mostra quantos estabelecimentos ativos existem hoje.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar cidades</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {regions.map((region) => (
            <div key={region.id} className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{region.name} · {region.stateCode}</div>
                  <div className="text-sm text-muted-foreground">
                    Identificador público: {region.slug} · {region.activeEstablishmentsCount} estabelecimentos ativos
                  </div>
                </div>
                <Badge variant={region.implantationStatus === 'active' ? 'secondary' : 'outline'}>
                  {region.implantationStatus === 'active' ? 'ativa' : region.implantationStatus === 'activating' ? 'em ativação' : 'inativa'}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="text-sm text-muted-foreground">
                  A cidade fica visível no seletor público somente quando estiver ativa ou em ativação.
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
                      implantationStatus: region.implantationStatus === 'active' ? 'inactive' : 'active',
                    });
                    await reload();
                  }}
                >
                  {region.implantationStatus === 'active' ? 'Desativar cidade' : 'Ativar cidade'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminEstablishmentsPage() {
  const { data: regions } = useAdminData<AdminRegionResponse[]>(fetchAdminRegions, []);
  const { data: establishments, error, reload } = useAdminData<AdminEstablishmentResponse[]>(fetchAdminEstablishments, []);
  const { accessToken } = usePricely();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [form, setForm] = useState({
    brandName: '',
    unitName: '',
    cnpj: '',
    cityName: '',
    neighborhood: '',
    regionId: '',
  });

  const filtered = selectedRegionId === 'all'
    ? establishments
    : establishments.filter((entry) => entry.regionId === selectedRegionId);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    try {
      setMutationError(null);
      await createAdminEstablishment(accessToken, form);
      setForm({
        brandName: '',
        unitName: '',
        cnpj: '',
        cityName: '',
        neighborhood: '',
        regionId: '',
      });
      await reload();
    } catch (createError) {
      setMutationError(createError instanceof Error ? createError.message : 'Não foi possível criar o estabelecimento.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Estabelecimentos</CardTitle>
          <CardDescription>Cadastre unidade, CNPJ e cidade associada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {mutationError ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao salvar</AlertTitle>
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          ) : null}
          <form className="grid gap-3" onSubmit={handleCreate}>
            <Input placeholder="rede" value={form.brandName} onChange={(event) => setForm((current) => ({ ...current, brandName: event.target.value }))} />
            <Input placeholder="nome da unidade" value={form.unitName} onChange={(event) => setForm((current) => ({ ...current, unitName: event.target.value }))} />
            <Input placeholder="cnpj" value={form.cnpj} onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))} />
            <Input placeholder="Cidade" value={form.cityName} onChange={(event) => setForm((current) => ({ ...current, cityName: event.target.value }))} />
            <Input placeholder="bairro ou referencia" value={form.neighborhood} onChange={(event) => setForm((current) => ({ ...current, neighborhood: event.target.value }))} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.regionId} onChange={(event) => setForm((current) => ({ ...current, regionId: event.target.value }))}>
              <option value="">Cidade vinculada</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            <Button type="submit">Criar estabelecimento</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unidades por cidade</CardTitle>
          <CardDescription>Filtre por cidade e acompanhe o status de ativação das unidades.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedRegionId} onChange={(event) => setSelectedRegionId(event.target.value)}>
            <option value="all">Todas as cidades</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar estabelecimentos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-xl border-2 border-border/80 bg-card/95 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{entry.unitName}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.brandName} · {entry.cityName} · {entry.neighborhood}
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
                      await updateAdminEstablishment(accessToken, entry.id, { isActive: checked });
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

export function AdminListsPage() {
  const { data: metrics } = useAdminData<AdminMetricsResponse | null>(fetchAdminMetrics, null);
  const { lists } = usePricely();
  const { data: auditedLists, error } = useAdminData<AdminShoppingListAuditResponse[]>(
    fetchAdminShoppingLists,
    [],
  );
  const [selectedAudit, setSelectedAudit] = useState<AdminShoppingListAuditResponse | null>(null);

  return (
    <div className="grid gap-4">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Operacoes de listas</CardTitle>
          <CardDescription>
            Histórico auditável das listas processadas, com dono, cidade e última otimização.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {metrics ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Listas no sistema</div>
                <div className="text-2xl font-semibold">{metrics.shoppingListsCount}</div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Otimizacoes concluidas</div>
                <div className="text-2xl font-semibold">{metrics.optimizationRunsCount}</div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Economia global estimada</div>
                <div className="text-2xl font-semibold">{formatCurrency(metrics.globalEstimatedSavings)}</div>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <div className="text-sm text-muted-foreground">Listas da sessao atual</div>
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
              <div key={list.id} className="rounded-lg border-2 border-border/80 bg-background/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{list.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {list.owner.displayName} · {list.city ?? 'Cidade não definida'} · {list.itemCount} itens
                    </div>
                  </div>
                  <Button onClick={() => setSelectedAudit(list)} size="sm" variant="outline">
                    Auditar lista
                  </Button>
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
              Visualizacao de leitura para diagnosticar inconsistencias sem editar o conteudo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="font-medium">{selectedAudit.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedAudit.owner.displayName} · {selectedAudit.owner.email}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {selectedAudit.city ?? 'Cidade não definida'} · atualizada em {selectedAudit.updatedAt}
              </div>
            </div>
            {selectedAudit.latestOptimization ? (
              <div className="rounded-lg border border-border/70 p-4">
                <div className="font-medium">Última otimização</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {selectedAudit.latestOptimization.mode} · {selectedAudit.latestOptimization.status} · cobertura {selectedAudit.latestOptimization.coverageStatus}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Custo {formatCurrency(selectedAudit.latestOptimization.totalEstimatedCost)} · economia {formatCurrency(selectedAudit.latestOptimization.estimatedSavings)}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function AdminQueuePage() {
  const { data: metrics } = useAdminData<AdminMetricsResponse | null>(fetchAdminMetrics, null);
  const { data: jobs } = useAdminData<AdminProcessingJobResponse[]>(fetchAdminProcessingJobs, []);
  const { data: queueHealth } = useAdminData<AdminQueueHealthResponse | null>(fetchAdminQueueHealth, null);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Saude da fila</CardTitle>
          <CardDescription>Jobs pendentes, falhas recentes e capacidade de processamento.</CardDescription>
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
              <div className="text-sm font-medium">Falhas recentes</div>
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
                <div className="mt-2 text-2xl font-semibold text-[#14532D]">{queueHealth.completedJobs}</div>
              </div>
              <div className="rounded-lg border border-border/70 bg-[#EFF6FF] p-4">
                <div className="text-sm text-[#1D4ED8]">Filas monitoradas</div>
                <div className="mt-2 text-2xl font-semibold text-[#1E3A8A]">{queueHealth.queues.length}</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Jobs recentes</CardTitle>
          <CardDescription>Recursos processados, tentativas, status e identificadores persistidos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {jobs.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
              Fila vazia no momento. Nenhum job recente para auditoria.
            </div>
          ) : null}
          {jobs.slice(0, 10).map((job) => (
            <div key={job.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{job.resourceType} · {job.resourceId}</div>
                  <div className="text-sm text-muted-foreground">{job.queueName} · tentativa {job.attemptCount} · job {job.id}</div>
                </div>
                <Badge
                  variant={
                    job.status === 'failed'
                      ? 'destructive'
                      : job.status === 'retrying'
                        ? 'outline'
                        : 'secondary'
                  }
                >
                  {job.status}
                </Badge>
              </div>
              {job.failureReason ? (
                <div className="mt-2 text-sm text-muted-foreground">{job.failureReason}</div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
