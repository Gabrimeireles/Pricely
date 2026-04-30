// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PricelyProvider } from '@/app/pricely-context';
import { ThemeProvider } from '@/app/theme-context';
import { TooltipProvider } from '@/components/ui/tooltip';

import { dashboardRoute } from './dashboard';
import { publicRoute } from './public';

vi.mock('@/app/theme-context', async () => {
  const actual = await vi.importActual('@/app/theme-context');
  return {
    ...actual,
    useTheme: () => ({
      theme: 'light',
      toggleTheme: () => undefined,
    }),
  };
});

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
      <ThemeProvider>
        <PricelyProvider>
          <RouterProvider router={router} />
        </PricelyProvider>
      </ThemeProvider>
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
    expect(screen.getByText('economia com contexto real')).toBeTruthy();
  });

  it('blocks the admin overview route for a non-admin session', () => {
    renderRoute('/dashboard');

    expect(screen.getByText('Acesso restrito')).toBeTruthy();
    expect(
      screen.getByText(
        'O dashboard administrativo so pode ser acessado por contas admin no web.',
      ),
    ).toBeTruthy();
  });
});
