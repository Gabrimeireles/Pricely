// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CitiesPage, OfferDetailPage, OffersPage } from './public-pages';

const fetchRegionOffers = vi.fn();
const fetchOfferDetail = vi.fn();

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
  };
});

describe('public pages', () => {
  beforeEach(() => {
    fetchRegionOffers.mockReset();
    fetchOfferDetail.mockReset();
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
        'Campinas. Ofertas publicas mostram loja, frescor, confianca e detalhe completo do item.',
      ),
    ).toBeTruthy();
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
    expect(screen.getByText('Precos do produto na cidade')).toBeTruthy();
    expect(screen.getByText('Mercado Sul')).toBeTruthy();
  });
});
