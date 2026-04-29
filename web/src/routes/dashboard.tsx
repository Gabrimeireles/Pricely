import { AdminLayout } from '@/dashboard/admin-shell';
import {
  AdminEstablishmentsPage,
  AdminCatalogPage,
  AdminListsPage,
  AdminOffersPage,
  AdminOverviewPage,
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
      path: 'precos',
      element: <AdminOffersPage />,
    },
    {
      path: 'catalogo',
      element: <AdminCatalogPage />,
    },
  ],
};
