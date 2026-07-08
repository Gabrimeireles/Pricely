import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRightIcon,
  ListChecksIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHead, SectionTitle } from '@/components/shopper/section';
import {
  fetchCatalogProductVariants,
  requestMissingProduct,
  searchCatalogProducts,
  type CatalogProductSearchResponse,
  type ProductVariantResponse,
} from '@/app/api';
import { resolveProductImage } from '@/app/media';
import { usePricely } from '@/app/pricely-context';
import type { OptimizationModeId, ShoppingList } from '@/app/types';

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

function buildEditableItems(source?: ShoppingList): EditableListItem[] {
  if (!source) return [];
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

function getCatalogPreviewImage(product: CatalogProductSearchResponse) {
  return product.imageUrl ?? product.productVariants.find((v) => v.imageUrl)?.imageUrl;
}

const BRAND_LABELS: Record<string, string> = {
  any: 'Qualquer variante',
  preferred: 'Marcas preferidas',
  exact: 'Variante exata',
};

export function ListEditorPage() {
  const navigate = useNavigate();
  const { listId = 'nova' } = useParams();
  const { accessToken, cityId, cities, lists, preferredMode, saveList, shareList } = usePricely();

  const editingList = listId === 'nova' ? undefined : lists.find((l) => l.id === listId);

  const [name, setName] = useState(editingList?.name ?? '');
  const [selectedCityId, setSelectedCityId] = useState(editingList?.cityId ?? cityId ?? '');
  const [mode, setMode] = useState<OptimizationModeId>(editingList?.lastMode ?? preferredMode);
  const [items, setItems] = useState<EditableListItem[]>(() => buildEditableItems(editingList));

  const [draftName, setDraftName] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('1');
  const [draftUnit, setDraftUnit] = useState('un');
  const [draftNote, setDraftNote] = useState('');
  const [draftBrandMode, setDraftBrandMode] = useState<'any' | 'exact'>('any');

  const [catalogResults, setCatalogResults] = useState<CatalogProductSearchResponse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProductSearchResponse | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<ProductVariantResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [missingDialogOpen, setMissingDialogOpen] = useState(false);
  const [missingCategory, setMissingCategory] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVariant = selectedVariants.find((v) => v.id === selectedVariantId);
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  useEffect(() => {
    if (!editingList) return;
    setName(editingList.name);
    setSelectedCityId(editingList.cityId);
    setMode(editingList.lastMode);
    setItems(buildEditableItems(editingList));
  }, [editingList]);

  useEffect(() => {
    let disposed = false;
    const runSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchCatalogProducts(draftName.trim());
        if (!disposed) setCatalogResults(results);
      } catch {
        if (!disposed) setCatalogResults([]);
      } finally {
        if (!disposed) setIsSearching(false);
      }
    };
    void runSearch();
    return () => { disposed = true; };
  }, [draftName]);

  const addItem = (product = selectedProduct) => {
    if (!product) return;
    const displayName =
      draftBrandMode === 'exact' && selectedVariant
        ? `${selectedVariant.brandName ? `${selectedVariant.brandName} · ` : ''}${selectedVariant.displayName}`
        : product.name;
    setItems((cur) => [
      ...cur,
      {
        id: `draft-${Date.now()}`,
        name: displayName,
        catalogProductId: product.id,
        lockedProductVariantId: draftBrandMode === 'exact' ? selectedVariantId || undefined : undefined,
        brandPreferenceMode: draftBrandMode,
        preferredBrandNames: [],
        imageUrl: getCatalogPreviewImage(product) ?? undefined,
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
    setDraftBrandMode('any');
    setSelectedProduct(null);
    setSelectedVariantId('');
    setSelectedVariants([]);
    setBrandDialogOpen(false);
  };

  const removeItem = (id: string) => setItems((cur) => cur.filter((i) => i.id !== id));

  const adjustQty = (id: string, delta: number) =>
    setItems((cur) =>
      cur.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)),
    );

  const persistList = async (optimizeAfterSave: boolean) => {
    setError(null);
    if (!selectedCityId) { setError('Escolha a cidade antes de salvar.'); return; }
    if (!name.trim()) { setError('Defina um nome para a lista.'); return; }
    if (items.length === 0) { setError('Adicione pelo menos um item.'); return; }
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar a lista.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!editingList) { toast.error('Salve a lista antes de compartilhar.'); return; }
    try {
      const shared = await shareList(editingList.id);
      if (shared.shareUrl && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shared.shareUrl);
        toast.success('Link copiado para a área de transferência.');
      }
    } catch {
      toast.error('Não foi possível compartilhar a lista.');
    }
  };

  const canSave = !isSaving && !!selectedCityId && items.length > 0 && !!name.trim();

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); void persistList(false); }}>
      <button
        type="button"
        onClick={() => navigate('/listas')}
        className="mb-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--ds-location)] hover:underline"
      >
        <ArrowRightIcon className="size-3.5 rotate-180" /> Voltar para listas
      </button>

      <PageHead
        title={editingList ? 'Editar lista' : 'Nova lista'}
        subtitle={editingList ? `${items.length} ${items.length === 1 ? 'item' : 'itens'}` : 'Monte sua lista e otimize preços'}
        actions={
          <>
            {editingList && (
              <Button type="button" variant="outline" onClick={handleShare}>
                Compartilhar
              </Button>
            )}
            <Button type="button" variant="outline" disabled={!canSave} onClick={() => void persistList(false)}>
              {isSaving ? 'Salvando…' : 'Salvar rascunho'}
            </Button>
            <Button type="button" disabled={!canSave} onClick={() => void persistList(true)} className="bg-[#134e48] hover:bg-[#0f3f3a]">
              <SparklesIcon className="size-4" />
              {isSaving ? 'Salvando…' : 'Salvar e otimizar'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-[var(--ds-critical-border)] bg-[var(--ds-critical-soft)] px-4 py-3 text-[13.5px] text-[var(--ds-critical)]">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_322px]">
        {/* Main */}
        <div className="grid gap-4">
          <Card className="rounded-2xl p-5">
            <div className="grid gap-3">
              <div>
                <label htmlFor="list-name" className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">
                  Nome da lista
                </label>
                <Input
                  id="list-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Compra da semana"
                  maxLength={60}
                  className="text-[15px] font-semibold"
                />
              </div>

              {/* Hidden city select — kept for form data; city selector in topbar handles this */}
              <select
                className="sr-only"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
              >
                <option value="">Selecione a cidade</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {selectedCity && (
                <div className="flex items-center gap-2">
                  <StatusBadge tone="location">{selectedCity.name}</StatusBadge>
                  <StatusBadge tone="neutral">{selectedCity.activeStoreCount} lojas</StatusBadge>
                </div>
              )}
            </div>
          </Card>

          {/* Items */}
          <div>
            <SectionTitle>Itens da lista ({items.length})</SectionTitle>
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center text-muted-foreground">
                <ListChecksIcon className="size-8 opacity-30" />
                <p className="text-[14px] font-semibold">Lista vazia</p>
                <p className="text-[12.5px]">Busque produtos no painel à direita e adicione à lista.</p>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {items.map((item) => (
                  <Card key={item.id} className="rounded-2xl p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="size-[46px] shrink-0 overflow-hidden rounded-[11px] bg-[var(--ds-neutral-soft)]">
                        {item.imageUrl ? (
                          <img src={resolveProductImage(item.imageUrl)} alt={item.name} className="size-full object-contain" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[18px]">🛒</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold">{item.name}</div>
                        {item.note && (
                          <div className="mt-0.5 text-[12px] text-muted-foreground">{item.note}</div>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge tone="primary" icon={null}>{BRAND_LABELS[item.brandPreferenceMode]}</StatusBadge>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustQty(item.id, -1)}
                          className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-muted"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-[13.5px] font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustQty(item.id, 1)}
                          className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-muted"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                        <span className="ml-0.5 text-[12px] text-muted-foreground">{item.unitLabel}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="ml-1 flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail — product search */}
        <div className="sticky top-[86px] self-start">
          <Card className="rounded-2xl p-4">
            <div className="mb-3 font-heading text-[15px] font-bold">Buscar produtos</div>

            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="draft-item-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Ex.: leite integral"
                className="pl-9"
              />
              {draftName && (
                <button
                  type="button"
                  onClick={() => setDraftName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11.5px] text-muted-foreground">Qtd.</label>
                <Input
                  type="number"
                  min="1"
                  value={draftQuantity}
                  onChange={(e) => setDraftQuantity(e.target.value)}
                  className="text-[13px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] text-muted-foreground">Unidade</label>
                <Input
                  value={draftUnit}
                  onChange={(e) => setDraftUnit(e.target.value)}
                  placeholder="un, kg, L"
                  className="text-[13px]"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="mb-1 block text-[11.5px] text-muted-foreground">Observação</label>
              <Textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Preferências, tamanho, substituições…"
                rows={2}
                className="text-[13px] resize-none"
              />
            </div>

            <div className="mt-3 grid gap-2">
              {isSearching && (
                <div className="rounded-xl border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground">
                  Buscando…
                </div>
              )}
              {!isSearching && catalogResults.length === 0 && draftName.trim().length > 0 && (
                <div className="rounded-xl border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
              {catalogResults.map((product, i) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${
                      isSelected || i === 0
                        ? 'border-primary/30 bg-[var(--ds-primary-soft)]'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-[var(--ds-neutral-soft)]">
                      <img
                        src={resolveProductImage(getCatalogPreviewImage(product))}
                        alt={product.name}
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{product.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">{product.category}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          setSelectedProduct(product);
                          setSelectedVariantId('');
                          const variants = await fetchCatalogProductVariants(product.id);
                          setSelectedVariants(variants);
                          setBrandDialogOpen(true);
                        }}
                        className="h-7 px-2 text-[11.5px]"
                      >
                        Config
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          setSelectedProduct(product);
                          if (selectedProduct?.id !== product.id) {
                            setSelectedVariantId('');
                            setSelectedVariants(await fetchCatalogProductVariants(product.id));
                          }
                          addItem(product);
                        }}
                        className="h-7 px-2 text-[11.5px]"
                      >
                        + Adicionar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full text-[12.5px] text-muted-foreground"
              onClick={() => setMissingDialogOpen(true)}
            >
              Produto não encontrado? Solicitar ao catálogo
            </Button>
          </Card>
        </div>
      </div>

      {/* Brand config dialog */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar marca</DialogTitle>
            <DialogDescription>
              Defina se este item aceita qualquer variante ou exige uma variante exata.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Regra de marca</label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={draftBrandMode}
                onChange={(e) => setDraftBrandMode(e.target.value as 'any' | 'exact')}
              >
                <option value="any">Qualquer variante</option>
                <option value="exact">Somente variante exata</option>
              </select>
            </div>
            {draftBrandMode === 'exact' && (
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold">Variante exata</label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                >
                  <option value="">Selecione a variante</option>
                  {selectedVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brandName ? `${v.brandName} · ` : ''}{v.displayName}
                    </option>
                  ))}
                </select>
                {selectedVariant && (
                  <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border p-2.5">
                    <img
                      src={resolveProductImage(selectedVariant.imageUrl)}
                      alt={selectedVariant.displayName}
                      className="size-10 rounded-lg border border-border object-contain"
                    />
                    <div>
                      <div className="text-[13px] font-semibold">
                        {selectedVariant.brandName ? `${selectedVariant.brandName} · ` : ''}{selectedVariant.displayName}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">Variante selecionada</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBrandDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedProduct) addItem(selectedProduct);
                else setBrandDialogOpen(false);
              }}
            >
              Adicionar item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing product dialog */}
      <Dialog open={missingDialogOpen} onOpenChange={setMissingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar produto ao catálogo</DialogTitle>
            <DialogDescription>
              A equipe revisará o item e poderá transformá-lo em um produto comparável.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-[13px] font-semibold">Produto</label>
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold">Categoria sugerida</label>
              <Input
                value={missingCategory}
                onChange={(e) => setMissingCategory(e.target.value)}
                placeholder="Ex.: mercearia"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMissingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!accessToken || draftName.trim().length < 2}
              onClick={async () => {
                if (!accessToken) return;
                try {
                  await requestMissingProduct(accessToken, {
                    requestedName: draftName.trim(),
                    categoryHint: missingCategory.trim() || undefined,
                  });
                  toast.success('Solicitação enviada para revisão do catálogo.');
                  setMissingDialogOpen(false);
                } catch {
                  toast.error('Não foi possível enviar a solicitação.');
                }
              }}
            >
              Enviar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
