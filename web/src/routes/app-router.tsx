import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { RouteErrorPage } from './route-error';

function RouteHydrationFallback() {
  return (
    <div
      className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground"
      role="status"
    >
      Carregando Pricely...
    </div>
  );
}

const shopperChildren: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { HomePage } = await import('@/public/home-page');
      return { Component: HomePage };
    },
  },
  {
    path: 'ofertas',
    lazy: async () => {
      const { OffersPage } = await import('@/public/offers-page');
      return { Component: OffersPage };
    },
  },
  {
    path: 'cidades',
    lazy: async () => {
      const { CitiesPage } = await import('@/public/public-pages');
      return { Component: CitiesPage };
    },
  },
  {
    path: 'listas',
    lazy: async () => {
      const { ListsPage } = await import('@/public/public-pages');
      return { Component: ListsPage };
    },
  },
  {
    path: 'listas/:listId',
    lazy: async () => {
      const { ListEditorPage } = await import('@/public/public-pages');
      return { Component: ListEditorPage };
    },
  },
  {
    path: 'notas',
    lazy: async () => {
      const { ReceiptSubmissionPage } = await import('@/public/public-pages');
      return { Component: ReceiptSubmissionPage };
    },
  },
  {
    path: 'lojas',
    lazy: async () => {
      const { StoresPage } = await import('@/public/stores-page');
      return { Component: StoresPage };
    },
  },
  {
    path: 'cupons',
    lazy: async () => {
      const { CouponsPage } = await import('@/public/coupons-page');
      return { Component: CouponsPage };
    },
  },
  {
    path: 'historico',
    lazy: async () => {
      const { HistoryPage } = await import('@/public/history-page');
      return { Component: HistoryPage };
    },
  },
  {
    path: 'configuracoes',
    lazy: async () => {
      const { SettingsPage } = await import('@/public/settings-page');
      return { Component: SettingsPage };
    },
  },
  {
    path: 'otimizacao/:listId',
    lazy: async () => {
      const { OptimizationResultPage } = await import('@/public/optimization-result-page');
      return { Component: OptimizationResultPage };
    },
  },
  {
    path: 'compartilhar/listas/:shareToken',
    lazy: async () => {
      const { SharedListPage } = await import('@/public/public-pages');
      return { Component: SharedListPage };
    },
  },
  {
    path: 'listas/:listId/checklist',
    lazy: async () => {
      const { ChecklistPage } = await import('@/public/public-pages');
      return { Component: ChecklistPage };
    },
  },
  {
    path: '*',
    element: <RouteErrorPage />,
  },
];

const dashboardChildren: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { AdminOverviewPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminOverviewPage };
    },
  },
  {
    path: 'regioes',
    lazy: async () => {
      const { AdminRegionsPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminRegionsPage };
    },
  },
  {
    path: 'estabelecimentos',
    lazy: async () => {
      const { AdminEstablishmentsPage } = await import(
        '@/dashboard/dashboard-pages'
      );
      return { Component: AdminEstablishmentsPage };
    },
  },
  {
    path: 'produtos',
    lazy: async () => {
      const { AdminCatalogPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminCatalogPage };
    },
  },
  {
    path: 'ofertas',
    lazy: async () => {
      const { AdminOffersPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminOffersPage };
    },
  },
  {
    path: 'listas',
    lazy: async () => {
      const { AdminListsPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminListsPage };
    },
  },
  {
    path: 'usuarios',
    lazy: async () => {
      const { AdminUsersPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminUsersPage };
    },
  },
  {
    path: 'notas',
    lazy: async () => {
      const { AdminReceiptsPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminReceiptsPage };
    },
  },
  {
    path: 'nota/:receiptId',
    lazy: async () => {
      const { AdminReceiptAuditPage } = await import(
        '@/dashboard/dashboard-pages'
      );
      return { Component: AdminReceiptAuditPage };
    },
  },
  {
    path: 'fila',
    lazy: async () => {
      const { AdminQueuePage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminQueuePage };
    },
  },
  {
    path: 'fila/:jobId',
    lazy: async () => {
      const { AdminQueueDetailPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminQueueDetailPage };
    },
  },
  {
    path: 'precos',
    lazy: async () => {
      const { AdminOffersPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminOffersPage };
    },
  },
  {
    path: 'catalogo',
    lazy: async () => {
      const { AdminCatalogPage } = await import('@/dashboard/dashboard-pages');
      return { Component: AdminCatalogPage };
    },
  },
  {
    path: '*',
    element: <RouteErrorPage />,
  },
];

export const appRouter = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <RouteHydrationFallback />,
    lazy: async () => {
      const { ShopperShell } = await import('@/public/shopper-shell');
      return { Component: ShopperShell };
    },
    children: shopperChildren,
  },
  {
    path: '/entrar',
    errorElement: <RouteErrorPage />,
    lazy: async () => {
      const { SignInPage } = await import('@/public/public-pages');
      return { Component: SignInPage };
    },
  },
  {
    path: '/criar-conta',
    errorElement: <RouteErrorPage />,
    lazy: async () => {
      const { SignUpPage } = await import('@/public/public-pages');
      return { Component: SignUpPage };
    },
  },
  {
    path: '/dashboard',
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <RouteHydrationFallback />,
    lazy: async () => {
      const { AdminLayout } = await import('@/dashboard/admin-shell');
      return { Component: AdminLayout };
    },
    children: dashboardChildren,
  },
  {
    path: '*',
    element: <RouteErrorPage />,
  },
]);
