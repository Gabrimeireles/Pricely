// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchRegionOffers = vi.fn();
const fetchNotifications = vi.fn();

vi.mock('@/app/api', () => ({
  fetchRegionOffers,
  fetchNotifications,
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    accessToken: 'tok',
    cityId: 'sao-paulo-sp',
    cities: [{ id: 'sao-paulo-sp', name: 'São Paulo', stateCode: 'SP' }],
    currentUser: { id: 'u1', email: 'c@p.local', displayName: 'Cliente Pricely', role: 'customer' },
    isAuthenticated: true,
    isBootstrapping: false,
    lists: [],
    signOut: vi.fn(),
  }),
}));

vi.mock('./shopper-shell', () => ({
  useLocationCtx: () => ({
    city: { id: 'sp', name: 'São Paulo, SP', status: 'active', stores: 6, district: 'Centro' },
    radius: 5,
    setCity: vi.fn(),
    setRadius: vi.fn(),
    openCity: vi.fn(),
    openCoverage: vi.fn(),
  }),
}));

vi.mock('@/app/shopper-data', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/app/shopper-data')>();
  return { ...orig };
});

const mockOffer = {
  id: 'o1',
  displayName: 'Arroz Camil 5kg',
  packageLabel: '5 kg',
  imageUrl: null,
  storeName: 'Unidade Vila Mariana',
  neighborhood: 'Vila Mariana',
  priceAmount: 21.9,
  savingsVsComparison: 2.1,
  confidenceLevel: 'high' as const,
  category: 'Grãos',
};

const offersResponse = {
  region: { id: 'r1', slug: 'sao-paulo-sp', name: 'São Paulo', stateCode: 'SP' },
  activeEstablishmentCount: 3,
  offerCoverageStatus: 'live' as const,
  offers: [mockOffer],
  filters: { stores: ['Unidade Vila Mariana'], categories: ['Grãos'] },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<>{children}</>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(cleanup);

// ─── HomePage ────────────────────────────────────────────────────────────────

describe('HomePage', () => {
  beforeEach(() => {
    fetchRegionOffers.mockResolvedValue(offersResponse);
  });

  it('renders hero heading', async () => {
    const { HomePage } = await import('./home-page');
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });

  it('loads real offers from API', async () => {
    const { HomePage } = await import('./home-page');
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(fetchRegionOffers).toHaveBeenCalledWith('sao-paulo-sp', { pageSize: 4 }));
    await waitFor(() => screen.getByText('Arroz Camil 5kg'));
  });
});

// ─── OffersPage ───────────────────────────────────────────────────────────────

describe('OffersPage', () => {
  beforeEach(() => {
    fetchRegionOffers.mockResolvedValue(offersResponse);
  });

  it('renders page title', async () => {
    const { OffersPage } = await import('./offers-page');
    render(<OffersPage />, { wrapper: Wrapper });
    expect(screen.getByText('Ofertas')).toBeTruthy();
  });

  it('loads real offers from API and renders offer cards', async () => {
    const { OffersPage } = await import('./offers-page');
    render(<OffersPage />, { wrapper: Wrapper });
    await waitFor(() => expect(fetchRegionOffers).toHaveBeenCalledWith('sao-paulo-sp', { pageSize: 100 }));
    await waitFor(() => screen.getByText('Arroz Camil 5kg'));
  });

  it('renders category chip from API response', async () => {
    const { OffersPage } = await import('./offers-page');
    render(<OffersPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByText('Grãos'));
  });
});

// ─── StoresPage ───────────────────────────────────────────────────────────────

describe('StoresPage', () => {
  beforeEach(() => {
    fetchRegionOffers.mockResolvedValue(offersResponse);
  });

  it('renders page title', async () => {
    const { StoresPage } = await import('./stores-page');
    render(<StoresPage />, { wrapper: Wrapper });
    expect(screen.getByText('Lojas')).toBeTruthy();
  });

  it('loads store data from API', async () => {
    const { StoresPage } = await import('./stores-page');
    render(<StoresPage />, { wrapper: Wrapper });
    await waitFor(() => expect(fetchRegionOffers).toHaveBeenCalledWith('sao-paulo-sp', { pageSize: 100 }));
    await waitFor(() => screen.getByText('Unidade Vila Mariana'));
  });
});

// ─── CouponsPage ──────────────────────────────────────────────────────────────

describe('CouponsPage', () => {
  it('renders em breve placeholder', async () => {
    const { CouponsPage } = await import('./coupons-page');
    render(<CouponsPage />, { wrapper: Wrapper });
    expect(screen.getByText('Cupons em breve')).toBeTruthy();
  });
});

// ─── HistoryPage ──────────────────────────────────────────────────────────────

describe('HistoryPage', () => {
  it('renders empty state when no optimized lists', async () => {
    const { HistoryPage } = await import('./history-page');
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Nenhuma lista otimizada/)).toBeTruthy();
  });
});
