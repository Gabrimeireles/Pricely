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

const adminUser = {
  id: 'admin-1',
  email: 'admin@pricely.test',
  displayName: 'Admin Pricely',
  role: 'admin',
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
    plan: 'premium',
    status: 'active',
    availableOptimizationTokens: 99,
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

async function mockShellApi(page: Page) {
  let sessionToken: 'admin-token' | null = null;

  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (method === 'POST' && path === '/auth/login') {
      sessionToken = 'admin-token';
      return json({ accessToken: sessionToken, user: adminUser });
    }

    if (method === 'POST' && path === '/auth/refresh') {
      if (!sessionToken) {
        return json({ message: 'No refresh session' }, 401);
      }

      return json({ accessToken: sessionToken, user: adminUser });
    }

    if (method === 'POST' && path === '/auth/logout') {
      sessionToken = null;
      return json({ status: 'ok' });
    }

    if (path === '/auth/me') {
      return json(adminUser);
    }

    if (path === '/regions') {
      return json([region]);
    }

    if (path === '/regions/impact') {
      return json({ totalEstimatedSavings: 450, optimizedListsCount: 32 });
    }

    if (method === 'GET' && path === '/notifications') {
      return json([]);
    }

    if (method === 'GET' && path === '/notification-preferences') {
      return json({
        inAppEnabled: true,
        priceDropsEnabled: true,
        receiptOutcomesEnabled: true,
        optimizationReadyEnabled: true,
        emailEnabled: false,
        pushEnabled: false,
      });
    }

    if (path === '/locations' && method === 'GET') {
      return json([]);
    }

    if (path === '/locations/coverage-preview' && method === 'POST') {
      return json({
        regionId: region.id,
        coverageRadiusKm: 5,
        activeEstablishmentCount: 2,
        fallbackUsed: false,
        establishments: [],
      });
    }

    if (path === '/shopping-lists' && method === 'GET') {
      return json([savedList]);
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
        queues: ['receipts'],
        recentFailures: [],
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
          owner: {
            id: 'user-1',
            displayName: 'Cliente Pricely',
            email: 'cliente@pricely.test',
          },
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

    return json({ message: `Unhandled ${method} ${path}` }, 404);
  });
}

async function extractShell(page: Page, name: string) {
  const extraction = await page.evaluate(() => {
    const rectFor = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };

    return {
      path: window.location.pathname,
      title: document.title,
      header: rectFor('header'),
      sidebar: rectFor('[data-slot="sidebar"]'),
      sidebarHeader: rectFor('[data-slot="sidebar-header"]'),
      sidebarFooter: rectFor('[data-slot="sidebar-footer"]'),
      headerNavCount: document.querySelectorAll('header nav').length,
      navLabels: Array.from(
        document.querySelectorAll('[data-sidebar="menu-button"] span'),
      ).map((node) => node.textContent?.trim() ?? ''),
      headings: Array.from(document.querySelectorAll('h1,h2'))
        .map((node) => node.textContent?.trim() ?? '')
        .filter(Boolean)
        .slice(0, 6),
    };
  });

  await page.screenshot({
    fullPage: true,
    path: test.info().outputPath(`${name}.png`),
  });

  await test.info().attach(`${name}-shell-extraction`, {
    body: JSON.stringify(extraction, null, 2),
    contentType: 'application/json',
  });

  return extraction;
}

test.beforeEach(async ({ page }) => {
  await mockShellApi(page);
});

test('public shell uses fixed sidebar navigation instead of topbar nav', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();
  await expect(page.locator('[data-slot="sidebar-header"]')).toBeVisible();
  await expect(page.locator('[data-slot="sidebar-footer"]')).toBeVisible();
  await expect(page.locator('header nav')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Minha lista/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /São Paulo/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Notificacoes/i })).toBeVisible();

  const extraction = await extractShell(page, 'public-home-sidebar');
  expect(extraction.header).not.toBeNull();
  expect(extraction.sidebar).not.toBeNull();
  expect(extraction.sidebarFooter).not.toBeNull();
  expect(extraction.headerNavCount).toBe(0);
  expect(extraction.navLabels).toEqual(
    expect.arrayContaining([
      'Início',
      'Minha lista',
      'Ofertas',
      'Lojas',
      'Notas fiscais',
    ]),
  );
});

test('dashboard shell keeps sidebar, header, and footer fixed across admin pages', async ({
  page,
}) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(adminUser.email);
  await page.getByLabel('Senha').fill('password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Minhas listas' }),
  ).toBeVisible();

  await page.goto('/dashboard/fila');

  await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();
  await expect(page.locator('[data-slot="sidebar-header"]')).toBeVisible();
  await expect(page.locator('[data-slot="sidebar-footer"]')).toBeVisible();
  await expect(page.locator('header nav')).toHaveCount(0);
  await expect(
    page.getByText('Dashboard restrito a administradores'),
  ).toBeVisible();
  await expect(page.getByText('Admin Pricely')).toBeVisible();
  await page
    .getByRole('button', { name: /Ocultar valores monetários/i })
    .first()
    .hover();
  await expect(
    page.getByText(/Oculta valores monetários sensíveis em métricas/i),
  ).toBeVisible();

  const extraction = await extractShell(page, 'admin-queue-sidebar');
  expect(extraction.header).not.toBeNull();
  expect(extraction.sidebar).not.toBeNull();
  expect(extraction.sidebarFooter).not.toBeNull();
  expect(extraction.headerNavCount).toBe(0);
  expect(extraction.navLabels).toEqual(
    expect.arrayContaining(['Visao geral', 'Notas fiscais', 'Fila e saude']),
  );
});
