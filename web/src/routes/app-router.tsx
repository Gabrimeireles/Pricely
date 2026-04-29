import { createBrowserRouter } from 'react-router-dom';

import { dashboardRoute } from './dashboard';
import { publicRoute } from './public';

export const appRouter = createBrowserRouter([
  publicRoute,
  dashboardRoute,
]);
