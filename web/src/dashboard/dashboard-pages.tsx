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
  uploadAdminProductImage,
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
  const maxMetric = Math.max(
    data.activeUsers,
    data.shoppingListsCount,
    data.optimizationRunsCount,
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
          O dashboard administrativo consolida cidade, catalogo, filas e uso real do produto.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label} className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="gap-3">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.max(14, Math.min(100, (Number(value) / maxMetric) * 100))}%`,
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
            <CardDescription>Leituras visuais para listas, catalogo e fila.</CardDescription>
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
                <span className="text-muted-foreground">Catalogo com oferta ativa</span>
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
                        ? 'Catalogo com pouca cobertura'
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
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
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

    const savedProduct = editingProductId
      ? await updateAdminProduct(accessToken, editingProductId, form)
      : await createAdminProduct(accessToken, form);

    if (productImageFile) {
      await uploadAdminProductImage(accessToken, savedProduct.id, productImageFile);
    }
    setForm({ slug: '', name: '', category: '', defaultUnit: '', alias: '' });
    setProductImageFile(null);
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
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreate}>
              <Input placeholder="Identificador da URL" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <Input placeholder="Nome do produto" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="Categoria" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
              <Input placeholder="Unidade padrão" value={form.defaultUnit} onChange={(event) => setForm((current) => ({ ...current, defaultUnit: event.target.value }))} />
              <Input placeholder="Alias inicial" value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} />
              <Input accept="image/png,image/jpeg,image/webp" onChange={(event) => setProductImageFile(event.target.files?.[0] ?? null)} type="file" />
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
              <Input placeholder="Identificador da URL da variante" value={variantForm.slug} onChange={(event) => setVariantForm((current) => ({ ...current, slug: event.target.value }))} />
              <Input placeholder="Nome exibido" value={variantForm.displayName} onChange={(event) => setVariantForm((current) => ({ ...current, displayName: event.target.value }))} />
              <Input placeholder="Marca" value={variantForm.brandName} onChange={(event) => setVariantForm((current) => ({ ...current, brandName: event.target.value }))} />
              <Input placeholder="Linha ou tipo" value={variantForm.variantLabel} onChange={(event) => setVariantForm((current) => ({ ...current, variantLabel: event.target.value }))} />
              <Input placeholder="Embalagem" value={variantForm.packageLabel} onChange={(event) => setVariantForm((current) => ({ ...current, packageLabel: event.target.value }))} />
              <Input accept="image/png,image/jpeg,image/webp" onChange={(event) => setVariantImageFile(event.target.files?.[0] ?? null)} type="file" />
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
                          src={resolveProductImage(previewImage)}
                        />
                      ) : null}
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.category} - {product.defaultUnit ?? 'sem unidade padrao'}</div>
                      <div className="text-xs text-muted-foreground">URL pública: {product.slug}</div>
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
                        setProductImageFile(null);
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
                      <div key={variant.id} className="min-w-[280px] rounded-lg border border-border/70 bg-muted/20 p-3">
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
                                {variant.packageLabel ?? 'Sem embalagem'} · URL pública: {variant.slug ?? 'não definida'}
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
      setMutationError(createError instanceof Error ? createError.message : 'Nao foi possivel criar a cidade.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cidades e implantacao</CardTitle>
          <CardDescription>Gerencie quais cidades aparecem para o usuario final.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {mutationError ? (
            <Alert variant="destructive">
              <AlertTitle>Falha ao salvar</AlertTitle>
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          ) : null}
          <form className="grid gap-3" onSubmit={handleCreate}>
            <Input placeholder="Identificador da URL" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            <Input placeholder="nome da cidade" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="UF" value={form.stateCode} onChange={(event) => setForm((current) => ({ ...current, stateCode: event.target.value }))} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.implantationStatus} onChange={(event) => setForm((current) => ({ ...current, implantationStatus: event.target.value }))}>
              <option value="active">Ativa</option>
              <option value="activating">Em ativacao</option>
              <option value="inactive">Inativa</option>
            </select>
            <Input placeholder="ordem publica" value={form.publicSortOrder} onChange={(event) => setForm((current) => ({ ...current, publicSortOrder: event.target.value }))} />
            <Button type="submit">Criar cidade</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regioes publicas</CardTitle>
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
            <div key={region.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{region.name} · {region.stateCode}</div>
                  <div className="text-sm text-muted-foreground">
                    URL pública: {region.slug} · {region.establishmentsCount} estabelecimentos ativos
                  </div>
                </div>
                <Badge variant={region.implantationStatus === 'active' ? 'secondary' : 'outline'}>
                  {region.implantationStatus === 'active' ? 'ativa' : region.implantationStatus === 'activating' ? 'em ativa?o' : 'inativa'}
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
      setMutationError(createError instanceof Error ? createError.message : 'Nao foi possivel criar o estabelecimento.');
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
            <Input placeholder="cidade" value={form.cityName} onChange={(event) => setForm((current) => ({ ...current, cityName: event.target.value }))} />
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
          <CardDescription>Filtre por cidade e acompanhe o status de ativacao das unidades.</CardDescription>
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
            <div key={entry.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{entry.unitName}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.brandName} · {entry.cityName} · {entry.neighborhood}
                  </div>
                </div>
                <Badge variant={entry.isActive ? 'secondary' : 'outline'}>
                  {entry.isActive ? 'ativo' : 'inativo'}
                </Badge>
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
          <CardDescription>Recursos processados, tentativas e falhas persistidas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {jobs.slice(0, 6).map((job) => (
            <div key={job.id} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{job.resourceType} · {job.resourceId}</div>
                  <div className="text-sm text-muted-foreground">{job.queueName} · tentativa {job.attemptCount}</div>
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


