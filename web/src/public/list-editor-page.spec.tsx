// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ListEditorPage } from './public-pages';

const saveList = vi.fn();

const mockPricelyState = {
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
  lists: [] as Array<Record<string, unknown>>,
  preferredMode: 'global_full',
  saveList,
  isAuthenticated: true,
  isBootstrapping: false,
};

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => mockPricelyState,
}));

vi.mock('@/app/api', () => ({
  searchCatalogProducts: vi.fn(async () => [
    {
      id: 'catalog-1',
      slug: 'arroz-tipo-1-1kg',
      name: 'Arroz tipo 1 1kg',
      category: 'Mercearia',
      defaultUnit: 'un',
      imageUrl: null,
      productVariants: [
        {
          id: 'variant-1',
          displayName: 'Arroz Tipo 1 1kg',
          brandName: 'Camil',
          packageLabel: 'Pacote 1kg',
          imageUrl: 'https://example.com/arroz-camil.jpg',
        },
      ],
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
    mockPricelyState.lists = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lets the user choose a base product and keep the default variant rule', async () => {
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
      expect(screen.getByRole('button', { name: 'Configurar' })).toBeTruthy(),
    );

    const searchImage = screen.getByAltText('Arroz tipo 1 1kg') as HTMLImageElement;
    expect(searchImage.src).toContain('https://example.com/arroz-camil.jpg');

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(await screen.findByText('Qualquer variante')).toBeTruthy();
  });

  it('renders the exact variant name for existing list items', async () => {
    mockPricelyState.lists = [
      {
        id: 'list-1',
        name: 'Compra mensal',
        cityId: 'sao-paulo-sp',
        lastMode: 'global_full',
        items: [
          {
            id: 'item-1',
            name: 'Camil · Arroz Tipo 1 1kg',
            catalogProductId: 'catalog-1',
            lockedProductVariantId: 'variant-1',
            brandPreferenceMode: 'exact',
            preferredBrandNames: [],
            imageUrl: 'https://example.com/arroz-camil.jpg',
            quantity: 1,
            unitLabel: 'un',
            purchaseStatus: 'pending',
          },
        ],
      },
    ];

    render(
      <MemoryRouter initialEntries={['/listas/list-1']}>
        <Routes>
          <Route path="/listas/:listId" element={<ListEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Camil · Arroz Tipo 1 1kg')).toBeTruthy();
    expect(await screen.findByText('Variante exata: Camil · Arroz Tipo 1 1kg')).toBeTruthy();
  });
});
