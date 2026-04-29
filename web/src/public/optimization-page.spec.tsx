// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OptimizationPage } from './public-pages';

const runOptimization = vi.fn();
const setPreferredMode = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    isAuthenticated: true,
    isBootstrapping: false,
    preferredMode: 'global_full',
    runOptimization,
    setPreferredMode,
    optimizationResults: {},
    lists: [
      {
        id: 'list-1',
        name: 'Compra mensal',
        cityId: 'sao-paulo-sp',
        lastMode: 'global_full',
        items: [],
      },
    ],
  }),
}));

describe('OptimizationPage', () => {
  beforeEach(() => {
    runOptimization.mockReset();
    setPreferredMode.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders explicit trade-off cards for all optimization modes', () => {
    render(
      <MemoryRouter initialEntries={['/otimizacao/list-1']}>
        <Routes>
          <Route path="/otimizacao/:listId" element={<OptimizationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Escolha o modo')).toBeTruthy();
    expect(screen.getByText('Local')).toBeTruthy();
    expect(screen.getByText('Global unico')).toBeTruthy();
    expect(screen.getByText('Global completo')).toBeTruthy();
    expect(
      screen.getByText('Prioriza concluir a compra com o menor deslocamento possivel.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Procura a melhor loja unica para equilibrar cobertura e preco.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Busca o menor custo total item a item na cidade selecionada.'),
    ).toBeTruthy();
  });
});
