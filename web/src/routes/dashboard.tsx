import { AdminLayout } from '@/dashboard/admin-shell';
import {
  AdminEstablishmentsPage,
  AdminCatalogPage,
  AdminListsPage,
  AdminOffersPage,
  AdminOverviewPage,
  AdminQueueDetailPage,
  AdminQueuePage,
  AdminRegionsPage,
} from '@/dashboard/dashboard-pages';

export const dashboardRoute = {
  path: '/dashboard',
  element: <AdminLayout />,
  children: [
    {
      index: true,
      element: <AdminOverviewPage />,
    },
    {
      path: 'regioes',
      element: <AdminRegionsPage />,
    },
    {
      path: 'estabelecimentos',
      element: <AdminEstablishmentsPage />,
    },
    {
      path: 'produtos',
      element: <AdminCatalogPage />,
    },
    {
      path: 'ofertas',
      element: <AdminOffersPage />,
    },
    {
      path: 'listas',
      element: <AdminListsPage />,
    },
    {
      path: 'fila',
      element: <AdminQueuePage />,
    },
    {
      path: 'fila/:jobId',
      element: <AdminQueueDetailPage />,
    },
    {
      path: 'precos',
      element: <AdminOffersPage />,
    },
    {
      path: 'catalogo',
      element: <AdminCatalogPage />,
    },
  ],
};
