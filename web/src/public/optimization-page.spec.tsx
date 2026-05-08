// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OptimizationPage } from './public-pages';

const runOptimization = vi.fn();
const setPreferredMode = vi.fn();
const loadLatestOptimization = vi.fn();
let optimizationResults: Record<string, unknown> = {};

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    isAuthenticated: true,
    isBootstrapping: false,
    preferredMode: 'global_full',
    runOptimization,
    setPreferredMode,
    loadLatestOptimization,
    optimizationResults,
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
    loadLatestOptimization.mockReset();
    optimizationResults = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders explicit mode guidance without technical backend copy', () => {
    render(
      <MemoryRouter initialEntries={['/otimizacao/list-1']}>
        <Routes>
          <Route path="/otimizacao/:listId" element={<OptimizationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Escolha o modo')).toBeTruthy();
    expect(screen.getByText('Local')).toBeTruthy();
    expect(screen.getByText('Global único')).toBeTruthy();
    expect(screen.getByText('Global completo')).toBeTruthy();
    expect(
      screen.getByText('Compra mensal - São Paulo. Compare o melhor total, a cobertura e a economia estimada da sua compra.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Prioriza concluir a compra com o menor deslocamento possível.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Procura a melhor loja única para equilibrar cobertura e preço.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Busca o menor custo total item a item na cidade selecionada.'),
    ).toBeTruthy();
    expect(screen.queryByText(/backend/i)).toBeNull();
    expect(loadLatestOptimization).toHaveBeenCalledWith('list-1');
  });

  it('loads the latest persisted result and renders shopper-facing PT-BR evidence copy', async () => {
    optimizationResults = {
      'list-1': {
        id: 'run-1',
        shoppingListId: 'list-1',
        mode: 'global_full',
        status: 'completed',
        totalEstimatedCost: 21.9,
        estimatedSavings: 1,
        coverageStatus: 'complete',
        createdAt: '2026-05-08T10:00:00.000Z',
        completedAt: '2026-05-08T10:00:10.000Z',
        selections: [
          {
            id: 'selection-1',
            shoppingListItemId: 'item-1',
            shoppingListItemName: 'Cafe Pilao 500g',
            establishmentName: 'Mercado Centro',
            establishmentNeighborhood: 'Centro',
            priceAmount: 21.9,
            comparisonPriceAmount: 22.9,
            regionalAveragePriceAmount: 22.9,
            savingsVsComparison: 1,
            sourceLabel: 'nota fiscal do usuario',
            observedAt: '2026-05-08T09:00:00.000Z',
            selectionStatus: 'selected',
            decisionReason: 'selected_confirmed_offer',
          },
        ],
      },
    };

    render(
      <MemoryRouter initialEntries={['/otimizacao/list-1']}>
        <Routes>
          <Route path="/otimizacao/:listId" element={<OptimizationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Completa')).toBeTruthy();
    expect(screen.getByText('Oferta selecionada')).toBeTruthy();
    expect(screen.getByText('Oferta confirmada selecionada')).toBeTruthy();
    expect(
      screen.getByText('R$ 1,00 abaixo da média regional (R$ 22,90)'),
    ).toBeTruthy();
    expect(screen.queryByText(/selected_confirmed_offer/i)).toBeNull();
    expect(screen.queryByText(/selected/i)).toBeNull();
  });
});
