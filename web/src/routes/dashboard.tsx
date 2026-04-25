import { AdminLayout } from '@/dashboard/admin-shell';
import {
  AdminCatalogPage,
  AdminListsPage,
  AdminOverviewPage,
  AdminPricesPage,
  AdminQueuePage,
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
      path: 'precos',
      element: <AdminPricesPage />,
    },
    {
      path: 'catalogo',
      element: <AdminCatalogPage />,
    },
    {
      path: 'listas',
      element: <AdminListsPage />,
    },
    {
      path: 'fila',
      element: <AdminQueuePage />,
    },
  ],
};
