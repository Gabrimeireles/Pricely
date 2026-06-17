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

const list = {
  id: 'list-1',
  name: 'Compra responsiva',
  preferredRegionId: 'sao-paulo-sp',
  status: 'ready',
  lastMode: 'global_multi',
  latestEstimatedSavings: 12.4,
  latestOptimizationStatus: 'completed',
  latestOptimizedAt: '2026-05-10T10:00:00.000Z',
  createdAt: '2026-05-10T09:00:00.000Z',
  updatedAt: '2026-05-10T10:00:00.000Z',
  items: [
    {
      id: 'item-1',
      requestedName: 'Cafe torrado 500g',
      catalogProductId: 'catalog-1',
      brandPreferenceMode: 'any',
      preferredBrandNames: [],
      imageUrl: '/uploads/cafe.png',
      quantity: 1,
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
  productName: 'Cafe torrado',
  variantName: 'Cafe Pilao 500g',
  displayName: 'Cafe Pilao 500g',
  imageUrl: '/uploads/cafe.png',
  packageLabel: '500 g',
  priceAmount: 15.9,
  basePriceAmount: 18.9,
  promotionalPriceAmount: 15.9,
  savingsVsRegionalAverage: 1.2,
  sourceLabel: 'Seed responsivo',
  observedAt: '2026-05-10T08:00:00.000Z',
  storeName: 'Mercado Centro',
  neighborhood: 'Centro',
  confidenceLevel: 'high',
};

async function mockResponsiveApi(
  page: Page,
  sessionToken: 'customer-token' | 'admin-token' | null,
) {
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const authHeader = request.headers().authorization ?? '';

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/regions') {
      return json([
        region,
        {
          id: 'campinas-sp',
          slug: 'campinas-sp',
          name: 'Campinas',
          stateCode: 'SP',
          implantationStatus: 'activating',
          activeEstablishmentCount: 0,
          offerCoverageStatus: 'collecting_data',
        },
      ]);
    }

    if (path === '/regions/impact') {
      return json({ totalEstimatedSavings: 450, optimizedListsCount: 32 });
    }

    if (method === 'POST' && path === '/auth/refresh') {
      if (!sessionToken) {
        return json({ message: 'No refresh session' }, 401);
      }

      const isAdmin = sessionToken === 'admin-token';
      return json({
        accessToken: sessionToken,
        user: {
          id: isAdmin ? 'admin-1' : 'user-1',
          email: isAdmin ? 'admin@pricely.test' : 'cliente@pricely.test',
          displayName: isAdmin ? 'Admin Pricely' : 'Cliente Pricely',
          role: isAdmin ? 'admin' : 'customer',
          preferredRegionSlug: 'sao-paulo-sp',
          profileStats: {
            totalEstimatedSavings: 12.4,
            shoppingListsCount: 1,
            completedOptimizationRuns: 1,
            contributionsCount: 0,
            receiptSubmissionsCount: 0,
            offerReportsCount: 0,
          },
          entitlement: {
            plan: isAdmin ? 'premium' : 'free',
            status: 'active',
            availableOptimizationTokens: isAdmin ? 99 : 2,
            monthlyFreeOptimizationTokens: 2,
            billingEnabled: false,
            checkoutEnabled: false,
          },
        },
      });
    }

    if (path === '/regions/sao-paulo-sp/offers') {
      return json({
        region,
        activeEstablishmentCount: 2,
        offerCoverageStatus: 'live',
        offers: [offer],
        groupedOffers: [
          {
            id: 'variant-1',
            catalogProductId: 'catalog-1',
            productVariantId: 'variant-1',
            productName: 'Cafe torrado',
            variantName: 'Cafe Pilao 500g',
            imageUrl: '/uploads/cafe.png',
            packageLabel: '500 g',
            bestOffer: offer,
            alternativeOffers: [],
            offers: [offer],
            establishmentCount: 1,
            cheapestPriceAmount: 15.9,
            averagePriceAmount: 15.9,
            highestPriceAmount: 15.9,
          },
        ],
      });
    }

    if (path === '/auth/me') {
      const isAdmin = authHeader.includes('admin-token');
      return json({
        id: isAdmin ? 'admin-1' : 'user-1',
        email: isAdmin ? 'admin@pricely.test' : 'cliente@pricely.test',
        displayName: isAdmin ? 'Admin Pricely' : 'Cliente Pricely',
        role: isAdmin ? 'admin' : 'customer',
        preferredRegionSlug: 'sao-paulo-sp',
        profileStats: {
          totalEstimatedSavings: 12.4,
          shoppingListsCount: 1,
          completedOptimizationRuns: 1,
          contributionsCount: 0,
          receiptSubmissionsCount: 0,
          offerReportsCount: 0,
        },
        entitlement: {
          plan: isAdmin ? 'premium' : 'free',
          status: 'active',
          availableOptimizationTokens: isAdmin ? 99 : 2,
          monthlyFreeOptimizationTokens: 2,
          billingEnabled: false,
          checkoutEnabled: false,
        },
      });
    }

    if (path === '/shopping-lists' && method === 'GET') {
      return json([list]);
    }

    if (path === '/shopping-lists/list-1') {
      return json(list);
    }

    if (path === '/shopping-lists/list-1/optimizations/latest') {
      return json({
        id: 'run-1',
        shoppingListId: 'list-1',
        mode: 'global_multi',
        status: 'completed',
        totalEstimatedCost: 15.9,
        estimatedSavings: 1.2,
        coverageStatus: 'complete',
        explanationSummary: 'Oferta confirmada com dados recentes.',
        createdAt: '2026-05-10T10:00:00.000Z',
        completedAt: '2026-05-10T10:00:02.000Z',
        selections: [
          {
            id: 'selection-1',
            shoppingListItemId: 'item-1',
            shoppingListItemName: 'Cafe torrado 500g',
            selectedVariantName: 'Cafe Pilao 500g',
            selectedPackageLabel: '500 g',
            establishmentName: 'Mercado Centro',
            establishmentNeighborhood: 'Centro',
            estimatedCost: 15.9,
            priceAmount: 15.9,
            regionalAveragePriceAmount: 17.1,
            savingsVsComparison: 1.2,
            sourceLabel: 'Seed responsivo',
            observedAt: '2026-05-10T08:00:00.000Z',
            trustFactor: 82,
            trustLevel: 'high',
            trustEvidenceCount: 2,
            trustFreshnessDays: 1,
            selectionStatus: 'selected',
            decisionReason: 'selected_confirmed_offer',
          },
        ],
      });
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

    if (path === '/admin/queue-health') {
      return json({
        queuedJobs: 1,
        runningJobs: 0,
        failedJobs: 0,
        completedJobs: 3,
        jobsByStatus: { queued: 1, completed: 3 },
        queues: ['optimization'],
        recentFailures: [],
      });
    }

    if (path === '/admin/processing-jobs') {
      return json([
        {
          id: 'job-1',
          queueName: 'optimization',
          jobType: 'optimization.run',
          resourceType: 'shopping_list',
          resourceId: 'list-1',
          status: 'completed',
          attemptCount: 1,
          createdAt: '2026-05-10T10:00:00.000Z',
          updatedAt: '2026-05-10T10:03:00.000Z',
          finishedAt: '2026-05-10T10:03:00.000Z',
          owner: {
            id: 'user-1',
            displayName: 'Cliente Pricely',
            email: 'cliente@pricely.test',
          },
          shoppingList: { id: 'list-1', name: 'Compra responsiva' },
          optimizationRun: {
            id: 'run-1',
            mode: 'global_multi',
            status: 'completed',
            createdAt: '2026-05-10T10:00:00.000Z',
            completedAt: '2026-05-10T10:03:00.000Z',
          },
        },
      ]);
    }

    if (path === '/admin/catalog-products') {
      return json([
        {
          id: 'catalog-1',
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
    }

    if (path === '/admin/product-variants') {
      return json([
        {
          id: 'variant-1',
          catalogProductId: 'catalog-1',
          slug: 'cafe-pilao-500g',
          displayName: 'Cafe Pilao 500g',
          brandName: 'Pilao',
          variantLabel: null,
          packageLabel: '500 g',
          imageUrl: '/uploads/cafe.png',
          isActive: true,
        },
      ]);
    }

    if (path === '/admin/offers') {
      return json([]);
    }

    return json({ message: `Unhandled ${method} ${path}` }, 404);
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
}

async function attachViewportScreenshot(page: Page, name: string) {
  await test.info().attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1366, height: 900 },
]) {
  test.describe(`responsive QA ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(() => {
        window.localStorage.setItem(
          'pricely-web-state-v2',
          JSON.stringify({ cityId: 'sao-paulo-sp' }),
        );
      });
    });

    test('keeps public shopper surfaces usable without horizontal overflow', async ({
      page,
    }) => {
      await mockResponsiveApi(page, 'customer-token');

      await page.goto('/');
      await expect(
        page.getByRole('heading', {
          name: /Continue sua lista e otimize preços/,
        }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/cidades');
      await expect(
        page.getByRole('heading', { name: 'Cidades suportadas' }),
      ).toBeVisible();
      await expect(page.getByText(/Campinas/)).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/ofertas');
      await expect(page.getByText('Filtro por estabelecimento')).toBeVisible();
      await expect(page.getByText('Cafe Pilao 500g').first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/listas');
      await expect(page.getByText('Compra responsiva')).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/listas/list-1/checklist');
      await expect(
        page.getByRole('heading', { name: 'Checklist de compra' }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/otimizacao/list-1');
      await expect(page.getByText(/Itens otimizados/)).toBeVisible();
      await expect(
        page.getByText(/Selecionado: Cafe Pilao 500g/),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await attachViewportScreenshot(
        page,
        `public-optimization-${viewport.name}.png`,
      );
    });

    test('keeps admin tables and operations readable without horizontal overflow', async ({
      page,
    }) => {
      await mockResponsiveApi(page, 'admin-token');

      await page.goto('/dashboard/fila');
      await expect(page.getByText('Lista: Compra responsiva')).toBeVisible();
      await expect(page.getByLabel('Abrir detalhe do job job-1')).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/dashboard/catalogo');
      await expect(page.getByLabel('Buscar no catalogo')).toBeVisible();
      await expect(page.getByText('1 de 1 variantes')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await attachViewportScreenshot(page, `admin-catalog-${viewport.name}.png`);
    });
  });
}
