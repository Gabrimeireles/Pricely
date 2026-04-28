// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChecklistPage } from './public-pages';

const updateListItemPurchaseStatus = vi.fn();

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
            brandPreferenceMode: 'preferred',
            preferredBrandNames: ['Camil'],
          },
        ],
      },
    ],
    updateListItemPurchaseStatus,
  }),
}));

describe('ChecklistPage', () => {
  beforeEach(() => {
    updateListItemPurchaseStatus.mockReset();
    updateListItemPurchaseStatus.mockResolvedValue({});
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

    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() =>
      expect(updateListItemPurchaseStatus).toHaveBeenCalledWith(
        'list-1',
        'item-1',
        'purchased',
      ),
    );
  });
});
