import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './index.css';
import { appRouter } from './routes/app-router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={appRouter} />
  </React.StrictMode>,
);
