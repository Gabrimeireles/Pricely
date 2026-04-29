import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { PricelyProvider } from './app/pricely-context';
import { TooltipProvider } from './components/ui/tooltip';
import './index.css';
import { appRouter } from './routes/app-router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider>
      <PricelyProvider>
        <RouterProvider router={appRouter} />
      </PricelyProvider>
    </TooltipProvider>
  </React.StrictMode>,
);
