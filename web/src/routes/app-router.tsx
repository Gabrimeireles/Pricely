import { createBrowserRouter } from 'react-router-dom';

import { DashboardHome } from '../dashboard/dashboard-home';
import { MarketingHome } from '../marketing/marketing-home';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <MarketingHome />,
  },
  {
    path: '/dashboard',
    element: <DashboardHome />,
  },
]);
