import { createBrowserRouter, type RouteObject } from 'react-router-dom';

const publicChildren: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { LandingPage } = await import('@/public/public-pages');
      return { Component: LandingPage };
    },
  },
  {
    path: 'ofertas',
    lazy: async () => {
      const { OffersPage } = await import('@/public/public-pages');
      return { Component: OffersPage };
    },
  },
  {
    path: 'ofertas/:offerId',
    lazy: async () => {
      const { OfferDetailPage } = await import('@/public/public-pages');
      return { Component: OfferDetailPage };
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
    path: 'entrar',
    lazy: async () => {
      const { SignInPage } = await import('@/public/public-pages');
      return { Component: SignInPage };
    },
  },
  {
    path: 'criar-conta',
    lazy: async () => {
      const { SignUpPage } = await import('@/public/public-pages');
      return { Component: SignUpPage };
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
    path: 'listas/:listId/checklist',
    lazy: async () => {
      const { ChecklistPage } = await import('@/public/public-pages');
      return { Component: ChecklistPage };
    },
  },
  {
    path: 'otimizacao/:listId',
    lazy: async () => {
      const { OptimizationPage } = await import('@/public/public-pages');
      return { Component: OptimizationPage };
    },
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
];

export const appRouter = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { PublicLayout } = await import('@/public/public-shell');
      return { Component: PublicLayout };
    },
    children: publicChildren,
  },
  {
    path: '/dashboard',
    lazy: async () => {
      const { AdminLayout } = await import('@/dashboard/admin-shell');
      return { Component: AdminLayout };
    },
    children: dashboardChildren,
  },
]);
