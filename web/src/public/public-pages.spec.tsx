// @vitest-environment jsdom

import type React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MonetaryPrivacyProvider } from '@/app/monetary-privacy-context';
import { TooltipProvider } from '@/components/ui/tooltip';

import {
  CitiesPage,
  LandingPage,
  ListsPage,
  OfferDetailPage,
  OffersPage,
  ReceiptSubmissionPage,
} from './public-pages';

const fetchRegionOffers = vi.fn();
const fetchOfferDetail = vi.fn();
const fetchPublicImpact = vi.fn();
const requestCityInclusion = vi.fn();
const submitReceipt = vi.fn();

const setCityId = vi.fn();
const pricelyMockState = vi.hoisted(() => ({
  isAuthenticated: true,
  profileOverride: null as Record<string, unknown> | null,
}));

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    accessToken: 'token',
    cityId: 'campinas-sp',
    setCityId,
    currentUser: pricelyMockState.isAuthenticated
      ? {
          id: 'user-1',
          email: 'cliente@pricely.local',
          displayName: 'Cliente',
          role: 'customer',
        }
      : null,
    isAuthenticated: pricelyMockState.isAuthenticated,
    isBootstrapping: false,
    profile: {
      listsCreated: 1,
      totalEstimatedSavings: 18.5,
      entitlementPlan: 'free',
      entitlementStatus: 'active',
      availableOptimizationTokens: 1,
      monthlyFreeOptimizationTokens: 2,
      billingEnabled: false,
      checkoutEnabled: false,
      ...pricelyMockState.profileOverride,
    },
    lists: pricelyMockState.isAuthenticated
      ? [
          {
            id: 'list-1',
            name: 'Compra semanal',
            cityId: 'sao-paulo-sp',
            lastMode: 'global_multi',
            updatedAt: '2026-05-10T10:00:00.000Z',
            expectedSavings: 12.4,
            latestOptimizationStatus: 'completed',
            items: [
              {
                id: 'item-1',
                name: 'Arroz tipo 1 5kg',
                quantity: 1,
                unitLabel: 'un',
                purchaseStatus: 'pending',
                status: 'resolved',
                imageUrl: 'https://example.com/arroz.png',
                brandPreferenceMode: 'any',
                preferredBrandNames: [],
              },
            ],
          },
        ]
      : [],
    cities: [
      {
        id: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
        activeStoreCount: 0,
        coverageStatus: 'collecting_data',
        regionLabel: '0 estabelecimentos ativos',
        status: 'pilot',
        stores: [],
        neighborhoods: [],
      },
      {
        id: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        activeStoreCount: 2,
        coverageStatus: 'live',
        regionLabel: '2 estabelecimentos ativos',
        status: 'supported',
        stores: [
          {
            id: 'store-1',
            name: 'Unidade Vila Mariana',
            neighborhood: 'Vila Mariana',
            offerCount: 10,
          },
          {
            id: 'store-2',
            name: 'Unidade Pinheiros',
            neighborhood: 'Pinheiros',
            offerCount: 8,
          },
        ],
        neighborhoods: [],
      },
    ],
  }),
}));

vi.mock('@/app/api', async () => {
  const actual = await vi.importActual('@/app/api');
  return {
    ...actual,
    fetchRegionOffers: (...args: unknown[]) => fetchRegionOffers(...args),
    fetchOfferDetail: (...args: unknown[]) => fetchOfferDetail(...args),
    fetchPublicImpact: (...args: unknown[]) => fetchPublicImpact(...args),
    requestCityInclusion: (...args: unknown[]) => requestCityInclusion(...args),
    submitReceipt: (...args: unknown[]) => submitReceipt(...args),
  };
});

describe('public pages', () => {
  beforeEach(() => {
    fetchRegionOffers.mockReset();
    fetchOfferDetail.mockReset();
    fetchPublicImpact.mockReset();
    fetchPublicImpact.mockResolvedValue({
      totalEstimatedSavings: 7.69,
      optimizedListsCount: 8,
    });
    requestCityInclusion.mockReset();
    submitReceipt.mockReset();
    setCityId.mockReset();
    pricelyMockState.isAuthenticated = true;
    pricelyMockState.profileOverride = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  const renderPublicPage = (ui: React.ReactNode) =>
    render(
      <TooltipProvider>
        <MonetaryPrivacyProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </MonetaryPrivacyProvider>
      </TooltipProvider>,
    );

  it('uses action placeholders on logged-out home receipt and savings cards', async () => {
    pricelyMockState.isAuthenticated = false;
    fetchRegionOffers.mockResolvedValue({
      region: {
        id: 'campinas-sp',
        slug: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
      },
      activeEstablishmentCount: 0,
      offerCoverageStatus: 'collecting_data',
      offers: [],
    });

    renderPublicPage(<LandingPage />);

    expect(screen.getByText('Envie sua primeira nota fiscal')).toBeTruthy();
    expect(screen.getByText('Entre para ver sua economia')).toBeTruthy();
    expect(screen.getAllByText('Aguardando lista').length).toBeGreaterThan(0);
    expect(screen.queryByText('R$ 7,69')).toBeNull();
    await waitFor(() => expect(fetchPublicImpact).toHaveBeenCalledTimes(1));
  });

  it('renders zero-store and collecting-data messaging for supported cities', () => {
    renderPublicPage(<CitiesPage />);

    expect(screen.getByText('Cidades suportadas')).toBeTruthy();
    expect(
      screen.getByText(
        (_, element) =>
          element?.getAttribute('data-slot') == 'card-title' &&
          element?.textContent?.includes('Campinas') == true &&
          element?.textContent?.includes('SP') == true,
      ),
    ).toBeTruthy();
    expect(screen.getAllByText(/Em ativa/).length).toBeGreaterThan(0);
    expect(screen.getByText('Piloto')).toBeTruthy();
    expect(screen.getByText(/As ofertas aparecem/)).toBeTruthy();
    expect(screen.getByText('Unidade Vila Mariana')).toBeTruthy();
    expect(screen.getByText('Unidade Pinheiros')).toBeTruthy();
  });

  it('submits a public city inclusion request', async () => {
    requestCityInclusion.mockResolvedValue({
      id: 'request-1',
      cityName: 'Santos',
      stateCode: 'SP',
      status: 'requested',
      createdAt: '2026-05-10T10:00:00.000Z',
    });

    renderPublicPage(<CitiesPage />);

    fireEvent.change(screen.getByLabelText('Cidade'), {
      target: { value: 'Santos' },
    });
    fireEvent.change(screen.getByLabelText('UF'), {
      target: { value: 'sp' },
    });
    fireEvent.change(screen.getByLabelText('Contato'), {
      target: { value: 'cliente@pricely.local' },
    });
    fireEvent.click(screen.getByText('Solicitar'));

    await waitFor(() =>
      expect(requestCityInclusion).toHaveBeenCalledWith({
        cityName: 'Santos',
        stateCode: 'SP',
        contactEmail: 'cliente@pricely.local',
        message: undefined,
      }),
    );
    expect(screen.getByText('Pedido registrado')).toBeTruthy();
  });

  it('renders the shopper next action lane on lists', () => {
    renderPublicPage(<ListsPage />);

    expect(screen.getByText('Use o checklist no mercado')).toBeTruthy();
    expect(screen.getByText('Lista')).toBeTruthy();
    expect(screen.getByText('Otimização')).toBeTruthy();
    expect(screen.getAllByText('Checklist').length).toBeGreaterThan(0);
    expect(screen.getByText('Nota fiscal')).toBeTruthy();
    expect(screen.getAllByText('Abrir checklist').length).toBeGreaterThan(0);
  });

  it('renders premium entitlement copy without free-plan messaging', () => {
    pricelyMockState.profileOverride = {
      entitlementPlan: 'premium',
      availableOptimizationTokens: 999,
      billingEnabled: false,
      checkoutEnabled: false,
    };

    renderPublicPage(<ListsPage />);

    expect(screen.getAllByText('Premium ativo').length).toBeGreaterThan(0);
    expect(screen.getByText('Benefícios Premium')).toBeTruthy();
    expect(screen.getByText('Otimizações ilimitadas')).toBeTruthy();
    expect(
      screen.queryByText(/O plano gratuito inclui 2 listas otimizadas/),
    ).toBeNull();
    expect(screen.queryByText('Comprar Premium')).toBeNull();
  });

  it('submits a receipt and shows manual-release status', async () => {
    submitReceipt.mockResolvedValue({
      id: 'receipt-1',
      processingStatus: 'waiting_manual_release',
      rewardEligibilityStatus: 'eligible_pending',
      rewardPoints: 100,
      rewardOptimizationTokens: 1,
      rewardMessage:
        'Nota recebida: reward em processamento ate a liberacao e validacao.',
    });

    renderPublicPage(<ReceiptSubmissionPage />);

    fireEvent.change(screen.getByLabelText('Estabelecimento'), {
      target: { value: 'Mercado Centro' },
    });
    fireEvent.change(screen.getByLabelText('Produto'), {
      target: { value: 'Arroz tipo 1 5kg' },
    });
    fireEvent.change(screen.getByLabelText('Preço'), {
      target: { value: '21.9' },
    });
    fireEvent.click(screen.getByText('Enviar nota'));

    await waitFor(() =>
      expect(submitReceipt).toHaveBeenCalledWith('token', {
        storeName: 'Mercado Centro',
        storeCnpj: undefined,
        purchaseDate: undefined,
        qrCodeUrl: undefined,
        items: [
          {
            rawProductName: 'Arroz tipo 1 5kg',
            ean: undefined,
            quantity: 1,
            unitPrice: 21.9,
          },
        ],
      }),
    );
    expect(screen.getByText('Nota recebida')).toBeTruthy();
    expect(
      screen.getAllByText(/aguardando liberação manual/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Fila')).toBeTruthy();
    expect(screen.getByText('Reward')).toBeTruthy();
    expect(screen.getByText('Admin libera no dashboard')).toBeTruthy();
    expect(screen.getByText(/Reward previsto após validação/)).toBeTruthy();
  });

  it('shows granted receipt reward points and optimization credit', async () => {
    submitReceipt.mockResolvedValue({
      id: 'receipt-validated',
      processingStatus: 'completed',
      rewardEligibilityStatus: 'granted',
      rewardPoints: 100,
      rewardOptimizationTokens: 1,
      rewardMessage:
        'Nota validada: voce ganhou 100 pontos e 1 credito de otimizacao.',
    });

    renderPublicPage(<ReceiptSubmissionPage />);

    fireEvent.change(screen.getByLabelText('Estabelecimento'), {
      target: { value: 'Mercado Validado' },
    });
    fireEvent.change(screen.getByLabelText('Produto'), {
      target: { value: 'Cafe torrado' },
    });
    fireEvent.change(screen.getByLabelText('Preço'), {
      target: { value: '15.9' },
    });
    fireEvent.click(screen.getByText('Enviar nota'));

    await waitFor(() => expect(submitReceipt).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Validado e concedido')).toBeTruthy();
    expect(screen.getByText(/Reward validado/)).toBeTruthy();
    expect(screen.getAllByText(/100 pontos/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1 crédito de otimização/)).toBeTruthy();
  });

  it('renders regional offers with empty-state friendly city context', async () => {
    fetchRegionOffers.mockResolvedValue({
      region: {
        id: 'campinas-sp',
        slug: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
      },
      activeEstablishmentCount: 0,
      offerCoverageStatus: 'collecting_data',
      offers: [],
    });

    renderPublicPage(<OffersPage />);

    expect(await screen.findByText('Ofertas por cidade')).toBeTruthy();
    expect(screen.getByText('Cidade em ativação')).toBeTruthy();
    expect(
      screen.getByText(/precisa de notas fiscais e validações/),
    ).toBeTruthy();
    expect(screen.getByText('Enviar nota fiscal')).toBeTruthy();
    expect(
      screen.getByText(
        'Campinas. Ofertas públicas mostram loja, frescor, confiança e detalhe completo do item.',
      ),
    ).toBeTruthy();
  });

  it('groups regional offers by product variant and exposes store alternatives', async () => {
    fetchRegionOffers.mockResolvedValue({
      region: {
        id: 'sao-paulo-sp',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
      },
      activeEstablishmentCount: 2,
      offerCoverageStatus: 'live',
      offers: [],
      groupedOffers: [
        {
          id: 'variant-1',
          catalogProductId: 'product-1',
          productVariantId: 'variant-1',
          productName: 'Arroz tipo 1 5kg',
          variantName: 'Arroz Camil tipo 1 5kg',
          imageUrl: 'https://example.com/arroz.png',
          packageLabel: '5 kg',
          bestOffer: {
            id: 'offer-1',
            catalogProductId: 'product-1',
            productVariantId: 'variant-1',
            productName: 'Arroz tipo 1 5kg',
            variantName: 'Arroz Camil tipo 1 5kg',
            imageUrl: 'https://example.com/arroz.png',
            displayName: 'Arroz Camil tipo 1 5kg',
            packageLabel: '5 kg',
            priceAmount: 21.9,
            basePriceAmount: 21.9,
            observedAt: '2026-05-10T00:00:00.000Z',
            sourceLabel: 'Seed',
            storeName: 'Unidade Vila Mariana',
            neighborhood: 'Vila Mariana',
            confidenceLevel: 'high',
          },
          alternativeOffers: [
            {
              id: 'offer-2',
              catalogProductId: 'product-1',
              productVariantId: 'variant-1',
              productName: 'Arroz tipo 1 5kg',
              variantName: 'Arroz Camil tipo 1 5kg',
              imageUrl: 'https://example.com/arroz.png',
              displayName: 'Arroz Camil tipo 1 5kg',
              packageLabel: '5 kg',
              priceAmount: 22.9,
              basePriceAmount: 24.9,
              promotionalPriceAmount: 22.9,
              observedAt: '2026-05-10T00:00:00.000Z',
              sourceLabel: 'Seed',
              storeName: 'Unidade Pinheiros',
              neighborhood: 'Pinheiros',
              confidenceLevel: 'medium',
            },
          ],
          offers: [],
          establishmentCount: 2,
          cheapestPriceAmount: 21.9,
          secondCheapestPriceAmount: 22.9,
          savingsVsSecondCheapest: 1,
          averagePriceAmount: 22.4,
          highestPriceAmount: 22.9,
        },
      ],
    });

    renderPublicPage(<OffersPage />);

    expect(await screen.findByText('Arroz Camil tipo 1 5kg')).toBeTruthy();
    expect(screen.getByText('Arroz tipo 1 5kg')).toBeTruthy();
    expect(screen.getByText('2 estabelecimentos')).toBeTruthy();
    expect(
      screen.getByText(/Menor preço em Unidade Vila Mariana/),
    ).toBeTruthy();
    expect(screen.getAllByText('R$ 1,00').length).toBeGreaterThan(0);
    expect(screen.getByText(/abaixo/)).toBeTruthy();
    expect(screen.getByText('R$ 22,40')).toBeTruthy();
    expect(screen.getByText('Ver outros estabelecimentos')).toBeTruthy();
  });

  it('deduplicates regional offers by variant when the API only returns flat offers', async () => {
    fetchRegionOffers.mockResolvedValue({
      region: {
        id: 'sao-paulo-sp',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
      },
      activeEstablishmentCount: 2,
      offerCoverageStatus: 'live',
      offers: [
        {
          id: 'offer-1',
          catalogProductId: 'product-1',
          productVariantId: 'variant-1',
          productName: 'Feijao carioca 1kg',
          variantName: 'Feijao Carioca Camil 1kg',
          imageUrl: 'https://example.com/feijao-camil.png',
          displayName: 'Feijao Carioca Camil 1kg',
          packageLabel: '1 kg',
          priceAmount: 7.99,
          basePriceAmount: 8.79,
          promotionalPriceAmount: 7.99,
          regionalAveragePriceAmount: 8.24,
          comparisonPriceAmount: 8.49,
          savingsVsComparison: 0.5,
          observedAt: '2026-05-10T00:00:00.000Z',
          sourceLabel: 'Nota fiscal',
          storeName: 'Unidade Santo Amaro',
          neighborhood: 'Santo Amaro',
          confidenceLevel: 'high',
        },
        {
          id: 'offer-2',
          catalogProductId: 'product-1',
          productVariantId: 'variant-1',
          productName: 'Feijao carioca 1kg',
          variantName: 'Feijao Carioca Camil 1kg',
          imageUrl: 'https://example.com/feijao-camil.png',
          displayName: 'Feijao Carioca Camil 1kg',
          packageLabel: '1 kg',
          priceAmount: 8.49,
          basePriceAmount: 8.79,
          promotionalPriceAmount: 8.49,
          regionalAveragePriceAmount: 8.24,
          comparisonPriceAmount: 7.99,
          savingsVsComparison: 0,
          observedAt: '2026-05-09T00:00:00.000Z',
          sourceLabel: 'Nota fiscal',
          storeName: 'Unidade Pinheiros',
          neighborhood: 'Pinheiros',
          confidenceLevel: 'medium',
        },
      ],
    });

    renderPublicPage(<OffersPage />);

    expect(
      await screen.findByText('Feijao Carioca Camil 1kg'),
    ).toBeTruthy();
    expect(screen.getAllByText('Feijao Carioca Camil 1kg')).toHaveLength(1);
    expect(screen.getByText('2 estabelecimentos')).toBeTruthy();
    expect(
      screen.getByText(/Menor preço em Unidade Santo Amaro/),
    ).toBeTruthy();
    expect(screen.getByText('Ver outros estabelecimentos')).toBeTruthy();
    expect(screen.getAllByText(/Unidade Pinheiros/).length).toBeGreaterThan(0);
  });

  it('renders detailed public offer content', async () => {
    fetchOfferDetail.mockResolvedValue({
      id: 'offer-1',
      region: {
        id: 'region-1',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
      },
      product: {
        id: 'product-1',
        name: 'Cafe torrado',
        category: 'mercearia',
        imageUrl: 'https://example.com/cafe.png',
      },
      variant: {
        id: 'variant-1',
        displayName: 'Cafe Pilao 500g',
        brandName: 'Pilao',
        packageLabel: '500 g',
      },
      activeOffer: {
        id: 'offer-1',
        displayName: 'Cafe Pilao 500g',
        packageLabel: '500 g',
        priceAmount: 15.9,
        basePriceAmount: 18.9,
        promotionalPriceAmount: 15.9,
        regionalAveragePriceAmount: 16.15,
        comparisonPriceAmount: 16.4,
        savingsVsComparison: 0.5,
        observedAt: '2026-04-27T10:00:00.000Z',
        sourceLabel: 'Painel admin',
        storeName: 'Mercado Centro',
        neighborhood: 'Centro',
        confidenceLevel: 'high',
      },
      alternativeOffers: [
        {
          id: 'offer-2',
          storeName: 'Mercado Sul',
          neighborhood: 'Cambuí',
          packageLabel: '500 g',
          priceAmount: 16.4,
          basePriceAmount: 16.4,
          observedAt: '2026-04-27T09:00:00.000Z',
          sourceLabel: 'Painel admin',
          confidenceLevel: 'medium',
        },
      ],
    });

    render(
      <TooltipProvider>
        <MonetaryPrivacyProvider>
          <MemoryRouter initialEntries={['/ofertas/offer-1']}>
            <Routes>
              <Route path="/ofertas/:offerId" element={<OfferDetailPage />} />
            </Routes>
          </MemoryRouter>
        </MonetaryPrivacyProvider>
      </TooltipProvider>,
    );

    await waitFor(() => expect(screen.getByText('Cafe torrado')).toBeTruthy());
    expect(
      screen.getByText(
        (_, element) =>
          element?.getAttribute('data-slot') == 'card-description' &&
          element?.textContent?.includes('Mercado Centro') == true &&
          element?.textContent?.includes('Centro') == true,
      ),
    ).toBeTruthy();
    expect(screen.getByText('Preços do produto na cidade')).toBeTruthy();
    expect(screen.getByText('R$ 18,90')).toBeTruthy();
    expect(document.body.textContent).toMatch(/Economize\s+R\$\s*0,50/);
    expect(screen.getByText('Mercado Sul')).toBeTruthy();
  });
});
