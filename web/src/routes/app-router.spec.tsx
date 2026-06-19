// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@/app/theme-context';
import { MonetaryPrivacyProvider } from '@/app/monetary-privacy-context';
import { TooltipProvider } from '@/components/ui/tooltip';

import { dashboardRoute } from './dashboard';
import { publicRoute } from './public';

let pricelyState = {
  accessToken: null as string | null,
  currentUser: null as null | {
    id: string;
    email: string;
    displayName: string;
    role: 'customer' | 'admin';
  },
  isAuthenticated: false,
};

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    ...pricelyState,
    cities: [],
    lists: [],
    profile: {
      totalEstimatedSavings: 0,
      listsCreated: 0,
      receiptsShared: 0,
      invalidPromotionReports: 0,
      entitlementPlan: 'free',
      entitlementStatus: 'active',
      availableOptimizationTokens: 0,
      monthlyFreeOptimizationTokens: 2,
      billingEnabled: false,
      checkoutEnabled: false,
    },
    signIn: vi.fn(),
    signUp: vi.fn(),
  }),
}));

vi.mock('@/app/api', async () => {
  const actual = await vi.importActual('@/app/api');
  return {
    ...actual,
    fetchAdminReceiptProcessing: vi.fn().mockResolvedValue([]),
    fetchAdminReceiptProcessingDetail: vi.fn().mockResolvedValue({
      id: 'receipt-1',
      storeName: 'Mercado Centro',
      storeCnpj: '00.000.000/0001-00',
      parseStatus: 'queued',
      trustLevel: 'trusted',
      moderationStatus: 'pending',
      rewardEligibilityStatus: 'eligible_pending',
      reviewReason: null,
      purchaseDate: null,
      createdAt: '2026-05-15T10:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
      owner: {
        id: 'admin-1',
        displayName: 'Admin',
        email: 'admin@pricely.local',
      },
      processingJob: null,
      quality: {
        score: 95,
        label: 'Alta qualidade',
        usefulLineItemsCount: 1,
        matchedLineItemsCount: 1,
        unmatchedLineItemsCount: 0,
        generatedOffersCount: 1,
        comparableOffersCount: 0,
      },
      reward: {
        statusLabel: 'Reward pendente',
        points: 100,
        optimizationTokens: 1,
      },
      extractedPayload: {
        accessKey: null,
        sefazUrl: null,
        rawReference: null,
        purchaseDate: null,
        lineItemCount: 1,
        totalAmount: 10,
      },
      lineItems: [],
      priceMovements: [],
    }),
  };
});

vi.mock('@/app/theme-context', async () => {
  const actual = await vi.importActual('@/app/theme-context');
  return {
    ...actual,
    useTheme: () => ({
      theme: 'light',
      toggleTheme: () => undefined,
    }),
  };
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter([publicRoute, dashboardRoute], {
    initialEntries: [initialEntry],
  });

  return render(
    <TooltipProvider>
      <ThemeProvider>
        <MonetaryPrivacyProvider>
          <RouterProvider router={router} />
        </MonetaryPrivacyProvider>
      </ThemeProvider>
    </TooltipProvider>,
  );
}

beforeEach(() => {
  pricelyState = {
    accessToken: null,
    currentUser: null,
    isAuthenticated: false,
  };
});

afterEach(() => {
  cleanup();
});

describe('application routes', () => {
  it('renders the public sign-in page inside the shared public shell', () => {
    renderRoute('/entrar');

    expect(screen.getAllByText('Sua conta para comprar melhor').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(screen.getAllByLabelText('Pricely').length).toBeGreaterThan(0);
  });

  it('blocks the admin overview route for a non-admin session', () => {
    renderRoute('/dashboard');

    expect(screen.getByText('Acesso restrito')).toBeTruthy();
    expect(
      screen.getByText(
        'O dashboard administrativo so pode ser acessado por contas admin no web.',
      ),
    ).toBeTruthy();
  });

  it('renders the admin receipts route registered in the dashboard navigation', async () => {
    pricelyState = {
      accessToken: 'token',
      currentUser: {
        id: 'admin-1',
        email: 'admin@pricely.local',
        displayName: 'Admin',
        role: 'admin',
      },
      isAuthenticated: true,
    };

    renderRoute('/dashboard/notas');

    expect(await screen.findByText('Notas fiscais processadas')).toBeTruthy();
  });

  it('renders the receipt audit deep link by receipt id', async () => {
    pricelyState = {
      accessToken: 'token',
      currentUser: {
        id: 'admin-1',
        email: 'admin@pricely.local',
        displayName: 'Admin',
        role: 'admin',
      },
      isAuthenticated: true,
    };

    renderRoute('/dashboard/nota/receipt-1');

    expect(await screen.findByText('Auditoria da nota fiscal')).toBeTruthy();
    expect(screen.getByText('Liberar processamento')).toBeTruthy();
  });

  it('renders a custom route error instead of the React Router default page', () => {
    pricelyState = {
      accessToken: 'token',
      currentUser: {
        id: 'admin-1',
        email: 'admin@pricely.local',
        displayName: 'Admin',
        role: 'admin',
      },
      isAuthenticated: true,
    };

    renderRoute('/dashboard/rota-inexistente');

    expect(screen.getByText('Pagina nao encontrada')).toBeTruthy();
    expect(screen.queryByText('Unexpected Application Error!')).toBeNull();
  });
});
