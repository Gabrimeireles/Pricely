// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ListEditorPage } from './public-pages';

const saveList = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    cityId: 'sao-paulo-sp',
    cities: [
      {
        id: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        activeStoreCount: 1,
        coverageStatus: 'live',
        regionLabel: '1 estabelecimentos ativos',
        status: 'supported',
        stores: [],
        neighborhoods: [],
      },
    ],
    lists: [],
    preferredMode: 'global_full',
    saveList,
    isAuthenticated: true,
    isBootstrapping: false,
  }),
}));

vi.mock('@/app/api', () => ({
  searchCatalogProducts: vi.fn(async () => [
    {
      id: 'catalog-1',
      slug: 'arroz-tipo-1-1kg',
      name: 'Arroz tipo 1 1kg',
      category: 'Mercearia',
      defaultUnit: 'un',
      imageUrl: 'https://example.com/arroz.jpg',
      productVariants: [],
    },
  ]),
  fetchCatalogProductVariants: vi.fn(async () => [
    {
      id: 'variant-1',
      catalogProductId: 'catalog-1',
      slug: 'arroz-camil-1kg',
      displayName: 'Arroz Tipo 1 1kg',
      brandName: 'Camil',
      variantLabel: 'Tipo 1',
      packageLabel: 'Pacote 1kg',
      imageUrl: 'https://example.com/arroz-camil.jpg',
      isActive: true,
    },
  ]),
}));

describe('ListEditorPage', () => {
  beforeEach(() => {
    saveList.mockReset();
    saveList.mockResolvedValue({ id: 'list-1' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lets the user choose a base product and configure preferred brand in the dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/listas/nova']}>
        <Routes>
          <Route path="/listas/:listId" element={<ListEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('1. Defina o contexto da compra')).toBeTruthy();
    expect(screen.getByText('2. Adicione itens reais da sua compra')).toBeTruthy();
    expect(screen.getByText('3. Salve agora ou otimize depois')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Nome da lista'), {
      target: { value: 'Compra mensal' },
    });
    fireEvent.change(screen.getByLabelText('Produto'), {
      target: { value: 'Arroz' },
    });

    await waitFor(() =>
      expect(screen.getByText('Selecione um produto comparavel')).toBeTruthy(),
    );

    fireEvent.change(screen.getByDisplayValue('Selecione um produto comparavel'), {
      target: { value: 'catalog-1' },
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Configurar marca' })).toBeTruthy(),
    );

    expect(
      (screen.getByRole('button', { name: 'Adicionar item' }) as HTMLButtonElement).disabled,
    ).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Configurar marca' }));
    fireEvent.change(screen.getByDisplayValue('Qualquer marca'), {
      target: { value: 'preferred' },
    });
    fireEvent.change(screen.getByLabelText('Marca preferida'), {
      target: { value: 'Camil' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));

    expect(await screen.findByText('Preferir: Camil')).toBeTruthy();
  });
});
