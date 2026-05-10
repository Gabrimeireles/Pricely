// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChecklistPage } from './public-pages';

const updateListItemPurchaseStatus = vi.fn();
const completeListCheckout = vi.fn();
const loadLatestOptimization = vi.fn();
const reportListItemPriceMismatch = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    isAuthenticated: true,
    isBootstrapping: false,
    lists: [
      {
        id: 'list-1',
        name: 'Compra do mes',
        cityId: 'sao-paulo-sp',
        lastMode: 'global_full',
        updatedAt: '2026-04-28T12:00:00.000Z',
        expectedSavings: 0,
        items: [
          {
            id: 'item-1',
            name: 'Arroz tipo 1 1kg',
            quantity: 1,
            unitLabel: 'un',
            purchaseStatus: 'pending',
            status: 'resolved',
            imageUrl: 'https://example.com/arroz.png',
            brandPreferenceMode: 'exact',
            preferredBrandNames: [],
          },
        ],
      },
    ],
    updateListItemPurchaseStatus,
    completeListCheckout,
    loadLatestOptimization,
    optimizationResults: {
      'list-1': {
        selections: [
          {
            shoppingListItemId: 'item-1',
            shoppingListItemName: 'Arroz tipo 1 1kg',
            priceAmount: 21.9,
            selectionStatus: 'selected',
          },
        ],
      },
    },
    reportListItemPriceMismatch,
  }),
}));

describe('ChecklistPage', () => {
  beforeEach(() => {
    updateListItemPurchaseStatus.mockReset();
    updateListItemPurchaseStatus.mockResolvedValue({});
    completeListCheckout.mockReset();
    completeListCheckout.mockResolvedValue({});
    loadLatestOptimization.mockReset();
    loadLatestOptimization.mockResolvedValue(null);
    reportListItemPriceMismatch.mockReset();
    reportListItemPriceMismatch.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders checklist items and syncs purchased state', async () => {
    render(
      <MemoryRouter initialEntries={['/listas/list-1/checklist']}>
        <Routes>
          <Route path="/listas/:listId/checklist" element={<ChecklistPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Checklist de compra')).toBeTruthy();
    expect(screen.getByText('Arroz tipo 1 1kg')).toBeTruthy();
    expect(screen.getByText('0 de 1 itens comprados')).toBeTruthy();
    expect(screen.getByText('Preço previsto: R$ 21,90')).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() =>
      expect(updateListItemPurchaseStatus).toHaveBeenCalledWith(
        'list-1',
        'item-1',
        'purchased',
      ),
    );
  });

  it('submits a price mismatch report from the checklist item', async () => {
    render(
      <MemoryRouter initialEntries={['/listas/list-1/checklist']}>
        <Routes>
          <Route path="/listas/:listId/checklist" element={<ChecklistPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByText('Reportar preço')[0]);
    fireEvent.change(
      screen.getByPlaceholderText(
        'Ex.: etiqueta mostrava outro valor ou item indisponível',
      ),
      {
      target: { value: 'Etiqueta mostrava outro preço' },
      },
    );
    fireEvent.click(screen.getByText('Enviar reporte'));

    await waitFor(() =>
      expect(reportListItemPriceMismatch).toHaveBeenCalledWith(
        'list-1',
        'item-1',
        {
          expectedPrice: 21.9,
          reportedPrice: 21.9,
          reason: 'Etiqueta mostrava outro preço',
        },
      ),
    );
  });
});
