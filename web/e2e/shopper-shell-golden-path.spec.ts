import { expect, test, type Page } from '@playwright/test';

const region = {
  id: 'sao-paulo-sp',
  slug: 'sao-paulo-sp',
  name: 'Sao Paulo',
  stateCode: 'SP',
  implantationStatus: 'active',
  activeEstablishmentCount: 3,
  offerCoverageStatus: 'live',
};

const customerUser = {
  id: 'user-1',
  email: 'cliente@pricely.test',
  displayName: 'Cliente Pricely',
  role: 'customer',
  preferredRegionSlug: 'sao-paulo-sp',
  profileStats: {
    totalEstimatedSavings: 18.5,
    shoppingListsCount: 1,
    completedOptimizationRuns: 1,
    contributionsCount: 0,
    receiptSubmissionsCount: 0,
    offerReportsCount: 0,
  },
  entitlement: {
    plan: 'free',
    status: 'active',
    availableOptimizationTokens: 2,
    monthlyFreeOptimizationTokens: 2,
    billingEnabled: false,
    checkoutEnabled: false,
  },
};

const savedList = {
  id: 'list-1',
  name: 'Compra mensal',
  preferredRegionId: 'sao-paulo-sp',
  status: 'ready',
  lastMode: 'global_multi',
  latestEstimatedSavings: 18.5,
  latestOptimizationStatus: 'completed',
  latestOptimizedAt: '2026-05-05T10:00:00.000Z',
  createdAt: '2026-05-05T09:00:00.000Z',
  updatedAt: '2026-05-05T10:00:00.000Z',
  items: [
    {
      id: 'item-1',
      requestedName: 'Arroz tipo 1 5kg',
      catalogProductId: 'catalog-1',
      brandPreferenceMode: 'any',
      preferredBrandNames: [],
      imageUrl: null,
      quantity: 2,
      unitLabel: 'un',
      purchaseStatus: 'pending',
      resolutionStatus: 'matched',
    },
  ],
};

const offer = {
  id: 'offer-1',
  catalogProductId: 'catalog-1',
  productVariantId: 'variant-1',
  productName: 'Arroz Camil',
  displayName: 'Arroz Camil tipo 1 5kg',
  packageLabel: '5 kg',
  priceAmount: 21.9,
  savingsVsComparison: 2.1,
  confidenceLevel: 'high',
  category: 'Grãos',
  storeName: 'Unidade Vila Mariana',
  neighborhood: 'Vila Mariana',
  sourceLabel: 'Nota fiscal',
  observedAt: '2026-06-01T10:00:00.000Z',
};

const offersResponse = {
  region,
  activeEstablishmentCount: 3,
  offerCoverageStatus: 'live',
  offers: [offer],
  pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false },
  filters: { stores: ['Unidade Vila Mariana'], categories: ['Grãos'] },
};

async function mockApi(page: Page) {
  let sessionToken: string | null = null;

  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (method === 'POST' && path === '/auth/login') {
      sessionToken = 'customer-token';
      return json({ accessToken: sessionToken, user: customerUser });
    }
    if (method === 'POST' && path === '/auth/refresh') {
      return sessionToken ? json({ accessToken: sessionToken, user: customerUser }) : json({ message: 'Unauthorized' }, 401);
    }
    if (method === 'POST' && path === '/auth/logout') {
      sessionToken = null;
      return json({ status: 'ok' });
    }
    if (path === '/auth/me') return json(customerUser);
    if (path === '/regions') return json([region]);
    if (path === '/locations' && method === 'GET') return json([]);
    if (method === 'GET' && path === '/notifications') return json([]);
    if (method === 'GET' && path === '/notification-preferences') {
      return json({ inAppEnabled: true, priceDropsEnabled: true, receiptOutcomesEnabled: true, optimizationReadyEnabled: true });
    }
    if (path === '/shopping-lists' && method === 'GET') return json([savedList]);
    if (path.startsWith('/shopping-lists/') && path.endsWith('/optimizations/latest')) {
      return json({ id: 'run-1', shoppingListId: 'list-1', mode: 'global_multi', status: 'completed', coverageStatus: 'complete', estimatedSavings: 18.5, totalEstimatedCost: 62.5, createdAt: '2026-05-05T10:00:00.000Z', completedAt: '2026-05-05T10:01:00.000Z', items: [] });
    }
    if (path.match(/\/regions\/[^/]+\/offers/)) return json(offersResponse);

    return route.continue();
  });
}

test.describe('ShopperShell golden path', () => {
  test('home sem login mostra botão Entrar e não-autenticado não acessa /listas', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

    await page.goto('/listas');
    await expect(page).toHaveURL(/\/entrar/);
  });

  test('login → home → ofertas → listas → histórico (golden path autenticado)', async ({ page }) => {
    await mockApi(page);

    // 1. Login
    await page.goto('/entrar');
    await page.fill('#email', 'cliente@pricely.test');
    await page.fill('#password', 'customer-password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(listas)?$/);

    // 2. Home
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Sair')).toBeVisible();
    await expect(page.getByText('CP')).toBeVisible();

    // 3. Ofertas — devem carregar dados reais
    await page.goto('/ofertas');
    await expect(page.getByText('Ofertas')).toBeVisible();
    await expect(page.getByText('Arroz Camil tipo 1 5kg')).toBeVisible({ timeout: 5000 });

    // 4. Listas — rota protegida, deve funcionar logado
    await page.goto('/listas');
    await expect(page).not.toHaveURL(/entrar/);
    await expect(page.getByText('Minhas listas')).toBeVisible();

    // 5. Histórico
    await page.goto('/historico');
    await expect(page.getByText('Histórico')).toBeVisible();

    // 6. Logout → redireciona para /entrar
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/entrar/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('/cupons mostra estado em breve', async ({ page }) => {
    await mockApi(page);
    await page.goto('/cupons');
    await expect(page.getByText('Cupons em breve')).toBeVisible();
  });

  test('bell carrega notificações reais e mostra sem notificações', async ({ page }) => {
    await mockApi(page);
    await page.goto('/entrar');
    await page.fill('#email', 'cliente@pricely.test');
    await page.fill('#password', 'customer-password');
    await page.click('button[type="submit"]');
    await page.goto('/');
    await page.getByRole('button', { name: 'Notificações' }).click();
    await expect(page.getByText('Nenhuma notificação ainda.')).toBeVisible();
  });
});
