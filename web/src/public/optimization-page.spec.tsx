// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MonetaryPrivacyProvider } from '@/app/monetary-privacy-context';

import { OptimizationPage } from './public-pages';

const runOptimization = vi.fn();
const setPreferredMode = vi.fn();
const loadLatestOptimization = vi.fn();
let optimizationResults: Record<string, unknown> = {};

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    isAuthenticated: true,
    isBootstrapping: false,
    preferredMode: 'global_multi',
    runOptimization,
    setPreferredMode,
    loadLatestOptimization,
    optimizationResults,
    lists: [
      {
        id: 'list-1',
        name: 'Compra mensal',
        cityId: 'sao-paulo-sp',
        lastMode: 'global_multi',
        items: [],
      },
    ],
  }),
}));

function renderOptimizationPage() {
  return render(
    <MonetaryPrivacyProvider>
      <MemoryRouter initialEntries={['/otimizacao/list-1']}>
        <Routes>
          <Route path="/otimizacao/:listId" element={<OptimizationPage />} />
        </Routes>
      </MemoryRouter>
    </MonetaryPrivacyProvider>,
  );
}

describe('OptimizationPage', () => {
  beforeEach(() => {
    runOptimization.mockReset();
    setPreferredMode.mockReset();
    loadLatestOptimization.mockReset();
    optimizationResults = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders explicit mode guidance without technical backend copy', () => {
    renderOptimizationPage();

    expect(screen.getByText('Escolha o modo')).toBeTruthy();
    expect(screen.getByText('Uma loja perto de mim')).toBeTruthy();
    expect(screen.getByText('Menor preco perto de mim')).toBeTruthy();
    expect(screen.getByText('Menor total na cidade')).toBeTruthy();
    expect(document.body.textContent).toMatch(
      /Compra mensal\s+-\s+S[aã]o Paulo\. Compare o melhor total/,
    );
    expect(
      screen.getByText(
        'Prepara a compra em uma unica loja dentro do raio local configurado.',
      ),
    ).toBeTruthy();
    expect(screen.getByText(/exige localizacao salva/i)).toBeTruthy();
    expect(
      screen.getByText(
        'Escolhe item a item entre lojas dentro do raio local configurado.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Busca o menor custo total item a item na cidade selecionada.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/backend/i)).toBeNull();
    expect(loadLatestOptimization).toHaveBeenCalledWith('list-1');
  });

  it('shows actionable local coverage errors instead of raw API JSON', async () => {
    runOptimization.mockRejectedValue(
      new Error(
        JSON.stringify({
          statusCode: 400,
          error: {
            message:
              'No active establishments with coordinates are available inside the selected coverage radius',
            error: 'Bad Request',
            statusCode: 400,
          },
          path: '/shopping-lists/list-1/optimize',
          requestId: 'request-1',
        }),
      ),
    );

    renderOptimizationPage();

    fireEvent.click(screen.getAllByText('Uma loja perto de mim')[0]);

    expect(
      await screen.findByText('Ajuste sua cobertura local'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Nao encontramos estabelecimentos ativos com localizacao dentro do raio escolhido. Aumente o raio, salve outro local ou use o modo de menor total na cidade.',
      ),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain('statusCode');
    expect(document.body.textContent).not.toContain('requestId');

    await waitFor(() => {
      expect(runOptimization).toHaveBeenCalledWith('list-1', 'local_unique');
    });
  });

  it('loads the latest persisted result and renders shopper-facing PT-BR evidence copy', async () => {
    optimizationResults = {
      'list-1': {
        id: 'run-1',
        shoppingListId: 'list-1',
        mode: 'global_multi',
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
            selectedVariantName: 'Cafe Pilao 500g',
            selectedPackageLabel: '500 g',
            establishmentName: 'Mercado Centro',
            establishmentNeighborhood: 'Centro',
            priceAmount: 21.9,
            comparisonPriceAmount: 22.9,
            regionalAveragePriceAmount: 22.9,
            savingsVsComparison: 1,
            sourceLabel: 'nota fiscal do usuario',
            observedAt: '2026-05-08T09:00:00.000Z',
            trustFactor: 78,
            trustLevel: 'high',
            trustEvidenceCount: 3,
            trustFreshnessDays: 1,
            trustExplanation:
              '3 notas fiscais aceitas apoiam este preco; ultima validacao ha 1 dias; confianca da oferta 78/100.',
            selectionStatus: 'selected',
            decisionReason: 'selected_confirmed_offer',
            distanceKm: 1.4,
          },
          {
            id: 'selection-2',
            shoppingListItemId: 'item-2',
            shoppingListItemName: 'Feijao Carioca 1kg',
            estimatedCost: 0,
            sourceLabel: 'sem oferta confirmada',
            trustFactor: 30,
            trustLevel: 'low',
            trustEvidenceCount: 0,
            trustFreshnessDays: 12,
            selectionStatus: 'review',
            decisionReason: 'missing_trusted_offer',
            rejectedReason: 'unavailable_offer',
          },
        ],
      },
    };

    renderOptimizationPage();

    expect(screen.getByText('Completa')).toBeTruthy();
    expect(screen.getByText('Oferta selecionada')).toBeTruthy();
    expect(screen.getByText('Oferta confirmada selecionada')).toBeTruthy();
    expect(
      screen.getByText('Recomendação pronta para virar checklist'),
    ).toBeTruthy();
    expect(
      screen.getByText('Selecionado: Cafe Pilao 500g'),
    ).toBeTruthy();
    expect(document.body.textContent).toMatch(/Confian[cç]a alta/);
    expect(screen.getByText('Feijao Carioca 1kg')).toBeTruthy();
    expect(screen.getByText('78/100')).toBeTruthy();
    expect(screen.getByText('1.4 km do local salvo')).toBeTruthy();
    expect(screen.getByText(/segundo menor elegivel/)).toBeTruthy();
    expect(screen.getByText('Reportar preço')).toBeTruthy();
    expect(screen.getAllByText('Enviar nota').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText(/Exibir/i), {
      target: { value: 'selected' },
    });
    expect(screen.queryByText('Feijao Carioca 1kg')).toBeNull();

    fireEvent.change(screen.getByLabelText(/Exibir/i), {
      target: { value: 'review' },
    });
    expect(screen.getAllByText('Feijao Carioca 1kg').length).toBeGreaterThan(0);
    expect(screen.queryByText('Selecionado: Cafe Pilao 500g')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Indisponíveis/i }));
    expect(screen.getAllByText('Feijao Carioca 1kg').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Itens da lista/i }));
    fireEvent.change(screen.getByLabelText(/Exibir/i), {
      target: { value: 'selected' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ocultar evidência/i }));
    expect(screen.queryByText('Confiança da oferta')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ver evidência/i }));
    expect(screen.getByText('Confiança da oferta')).toBeTruthy();

    expect(screen.queryByText(/selected_confirmed_offer/i)).toBeNull();
    expect(screen.queryByText(/selected/i)).toBeNull();
  });
});
