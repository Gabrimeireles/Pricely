// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminCatalogPage,
  AdminEstablishmentsPage,
  AdminOverviewPage,
  AdminPricesPage,
  AdminQueueDetailPage,
  AdminQueuePage,
  AdminReceiptsPage,
  AdminRegionsPage,
  AdminUsersPage,
} from './dashboard-pages';

const fetchAdminMetrics = vi.fn();
const fetchAdminQueueHealth = vi.fn();
const fetchAdminProcessingJobs = vi.fn();
const fetchAdminProcessingJobDetail = vi.fn();
const fetchAdminReceiptProcessing = vi.fn();
const releaseAdminReceiptProcessing = vi.fn();
const fetchAdminRegions = vi.fn();
const fetchAdminEstablishments = vi.fn();
const fetchAdminOffers = vi.fn();
const fetchAdminProducts = vi.fn();
const fetchAdminProductVariants = vi.fn();
const fetchAdminUsers = vi.fn();
const setAdminUserPremium = vi.fn();
const grantAdminUserTokens = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    accessToken: 'token',
    currentUser: {
      id: 'admin-1',
      email: 'admin@pricely.local',
      displayName: 'Admin',
      role: 'admin',
    },
    lists: [],
  }),
}));

vi.mock('@/app/api', () => ({
  fetchAdminMetrics: (...args: unknown[]) => fetchAdminMetrics(...args),
  fetchAdminQueueHealth: (...args: unknown[]) => fetchAdminQueueHealth(...args),
  fetchAdminProcessingJobs: (...args: unknown[]) =>
    fetchAdminProcessingJobs(...args),
  fetchAdminProcessingJobDetail: (...args: unknown[]) =>
    fetchAdminProcessingJobDetail(...args),
  fetchAdminReceiptProcessing: (...args: unknown[]) =>
    fetchAdminReceiptProcessing(...args),
  releaseAdminReceiptProcessing: (...args: unknown[]) =>
    releaseAdminReceiptProcessing(...args),
  fetchAdminRegions: (...args: unknown[]) => fetchAdminRegions(...args),
  fetchAdminEstablishments: (...args: unknown[]) =>
    fetchAdminEstablishments(...args),
  fetchAdminShoppingLists: vi.fn(),
  fetchAdminUsers: (...args: unknown[]) => fetchAdminUsers(...args),
  setAdminUserPremium: (...args: unknown[]) => setAdminUserPremium(...args),
  grantAdminUserTokens: (...args: unknown[]) => grantAdminUserTokens(...args),
  updateAdminRegion: vi.fn(),
  createAdminRegion: vi.fn(),
  createAdminEstablishment: vi.fn(),
  updateAdminEstablishment: vi.fn(),
  fetchAdminOffers: (...args: unknown[]) => fetchAdminOffers(...args),
  fetchAdminProducts: (...args: unknown[]) => fetchAdminProducts(...args),
  fetchAdminProductVariants: (...args: unknown[]) =>
    fetchAdminProductVariants(...args),
  createAdminOffer: vi.fn(),
  createAdminProduct: vi.fn(),
  createAdminProductVariant: vi.fn(),
  updateAdminOffer: vi.fn(),
  updateAdminProduct: vi.fn(),
  updateAdminProductVariant: vi.fn(),
}));

describe('Admin dashboard pages', () => {
  beforeEach(() => {
    fetchAdminMetrics.mockReset();
    fetchAdminQueueHealth.mockReset();
    fetchAdminProcessingJobs.mockReset();
    fetchAdminProcessingJobDetail.mockReset();
    fetchAdminReceiptProcessing.mockReset();
    releaseAdminReceiptProcessing.mockReset();
    fetchAdminRegions.mockReset();
    fetchAdminEstablishments.mockReset();
    fetchAdminOffers.mockReset();
    fetchAdminProducts.mockReset();
    fetchAdminProductVariants.mockReset();
    fetchAdminUsers.mockReset();
    setAdminUserPremium.mockReset();
    grantAdminUserTokens.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders queue health when overview data loads successfully', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 2,
      shoppingListsCount: 3,
      optimizationRunsCount: 4,
      activeRegions: 1,
      activeEstablishments: 5,
      activeOffers: 6,
      productCount: 7,
      queuedJobs: 1,
      globalEstimatedSavings: 35.2,
    });
    fetchAdminQueueHealth.mockResolvedValue({
      queuedJobs: 1,
      runningJobs: 0,
      failedJobs: 0,
      completedJobs: 2,
      jobsByStatus: { queued: 1, completed: 2 },
      queues: ['optimization'],
      recentFailures: [],
    });

    render(<AdminOverviewPage />);

    expect(await screen.findByText('Saude das filas')).toBeTruthy();
    expect(screen.getByText('Prioridades operacionais')).toBeTruthy();
    expect(screen.getAllByText('Jobs aguardando').length).toBeGreaterThan(0);
    expect(screen.getByText('Cobertura da operacao')).toBeTruthy();
    expect(screen.getByText('Sinais do dia')).toBeTruthy();
    expect(screen.getByText('Painel comparativo')).toBeTruthy();
  });

  it('shows an empty-state message when all overview metrics are zero', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 0,
      shoppingListsCount: 0,
      optimizationRunsCount: 0,
      activeRegions: 0,
      activeEstablishments: 0,
      activeOffers: 0,
      productCount: 0,
      queuedJobs: 0,
      globalEstimatedSavings: 0,
    });
    fetchAdminQueueHealth.mockResolvedValue({
      queuedJobs: 0,
      runningJobs: 0,
      failedJobs: 0,
      completedJobs: 0,
      jobsByStatus: {},
      queues: [],
      recentFailures: [],
    });

    render(<AdminOverviewPage />);

    expect(
      await screen.findByText(/Nenhuma metrica operacional ainda/),
    ).toBeTruthy();
  });

  it('renders queue diagnostics and recent jobs in the dedicated queue page', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 2,
      shoppingListsCount: 3,
      optimizationRunsCount: 4,
      activeRegions: 1,
      activeEstablishments: 5,
      activeOffers: 6,
      productCount: 7,
      queuedJobs: 1,
      globalEstimatedSavings: 35.2,
    });
    fetchAdminQueueHealth.mockResolvedValue({
      queuedJobs: 1,
      runningJobs: 0,
      failedJobs: 0,
      completedJobs: 2,
      jobsByStatus: { queued: 1, completed: 2 },
      queues: ['optimization'],
      recentFailures: [],
    });
    fetchAdminProcessingJobs.mockResolvedValue([
      {
        id: 'job-1',
        queueName: 'optimization',
        resourceType: 'shopping_list',
        resourceId: 'list-1',
        status: 'completed',
        attemptCount: 1,
        failureReason: null,
        createdAt: '2026-05-10T04:00:00.000Z',
        updatedAt: '2026-05-10T04:03:00.000Z',
        finishedAt: '2026-05-10T04:03:00.000Z',
        owner: {
          id: 'user-1',
          displayName: 'Cliente Teste',
          email: 'cliente@pricely.local',
        },
        shoppingList: {
          id: 'list-1',
          name: 'Compra da semana',
        },
        optimizationRun: {
          id: 'run-1',
          mode: 'global_multi',
          status: 'completed',
          createdAt: '2026-05-10T04:00:00.000Z',
          completedAt: '2026-05-10T04:03:00.000Z',
        },
      },
    ]);

    render(<AdminQueuePage />);

    expect(await screen.findByText('Saude da fila')).toBeTruthy();
    expect(screen.getByText('Jobs recentes')).toBeTruthy();
    expect(screen.getByText('Lista: Compra da semana')).toBeTruthy();
    expect(screen.getByText(/Cliente Teste/)).toBeTruthy();
    expect(screen.getByText(/Modo Menor total na cidade/)).toBeTruthy();
    expect(screen.getByLabelText('Abrir detalhe do job job-1')).toBeTruthy();
    expect(screen.queryByText('Go to link')).toBeNull();
  });

  it('renders queue detail with readable operations before technical IDs', async () => {
    fetchAdminProcessingJobDetail.mockResolvedValue({
      id: 'job-1',
      queueName: 'optimization',
      jobType: 'optimization',
      resourceType: 'shopping_list',
      resourceId: 'list-1',
      status: 'completed',
      attemptCount: 1,
      failureReason: null,
      createdAt: '2026-05-10T04:00:00.000Z',
      updatedAt: '2026-05-10T04:03:00.000Z',
      finishedAt: '2026-05-10T04:03:00.000Z',
      owner: {
        id: 'user-1',
        displayName: 'Cliente Teste',
        email: 'cliente@pricely.local',
      },
      shoppingList: {
        id: 'list-1',
        name: 'Compra da semana',
      },
      optimizationRun: {
        id: 'run-1',
        mode: 'global_multi',
        status: 'completed',
        createdAt: '2026-05-10T04:00:00.000Z',
        completedAt: '2026-05-10T04:03:00.000Z',
        totalEstimatedCost: 42.5,
        estimatedSavings: 6.4,
        coverageStatus: 'complete',
        summary: 'Selecionou menor total elegível na cidade.',
        selections: [
          {
            id: 'selection-1',
            shoppingListItemId: 'item-1',
            shoppingListItemName: 'Arroz tipo 1 5kg',
            status: 'selected',
            estimatedCost: 21.9,
            offer: {
              id: 'offer-1',
              displayName: 'Arroz Camil 5kg',
              variantName: 'Arroz Camil 5kg',
              establishmentName: 'Mercado Centro',
              neighborhood: 'Centro',
              priceAmount: 21.9,
              confidenceLevel: 'high',
              sourceType: 'receipt',
              sourceLabel: 'Nota fiscal',
              observedAt: '2026-05-10T03:00:00.000Z',
              receiptEvidence: {
                id: 'receipt-1',
                moderationStatus: 'accepted',
                trustLevel: 'trusted',
                reviewReason: null,
              },
            },
          },
        ],
      },
    });

    render(<AdminQueueDetailPage />);

    expect(await screen.findByText('Lista: Compra da semana')).toBeTruthy();
    expect(
      screen.getAllByText(/Cliente Teste · optimization/).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Concluido').length).toBeGreaterThan(0);
    expect(screen.getByText('Dados técnicos')).toBeTruthy();
    expect(screen.getByText('Resumo da decisão')).toBeTruthy();
    expect(screen.getByText('Selecionada')).toBeTruthy();
    expect(screen.getByText(/Nota Aceita · Confiável/)).toBeTruthy();
    expect(screen.queryByText('Resumo do thinking')).toBeNull();
  });

  it('renders catalog search, collapsed variants, and offer variant images', async () => {
    fetchAdminProducts.mockResolvedValue([
      {
        id: 'product-1',
        slug: 'cafe-torrado',
        name: 'Cafe torrado',
        category: 'mercearia',
        defaultUnit: 'un',
        imageUrl: null,
        isActive: true,
        aliases: [{ id: 'alias-1', alias: 'cafe' }],
        productVariants: [],
        _count: { productOffers: 1 },
      },
    ]);
    fetchAdminProductVariants.mockResolvedValue([
      {
        id: 'variant-1',
        catalogProductId: 'product-1',
        slug: 'cafe-pilao-500g',
        displayName: 'Cafe Pilao 500g',
        brandName: 'Pilao',
        variantLabel: null,
        packageLabel: '500 g',
        imageUrl: '/uploads/cafe.png',
        isActive: true,
      },
    ]);
    fetchAdminOffers.mockResolvedValue([
      {
        id: 'offer-1',
        displayName: 'Cafe Pilao 500g',
        packageLabel: '500 g',
        priceAmount: 15.9,
        basePriceAmount: 18.9,
        promotionalPriceAmount: 15.9,
        availabilityStatus: 'available',
        confidenceLevel: 'high',
        observedAt: '2026-05-10T04:00:00.000Z',
        isActive: true,
        catalogProduct: { id: 'product-1', name: 'Cafe torrado' },
        productVariant: {
          id: 'variant-1',
          displayName: 'Cafe Pilao 500g',
          brandName: 'Pilao',
          packageLabel: '500 g',
          imageUrl: '/uploads/cafe.png',
        },
        establishment: {
          id: 'store-1',
          unitName: 'Mercado Centro',
          neighborhood: 'Centro',
          region: {
            id: 'region-1',
            slug: 'sao-paulo-sp',
            name: 'Sao Paulo',
            stateCode: 'SP',
          },
        },
      },
    ]);
    fetchAdminEstablishments.mockResolvedValue([
      {
        id: 'store-1',
        unitName: 'Mercado Centro',
      },
    ]);

    render(<AdminCatalogPage />);

    expect(await screen.findByLabelText('Buscar no catalogo')).toBeTruthy();
    expect(screen.getByText('Bancada de variantes')).toBeTruthy();
    expect(screen.getByLabelText('Buscar variantes')).toBeTruthy();
    expect(screen.getByText('1 variantes')).toBeTruthy();
    expect(screen.getByText('Cafe Pilao 500g')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Buscar variantes'), {
      target: { value: 'pilao' },
    });
    expect(await screen.findByText('Editar variante')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Buscar no catalogo'), {
      target: { value: 'pilao' },
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Cafe Pilao 500g/).length).toBeGreaterThan(0);
    });

    render(<AdminPricesPage />);
    expect(
      (await screen.findAllByAltText('Cafe Pilao 500g')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pilao/).length).toBeGreaterThan(0);
  });

  it('renders dedicated regions and establishments views', async () => {
    fetchAdminRegions.mockResolvedValue([
      {
        id: 'region-1',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        implantationStatus: 'active',
        publicSortOrder: 1,
        activeEstablishmentsCount: 2,
        establishments: [
          {
            id: 'store-1',
            brandName: 'Mercado Azul',
            unitName: 'Unidade Pinheiros',
            neighborhood: 'Pinheiros',
            cityName: 'Sao Paulo',
            isActive: true,
            auditedProductsCount: 12,
          },
        ],
      },
    ]);
    fetchAdminEstablishments.mockResolvedValue([
      {
        id: 'store-1',
        brandName: 'Mercado Azul',
        unitName: 'Unidade Pinheiros',
        cnpj: '00.000.000/0001-00',
        cityName: 'Sao Paulo',
        neighborhood: 'Pinheiros',
        regionId: 'region-1',
        isActive: true,
        region: {
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
        },
      },
    ]);

    render(<AdminRegionsPage />);
    expect(await screen.findByText('Cidades públicas')).toBeTruthy();
    expect(screen.getAllByText(/Sao Paulo/).length).toBeGreaterThan(0);
    expect(screen.getByText('12 produtos auditados')).toBeTruthy();

    render(<AdminEstablishmentsPage />);
    expect(await screen.findByText('Unidades por cidade')).toBeTruthy();
    expect(screen.getAllByText('Unidade Pinheiros').length).toBeGreaterThan(0);
  });

  it('renders receipt processing quality and review actions', async () => {
    fetchAdminReceiptProcessing.mockResolvedValue([
      {
        id: 'receipt-1',
        storeName: 'Mercado Centro',
        storeCnpj: '00.000.000/0001-00',
        parseStatus: 'parsed',
        trustLevel: 'trusted',
        moderationStatus: 'accepted',
        rewardEligibilityStatus: 'eligible_pending',
        reviewReason: null,
        purchaseDate: '2026-05-09T10:00:00.000Z',
        createdAt: '2026-05-09T10:05:00.000Z',
        updatedAt: '2026-05-09T10:06:00.000Z',
        owner: {
          id: 'user-1',
          displayName: 'Cliente Teste',
          email: 'cliente@pricely.local',
        },
        processingJob: {
          id: 'job-1',
          status: 'completed',
          attemptCount: 1,
          failureReason: null,
          updatedAt: '2026-05-09T10:06:00.000Z',
        },
        quality: {
          lineItemCount: 4,
          highConfidenceLineItemCount: 3,
          averageMatchConfidence: 0.83,
          usefulDataRatio: 0.75,
        },
        reward: {
          points: 100,
          optimizationTokens: 1,
          label: '100 pontos + 1 credito pendente',
        },
        extractedPayload: {
          accessKey: '35260500000000000100550010000000011000000011',
          sefazUrl: 'https://sefaz.example/accepted',
          rawReference: null,
          purchaseDate: '2026-05-09T10:00:00.000Z',
          lineItemCount: 1,
          totalLineAmount: 15.9,
        },
        lineItems: [
          {
            id: 'line-1',
            rawProductName: 'CAFE PILAO 500G',
            normalizedName: 'Cafe Pilao 500g',
            ean: '7891000000000',
            quantity: 1,
            unitPrice: 15.9,
            lineTotal: 15.9,
            originalUnitPrice: 18.9,
            promotionalUnitPrice: 15.9,
            matchConfidence: 0.91,
            matcherStatus: 'matched_offer',
            makerAction: 'offer_created',
            offers: [
              {
                id: 'offer-1',
                catalogProductName: 'Cafe torrado',
                variantName: 'Cafe Pilao 500g',
                brandName: 'Pilao',
                establishmentName: 'Mercado Centro',
                neighborhood: 'Centro',
                displayName: 'Cafe Pilao 500g',
                packageLabel: '500 g',
                priceAmount: 15.9,
                observedAt: '2026-05-09T10:06:00.000Z',
                comparison: {
                  previousPriceAmount: 16.9,
                  newPriceAmount: 15.9,
                  deltaAmount: -1,
                  direction: 'down',
                  previousObservedAt: '2026-05-01T10:06:00.000Z',
                },
              },
            ],
          },
        ],
      },
    ]);

    render(<AdminReceiptsPage />);

    expect(await screen.findByText('Notas fiscais processadas')).toBeTruthy();
    expect(screen.getAllByText('Mercado Centro').length).toBeGreaterThan(0);
    expect(screen.getByText('3/4 itens fortes')).toBeTruthy();
    expect(screen.getByText('100 pontos + 1 credito pendente')).toBeTruthy();
    expect(screen.getByText('eligible_pending')).toBeTruthy();
    expect(screen.getByText('Ver leitura')).toBeTruthy();
    expect(
      screen.getByText('1 itens extraídos · 1 com oferta gerada'),
    ).toBeTruthy();

    fireEvent.click(screen.getByText('Ver leitura e matcher'));
    expect(await screen.findByText('CAFE PILAO 500G')).toBeTruthy();
    expect(screen.getByText('Payload extraído')).toBeTruthy();
    expect(screen.getByText('1 itens · R$ 15,90')).toBeTruthy();
    expect(
      screen.getByText(/35260500000000000100550010000000011000000011/),
    ).toBeTruthy();
    expect(screen.getByText('1 ofertas · 0 para revisar')).toBeTruthy();
    expect(screen.getByText('Oferta criada')).toBeTruthy();
    expect(screen.getByText('Ver oferta criada')).toBeTruthy();
    expect(screen.getByText('Preço caiu')).toBeTruthy();
    expect(screen.getByText(/R\$ 16,90 anterior/)).toBeTruthy();
  });

  it('renders admin users and supports premium and token actions', async () => {
    fetchAdminUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'cliente@pricely.local',
        displayName: 'Cliente Teste',
        role: 'customer',
        status: 'active',
        preferredRegion: {
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
        },
        lastLoginAt: '2026-05-10T04:00:00.000Z',
        createdAt: '2026-05-01T04:00:00.000Z',
        updatedAt: '2026-05-10T04:00:00.000Z',
        counts: {
          shoppingLists: 4,
          optimizationRuns: 3,
          receiptRecords: 2,
          priceMismatchReports: 1,
        },
        entitlement: {
          plan: 'free',
          status: 'active',
          source: 'monthly_free_refill',
          availableOptimizationTokens: 2,
          monthlyFreeOptimizationTokens: 2,
          billingEnabled: false,
          checkoutEnabled: false,
          lastPaymentAt: null,
          lastPaymentStatus: 'billing_disabled',
        },
        latestOptimization: null,
      },
    ]);
    setAdminUserPremium.mockResolvedValue({});
    grantAdminUserTokens.mockResolvedValue({});

    render(<AdminUsersPage />);

    expect((await screen.findAllByText('Usuarios')).length).toBeGreaterThan(0);
    expect(screen.getByText('Cliente Teste')).toBeTruthy();
    expect(screen.getByText('Sao Paulo - SP')).toBeTruthy();
    expect(screen.getByText('2 creditos disponiveis')).toBeTruthy();
    expect(screen.getByText('Billing desativado')).toBeTruthy();

    fireEvent.click(screen.getByText('Ativar premium'));
    await waitFor(() =>
      expect(setAdminUserPremium).toHaveBeenCalledWith('token', 'user-1', true),
    );

    fireEvent.change(
      screen.getByLabelText('Creditos extras para Cliente Teste'),
      {
        target: { value: '3' },
      },
    );
    fireEvent.click(screen.getByText('Adicionar'));
    await waitFor(() =>
      expect(grantAdminUserTokens).toHaveBeenCalledWith('token', 'user-1', {
        amount: 3,
        reason: 'suporte_admin',
      }),
    );
  });
});
