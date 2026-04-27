import { useEffect, useState, type FormEvent } from 'react';

import {
  type AdminEstablishmentResponse,
  type AdminMetricsResponse,
  type AdminOfferResponse,
  type AdminProcessingJobResponse,
  type AdminProductResponse,
  type AdminProductVariantResponse,
  type AdminQueueHealthResponse,
  type AdminRegionResponse,
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
  updateAdminOffer,
  updateAdminProduct,
  updateAdminProductVariant,
  updateAdminRegion,
} from '@/app/api';
import { formatCurrency, formatFreshnessLabel } from '@/app/format';
import { usePricely } from '@/app/pricely-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
        <AlertTitle>Falha ao carregar metricas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return <Card><CardHeader><CardTitle>Carregando metricas</CardTitle></CardHeader></Card>;
  }

  const cards = [
    ['Usuarios ativos', String(data.activeUsers)],
    ['Listas criadas', String(data.shoppingListsCount)],
    ['Otimizacoes concluidas', String(data.optimizationRunsCount)],
    ['Regioes ativas', String(data.activeRegions)],
    ['Estabelecimentos ativos', String(data.activeEstablishments)],
    ['Ofertas ativas', String(data.activeOffers)],
    ['Produtos ativos', String(data.productCount)],
    ['Jobs em fila', String(data.queuedJobs)],
  ];
  const isEmptyState = cards.every(([, value]) => value === '0');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Visao geral operacional</h1>
        <p className="text-muted-foreground">
          O dashboard administrativo agora consome metricas reais do backend.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {isEmptyState ? (
        <Alert>
          <AlertTitle>Nenhuma metrica operacional ainda</AlertTitle>
          <AlertDescription>
            O ambiente ainda nao registrou usuarios ativos, listas, ofertas ou jobs. Use seed ou operacoes admin para popular o sistema.
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
  const [form, setForm] = useState({
    catalogProductId: '',
    productVariantId: '',
    establishmentId: '',
    displayName: '',
    packageLabel: '',
    priceAmount: '',
  });
  const productVariants = products.flatMap((product) =>
    product.productVariants.map((variant) => ({
      ...variant,
      catalogProductId: product.id,
      productName: product.name,
    })),
  );

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
            <div className="flex gap-2">
              <Input placeholder="Preco" value={form.priceAmount} onChange={(event) => setForm((current) => ({ ...current, priceAmount: event.target.value }))} />
              <Button type="submit">{editingOfferId ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Precos e ofertas</CardTitle>
          <CardDescription>Leitura real de ofertas ativas e inativas.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar ofertas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Preco</TableHead>
                  <TableHead>Atualizacao</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>{offer.productVariant.displayName}</TableCell>
                    <TableCell>{offer.establishment.unitName}</TableCell>
                    <TableCell>{formatCurrency(Number(offer.priceAmount))}</TableCell>
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
  const [form, setForm] = useState({
    slug: '',
    name: '',
    category: '',
    defaultUnit: '',
    imageUrl: '',
    alias: '',
  });
  const [variantForm, setVariantForm] = useState({
    catalogProductId: '',
    slug: '',
    displayName: '',
    brandName: '',
    variantLabel: '',
    packageLabel: '',
    imageUrl: '',
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
    setForm({ slug: '', name: '', category: '', defaultUnit: '', imageUrl: '', alias: '' });
    setEditingProductId(null);
    await reload();
  };

  const handleCreateVariant = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    if (editingVariantId) {
      await updateAdminProductVariant(accessToken, editingVariantId, variantForm);
    } else {
      await createAdminProductVariant(accessToken, variantForm);
    }
    setVariantForm({
      catalogProductId: '',
      slug: '',
      displayName: '',
      brandName: '',
      variantLabel: '',
      packageLabel: '',
      imageUrl: '',
    });
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
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreate}>
              <Input placeholder="slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <Input placeholder="nome" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="categoria" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
              <Input placeholder="unidade padrao" value={form.defaultUnit} onChange={(event) => setForm((current) => ({ ...current, defaultUnit: event.target.value }))} />
              <Input placeholder="imagem do produto" value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} />
              <Input placeholder="alias inicial" value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} />
              <Button type="submit">{editingProductId ? 'Salvar produto' : 'Criar produto'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingVariantId ? 'Editar variante' : 'Nova variante'}</CardTitle>
            <CardDescription>Cadastre marca, embalagem e imagem por produto base.</CardDescription>
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
              <Input placeholder="slug da variante" value={variantForm.slug} onChange={(event) => setVariantForm((current) => ({ ...current, slug: event.target.value }))} />
              <Input placeholder="nome exibido" value={variantForm.displayName} onChange={(event) => setVariantForm((current) => ({ ...current, displayName: event.target.value }))} />
              <Input placeholder="marca" value={variantForm.brandName} onChange={(event) => setVariantForm((current) => ({ ...current, brandName: event.target.value }))} />
              <Input placeholder="linha ou tipo" value={variantForm.variantLabel} onChange={(event) => setVariantForm((current) => ({ ...current, variantLabel: event.target.value }))} />
              <Input placeholder="embalagem" value={variantForm.packageLabel} onChange={(event) => setVariantForm((current) => ({ ...current, packageLabel: event.target.value }))} />
              <Input placeholder="imagem da variante" value={variantForm.imageUrl} onChange={(event) => setVariantForm((current) => ({ ...current, imageUrl: event.target.value }))} />
              <Button type="submit" variant="outline">{editingVariantId ? 'Salvar variante' : 'Criar variante'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogo</CardTitle>
          <CardDescription>Produtos, imagens, aliases e variantes saem do banco real.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao carregar catalogo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            products.map((product) => {
              const productVariants = variants.filter((variant) => variant.catalogProductId === product.id);
              const previewImage = productVariants.find((variant) => variant.imageUrl)?.imageUrl ?? product.imageUrl;

              return (
                <div key={product.id} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {previewImage ? (
                        <img
                          alt={product.name}
                          className="mb-3 h-24 w-24 rounded-lg border border-border/70 object-cover"
                          src={previewImage}
                        />
                      ) : null}
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.category} - {product.defaultUnit ?? 'sem unidade padrao'}</div>
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
                          imageUrl: product.imageUrl ?? '',
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
                      <button
                        key={variant.id}
                        className="rounded-md border border-border bg-muted px-2 py-1 text-sm"
                        type="button"
                        onClick={() => {
                          setEditingVariantId(variant.id);
                          setVariantForm({
                            catalogProductId: variant.catalogProductId,
                            slug: variant.slug ?? '',
                            displayName: variant.displayName,
                            brandName: variant.brandName ?? '',
                            variantLabel: variant.variantLabel ?? '',
                            packageLabel: variant.packageLabel ?? '',
                            imageUrl: variant.imageUrl ?? '',
                          });
                        }}
                      >
                        {variant.brandName ? `${variant.brandName} - ` : ''}{variant.displayName}
                      </button>
                    ))}
                  </div>
                  {productVariants.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {productVariants.map((variant) => (
                        <Button
                          key={`${variant.id}-toggle`}
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!accessToken) {
                              return;
                            }
                            await updateAdminProductVariant(accessToken, variant.id, { isActive: !variant.isActive });
                            await reloadVariants();
                          }}
                        >
                          {variant.isActive ? `Desativar ${variant.displayName}` : `Ativar ${variant.displayName}`}
                        </Button>
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

export function AdminListsPage() {
  const { data: metrics } = useAdminData<AdminMetricsResponse | null>(fetchAdminMetrics, null);
  const { lists } = usePricely();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listas e otimizacoes</CardTitle>
        <CardDescription>
          Resumo de listas vistas pela conta atual e totais do backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {metrics ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Listas no sistema</div>
              <div className="text-2xl font-semibold">{metrics.shoppingListsCount}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Otimizacoes concluidas</div>
              <div className="text-2xl font-semibold">{metrics.optimizationRunsCount}</div>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Listas da sessao atual</div>
              <div className="text-2xl font-semibold">{lists.length}</div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AdminQueuePage() {
  const { data: metrics } = useAdminData<AdminMetricsResponse | null>(fetchAdminMetrics, null);
  const { data: jobs } = useAdminData<AdminProcessingJobResponse[]>(fetchAdminProcessingJobs, []);
  const { data: queueHealth } = useAdminData<AdminQueueHealthResponse | null>(fetchAdminQueueHealth, null);
  const { data: regions, reload } = useAdminData<AdminRegionResponse[]>(fetchAdminRegions, []);
  const { data: establishments, reload: reloadEstablishments } = useAdminData<AdminEstablishmentResponse[]>(fetchAdminEstablishments, []);
  const { accessToken } = usePricely();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '',
    name: '',
    stateCode: '',
    implantationStatus: 'activating',
    publicSortOrder: '0',
  });
  const [establishmentForm, setEstablishmentForm] = useState({
    brandName: '',
    unitName: '',
    cnpj: '',
    cityName: '',
    neighborhood: '',
    regionId: '',
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
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : 'Nao foi possivel criar a regiao.',
      );
    }
  };

  const handleCreateEstablishment = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    try {
      setMutationError(null);
      await createAdminEstablishment(accessToken, establishmentForm);
      setEstablishmentForm({
        brandName: '',
        unitName: '',
        cnpj: '',
        cityName: '',
        neighborhood: '',
        regionId: '',
      });
      await reloadEstablishments();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel criar o estabelecimento.',
      );
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Regioes e estabelecimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {mutationError ? (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Falha ao salvar</AlertTitle>
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          ) : null}
          <form className="grid gap-3" onSubmit={handleCreate}>
            <Input placeholder="slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            <Input placeholder="nome" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="UF" value={form.stateCode} onChange={(event) => setForm((current) => ({ ...current, stateCode: event.target.value }))} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.implantationStatus} onChange={(event) => setForm((current) => ({ ...current, implantationStatus: event.target.value }))}>
              <option value="active">active</option>
              <option value="activating">activating</option>
              <option value="inactive">inactive</option>
            </select>
            <Input placeholder="ordem publica" value={form.publicSortOrder} onChange={(event) => setForm((current) => ({ ...current, publicSortOrder: event.target.value }))} />
            <Button type="submit">Criar regiao</Button>
          </form>
          <div className="my-4 h-px bg-border" />
          <form className="grid gap-3" onSubmit={handleCreateEstablishment}>
            <Input placeholder="brandName" value={establishmentForm.brandName} onChange={(event) => setEstablishmentForm((current) => ({ ...current, brandName: event.target.value }))} />
            <Input placeholder="unitName" value={establishmentForm.unitName} onChange={(event) => setEstablishmentForm((current) => ({ ...current, unitName: event.target.value }))} />
            <Input placeholder="cnpj" value={establishmentForm.cnpj} onChange={(event) => setEstablishmentForm((current) => ({ ...current, cnpj: event.target.value }))} />
            <Input placeholder="cidade" value={establishmentForm.cityName} onChange={(event) => setEstablishmentForm((current) => ({ ...current, cityName: event.target.value }))} />
            <Input placeholder="bairro" value={establishmentForm.neighborhood} onChange={(event) => setEstablishmentForm((current) => ({ ...current, neighborhood: event.target.value }))} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={establishmentForm.regionId} onChange={(event) => setEstablishmentForm((current) => ({ ...current, regionId: event.target.value }))}>
              <option value="">Regiao</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            <Button type="submit" variant="outline">Criar estabelecimento</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fila e regioes</CardTitle>
          <CardDescription>
            Jobs pendentes e estados de implantacao saem do backend real.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {metrics ? (
            <div className="rounded-lg border border-border/70 p-4">
              <div className="text-sm text-muted-foreground">Jobs em fila</div>
              <div className="text-2xl font-semibold">{metrics.queuedJobs}</div>
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
          {regions.map((region) => (
            <div key={region.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{region.name} · {region.stateCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {region.slug} · {region.establishmentsCount} estabelecimentos
                  </div>
                </div>
                <Badge variant={region.implantationStatus === 'active' ? 'secondary' : 'outline'}>
                  {region.implantationStatus}
                </Badge>
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!accessToken) {
                      return;
                    }

                    try {
                      setMutationError(null);
                      await updateAdminRegion(accessToken, region.id, {
                        implantationStatus:
                          region.implantationStatus === 'active' ? 'inactive' : 'active',
                      });
                      await reload();
                    } catch (error) {
                      setMutationError(
                        error instanceof Error
                          ? error.message
                          : 'Nao foi possivel atualizar a regiao.',
                      );
                    }
                  }}
                >
                  {region.implantationStatus === 'active' ? 'Desativar regiao' : 'Ativar regiao'}
                </Button>
              </div>
            </div>
          ))}
          {establishments.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{entry.unitName}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.cityName} · {entry.neighborhood}
                  </div>
                </div>
                <Badge variant={entry.isActive ? 'secondary' : 'outline'}>
                  {entry.isActive ? 'ativo' : 'inativo'}
                </Badge>
              </div>
            </div>
          ))}
          {jobs.slice(0, 6).map((job) => (
            <div key={job.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{job.resourceType} · {job.resourceId}</div>
                  <div className="text-sm text-muted-foreground">
                    {job.queueName} · tentativa {job.attemptCount}
                  </div>
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
