import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { MonetaryPrivacyProvider } from './app/monetary-privacy-context';
import { PricelyProvider } from './app/pricely-context';
import { ThemeProvider } from './app/theme-context';
import { TooltipProvider } from './components/ui/tooltip';
import './index.css';
import { appRouter } from './routes/app-router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <MonetaryPrivacyProvider>
          <PricelyProvider>
            <RouterProvider router={appRouter} />
          </PricelyProvider>
        </MonetaryPrivacyProvider>
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
