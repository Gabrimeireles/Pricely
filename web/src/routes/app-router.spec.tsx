// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { PricelyProvider } from '@/app/pricely-context';
import { TooltipProvider } from '@/components/ui/tooltip';

import { dashboardRoute } from './dashboard';
import { publicRoute } from './public';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter([publicRoute, dashboardRoute], {
    initialEntries: [initialEntry],
  });

  return render(
    <TooltipProvider>
      <PricelyProvider>
        <RouterProvider router={router} />
      </PricelyProvider>
    </TooltipProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe('application routes', () => {
  it('renders the public sign-in page inside the shared public shell', () => {
    renderRoute('/entrar');

    expect(screen.getByText('Entrar no Pricely')).toBeTruthy();
    expect(screen.getByText('Mesma conta no mobile e no web')).toBeTruthy();
  });

  it('renders the admin overview route inside the admin shell', () => {
    renderRoute('/dashboard');

    expect(screen.getByText('Dashboard restrito a administradores')).toBeTruthy();
    expect(screen.getByText('Visão geral operacional')).toBeTruthy();
  });
});
