import { expect, test, type Page } from '@playwright/test';

const region = {
  id: 'sao-paulo-sp',
  slug: 'sao-paulo-sp',
  name: 'Sao Paulo',
  stateCode: 'SP',
  implantationStatus: 'active',
  activeEstablishmentCount: 2,
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

const adminUser = {
  ...customerUser,
  id: 'admin-1',
  email: 'admin@pricely.test',
  displayName: 'Admin Pricely',
  role: 'admin',
  entitlement: {
    ...customerUser.entitlement,
    plan: 'premium',
    availableOptimizationTokens: 99,
  },
};

const savedList = {
  id: 'list-1',
  name: 'Compra mensal',
  preferredRegionId: 'sao-paulo-sp',
  status: 'ready',
  lastMode: 'global_full',
  latestEstimatedSavings: 18.5,
  latestOptimizationStatus: 'completed',
  latestOptimizedAt: '2026-05-05T10:00:00.000Z',
  createdAt: '2026-05-05T09:00:00.000Z',
  updatedAt: '2026-05-05T10:00:00.000Z',
  items: [
    {
      id: 'item-1',
      requestedName: 'Arroz tipo 1 1kg',
      catalogProductId: 'catalog-1',
      brandPreferenceMode: 'any',
      preferredBrandNames: [],
      imageUrl: 'https://example.com/arroz.jpg',
      quantity: 2,
      unitLabel: 'un',
      purchaseStatus: 'pending',
      resolutionStatus: 'matched',
    },
  ],
};

const optimizationResult = {
  id: 'run-1',
  shoppingListId: 'list-1',
  mode: 'global_full',
  status: 'completed',
  totalEstimatedCost: 15.8,
  estimatedSavings: 4.2,
  coverageStatus: 'complete',
  explanationSummary: 'Menor cesta encontrada com dados de recibos de usuarios.',
  createdAt: '2026-05-05T10:00:00.000Z',
  completedAt: '2026-05-05T10:00:02.000Z',
  selections: [
    {
      id: 'selection-1',
      shoppingListItemId: 'item-1',
      shoppingListItemName: 'Arroz tipo 1 1kg',
      establishmentName: 'Mercado Centro',
      establishmentNeighborhood: 'Centro',
      estimatedCost: 15.8,
      priceAmount: 7.9,
      comparisonPriceAmount: 9.4,
      regionalAveragePriceAmount: 8.9,
      savingsVsComparison: 1.5,
      sourceLabel: 'Recibo de usuario',
      observedAt: '2026-05-05T09:30:00.000Z',
      selectionStatus: 'selected',
      confidenceNotice: 'Preco observado em recibo recente.',
      decisionReason: 'selected_confirmed_offer',
    },
  ],
};

async function mockApi(page: Page) {
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const authHeader = request.headers().authorization ?? '';
    const isAdminToken = authHeader.includes('admin-token');

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (method === 'POST' && path === '/auth/login') {
      const body = JSON.parse(request.postData() ?? '{}') as { email?: string };
      return json({
        accessToken:
          body.email === adminUser.email ? 'admin-token' : 'customer-token',
        user: body.email === adminUser.email ? adminUser : customerUser,
      });
    }

    if (path === '/auth/me') {
      return json(isAdminToken ? adminUser : customerUser);
    }

    if (path === '/auth/preferred-region') {
      return json(customerUser);
    }

    if (path === '/regions') {
      return json([region]);
    }

    if (path === '/regions/impact') {
      return json({ totalEstimatedSavings: 450, optimizedListsCount: 32 });
    }

    if (path === '/shopping-lists' && method === 'GET') {
      return json([savedList]);
    }

    if (path === '/shopping-lists' && method === 'POST') {
      return json({ ...savedList, id: 'list-2', name: 'Compra semanal', items: [] }, 201);
    }

    if (path === '/shopping-lists/list-2' && method === 'PATCH') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        name: string;
        items: Array<{ requestedName: string; quantity?: number; unitLabel?: string }>;
      };
      return json({
        ...savedList,
        id: 'list-2',
        name: body.name,
        items: body.items.map((item, index) => ({
          id: `item-${index + 2}`,
          requestedName: item.requestedName,
          catalogProductId: 'catalog-1',
          brandPreferenceMode: 'any',
          preferredBrandNames: [],
          imageUrl: 'https://example.com/arroz.jpg',
          quantity: item.quantity ?? 1,
          unitLabel: item.unitLabel ?? 'un',
          purchaseStatus: 'pending',
          resolutionStatus: 'matched',
        })),
      });
    }

    if (path === '/shopping-lists/list-1/items/item-1/purchase-status') {
      return json({
        ...savedList,
        items: [{ ...savedList.items[0], purchaseStatus: 'purchased' }],
      });
    }

    if (path === '/shopping-lists/list-1/optimize') {
      return json({
        id: 'run-1',
        jobId: 'job-1',
        shoppingListId: 'list-1',
        mode: 'global_full',
        status: 'queued',
        queuedAt: '2026-05-05T10:00:00.000Z',
      }, 202);
    }

    if (path === '/shopping-lists/list-1/optimizations/latest') {
      return json(optimizationResult);
    }

    if (path === '/catalog-products/search') {
      return json([
        {
          id: 'catalog-1',
          slug: 'arroz-tipo-1-1kg',
          name: 'Arroz tipo 1 1kg',
          category: 'Mercearia',
          defaultUnit: 'un',
          imageUrl: 'https://example.com/arroz.jpg',
          productVariants: [],
        },
      ]);
    }

    if (path === '/catalog-products/catalog-1/variants') {
      return json([]);
    }

    if (path === '/admin/metrics') {
      return json({
        activeUsers: 12,
        shoppingListsCount: 8,
        optimizationRunsCount: 5,
        activeRegions: 1,
        activeEstablishments: 2,
        activeOffers: 20,
        productCount: 10,
        queuedJobs: 1,
        globalEstimatedSavings: 450,
      });
    }

    if (path === '/admin/processing-jobs') {
      return json([
        {
          id: 'job-1',
          queueName: 'receipts',
          jobType: 'receipt.extract',
          resourceType: 'receipt',
          resourceId: 'receipt-1',
          status: 'queued',
          attemptCount: 0,
          createdAt: '2026-05-05T10:00:00.000Z',
          updatedAt: '2026-05-05T10:00:00.000Z',
          owner: { id: 'user-1', displayName: 'Cliente Pricely', email: 'cliente@pricely.test' },
          receiptRecord: {
            id: 'receipt-1',
            status: 'processed',
            trustLevel: 'pending_review',
            moderationStatus: 'quarantined',
            rewardEligibilityStatus: 'disabled',
            reviewReason: 'suspicious_price_detected',
            storeName: 'Mercado Centro',
            issuedAt: '2026-05-05T09:30:00.000Z',
            lineItemCount: 1,
          },
        },
      ]);
    }

    if (path === '/admin/processing-jobs/job-1') {
      return json({
        id: 'job-1',
        queueName: 'receipts',
        jobType: 'receipt.extract',
        resourceType: 'receipt',
        resourceId: 'receipt-1',
        status: 'queued',
        attemptCount: 0,
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z',
        owner: { id: 'user-1', displayName: 'Cliente Pricely', email: 'cliente@pricely.test' },
        receiptRecord: {
          id: 'receipt-1',
          status: 'processed',
          trustLevel: 'pending_review',
          moderationStatus: 'quarantined',
          rewardEligibilityStatus: 'disabled',
          reviewReason: 'suspicious_price_detected',
          storeName: 'Mercado Centro',
          issuedAt: '2026-05-05T09:30:00.000Z',
          lineItems: [
            {
              id: 'line-1',
              rawProductName: 'Arroz tipo 1 1kg',
              normalizedName: 'arroz tipo 1 1kg',
              quantity: 2,
              unit: 'un',
              unitPrice: 7.9,
              totalPrice: 15.8,
              matchConfidence: 0.72,
            },
          ],
        },
      });
    }

    if (path === '/admin/queue-health') {
      return json({
        queuedJobs: 1,
        runningJobs: 0,
        failedJobs: 0,
        completedJobs: 3,
        jobsByStatus: { queued: 1, completed: 3 },
        queues: ['receipts'],
        recentFailures: [],
      });
    }

    return json({ message: `Unhandled ${method} ${path}` }, 404);
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('MVP shopper flow covers sign-in, city, list, optimization, checklist, and premium gate', async ({ page }) => {
  await page.goto('/entrar');
  await expect(page.getByText('Entrar no Pricely').first()).toBeVisible();
  await page.getByLabel('E-mail').fill(customerUser.email);
  await page.getByLabel('Senha').fill('password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('heading', { name: 'Minhas listas' })).toBeVisible();
  await expect(page.getByText('2 de 2 listas no mês')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Comprar Premium' })).toBeDisabled();

  await page.goto('/cidades');
  await expect(page.getByText('Cidades suportadas').first()).toBeVisible();
  await expect(page.getByText('Sao Paulo · SP')).toBeVisible();

  await page.goto('/listas/nova');
  await page.getByLabel('Nome da lista').fill('Compra semanal');
  await page.getByLabel('Cidade').selectOption('sao-paulo-sp');
  await page.getByLabel('Produto').fill('Arroz');
  await expect(page.getByRole('button', { name: 'Adicionar' })).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByText('Arroz tipo 1 1kg').first()).toBeVisible();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Minhas listas' })).toBeVisible();

  await page.goto('/otimizacao/list-1');
  await expect(page.getByRole('heading', { name: 'Resultado da otimização' })).toBeVisible();
  await page.getByText('Usar este modo').first().click();
  await expect(page.getByText('Decisões por item')).toBeVisible();
  await expect(page.getByText('Oferta confirmada selecionada')).toBeVisible();

  await page.goto('/listas/list-1/checklist');
  await expect(page.getByRole('heading', { name: 'Checklist de compra' })).toBeVisible();
  await page.getByRole('checkbox').click();
  await expect(page.getByText('Comprado')).toBeVisible();
});

test('MVP admin flow covers route protection and queue detail', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Acesso restrito')).toBeVisible();

  await page.evaluate(() => {
    window.localStorage.setItem('pricely-auth-token', 'admin-token');
  });

  await page.goto('/dashboard/fila');
  await expect(page.getByText('Saude da fila')).toBeVisible();
  await expect(page.getByText('recibo receipt-1')).toBeVisible();
  await page.goto('/dashboard/fila/job-1');

  await expect(page.getByText('Mercado Centro')).toBeVisible();
  await expect(page.getByText('Recibo contribuído')).toBeVisible();
  await expect(page.getByText('suspicious_price_detected')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Arroz tipo 1 1kg', exact: true })).toBeVisible();
});
