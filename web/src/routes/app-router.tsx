import { createBrowserRouter } from 'react-router-dom';

import { DashboardHome } from '../dashboard/dashboard-home';
import { marketingRoute } from './marketing';

export const appRouter = createBrowserRouter([
  marketingRoute,
  {
    path: '/dashboard',
    element: <DashboardHome />,
  },
]);
