// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CitiesPage, OfferDetailPage, OffersPage } from './public-pages';

const fetchRegionOffers = vi.fn();
const fetchOfferDetail = vi.fn();
const requestCityInclusion = vi.fn();

const setCityId = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    cityId: 'campinas-sp',
    setCityId,
    currentUser: null,
    isAuthenticated: false,
    isBootstrapping: false,
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
        stores: [],
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
    requestCityInclusion: (...args: unknown[]) =>
      requestCityInclusion(...args),
  };
});

describe('public pages', () => {
  beforeEach(() => {
    fetchRegionOffers.mockReset();
    fetchOfferDetail.mockReset();
    requestCityInclusion.mockReset();
    setCityId.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders zero-store and collecting-data messaging for supported cities', () => {
    render(
      <MemoryRouter>
        <CitiesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Cidades suportadas')).toBeTruthy();
    expect(
      screen.getByText((_, element) =>
        element?.getAttribute('data-slot') == 'card-title' &&
        element?.textContent?.includes('Campinas') == true &&
        element?.textContent?.includes('SP') == true,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/0 estabelecimentos ativos/)).toBeTruthy();
    expect(screen.getByText('Piloto')).toBeTruthy();
    expect(screen.getByText(/Cidade em ativação/)).toBeTruthy();
    expect(
      screen.getByText(/2 estabelecimentos ativos com ofertas na cidade/),
    ).toBeTruthy();
  });

  it('submits a public city inclusion request', async () => {
    requestCityInclusion.mockResolvedValue({
      id: 'request-1',
      cityName: 'Santos',
      stateCode: 'SP',
      status: 'requested',
      createdAt: '2026-05-10T10:00:00.000Z',
    });

    render(
      <MemoryRouter>
        <CitiesPage />
      </MemoryRouter>,
    );

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

    render(
      <MemoryRouter>
        <OffersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Ofertas por cidade')).toBeTruthy();
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
          averagePriceAmount: 22.4,
          highestPriceAmount: 22.9,
        },
      ],
    });

    render(
      <MemoryRouter>
        <OffersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Arroz tipo 1 5kg')).toBeTruthy();
    expect(screen.getByText('2 estabelecimentos')).toBeTruthy();
    expect(screen.getByText(/Menor preço em Unidade Vila Mariana/)).toBeTruthy();
    expect(screen.getByText(/R\$ 0,50 abaixo da média/)).toBeTruthy();
    expect(screen.getByText('Ver outros estabelecimentos')).toBeTruthy();
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
      <MemoryRouter initialEntries={['/ofertas/offer-1']}>
        <Routes>
          <Route path="/ofertas/:offerId" element={<OfferDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Cafe torrado')).toBeTruthy());
    expect(
      screen.getByText((_, element) =>
        element?.getAttribute('data-slot') == 'card-description' &&
        element?.textContent?.includes('Mercado Centro') == true &&
        element?.textContent?.includes('Centro') == true,
      ),
    ).toBeTruthy();
    expect(screen.getByText('Preços do produto na cidade')).toBeTruthy();
    expect(screen.getByText('R$ 18,90')).toBeTruthy();
    expect(screen.getByText(/Economize R\$ 0,50/)).toBeTruthy();
    expect(screen.getByText('Mercado Sul')).toBeTruthy();
  });
});
