// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MonetaryPrivacyProvider } from '@/app/monetary-privacy-context';
import { TooltipProvider } from '@/components/ui/tooltip';

import { OfferDetailPage } from './public-pages';

const fetchOfferDetail = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    cityId: 'sao-paulo-sp',
    setCityId: vi.fn(),
    currentUser: null,
    isAuthenticated: false,
    isBootstrapping: false,
    cities: [],
  }),
}));

vi.mock('@/app/api', async () => {
  const actual = await vi.importActual('@/app/api');
  return {
    ...actual,
    fetchOfferDetail: (...args: unknown[]) => fetchOfferDetail(...args),
  };
});

describe('public web security rendering', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders untrusted offer text as text instead of HTML', async () => {
    fetchOfferDetail.mockResolvedValue({
      id: 'offer-xss',
      region: {
        id: 'region-1',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
      },
      product: {
        id: 'product-1',
        name: '<img src=x onerror=alert(1)>',
        category: 'mercearia',
        imageUrl: null,
      },
      variant: {
        id: 'variant-1',
        displayName: '<script>alert(1)</script>',
        brandName: '<b>Marca</b>',
        packageLabel: '500 g',
      },
      activeOffer: {
        id: 'offer-xss',
        displayName: '<script>alert(1)</script>',
        packageLabel: '500 g',
        priceAmount: 15.9,
        observedAt: '2026-04-27T10:00:00.000Z',
        sourceLabel: '<iframe srcdoc=x></iframe>',
        storeName: '<b>Mercado</b>',
        neighborhood: 'Centro',
        confidenceLevel: 'high',
      },
      alternativeOffers: [],
    });

    const { container } = render(
      <TooltipProvider>
        <MonetaryPrivacyProvider>
          <MemoryRouter initialEntries={['/ofertas/offer-xss']}>
            <Routes>
              <Route path="/ofertas/:offerId" element={<OfferDetailPage />} />
            </Routes>
          </MemoryRouter>
        </MonetaryPrivacyProvider>
      </TooltipProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy(),
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
  });
});
