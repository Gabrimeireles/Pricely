// @vitest-environment jsdom

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicLayout } from './public-shell';

const setCityId = vi.fn();
const saveBrowserLocation = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    cityId: 'campinas-sp',
    setCityId,
    currentUser: null,
    isAuthenticated: false,
    signOut: vi.fn(),
    locationPreferences: [],
    saveBrowserLocation,
    cities: [
      {
        id: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
        activeStoreCount: 0,
        coverageStatus: 'collecting_data',
        regionLabel: '0 estabelecimentos ativos',
        status: 'pilot',
        stores: [],
        neighborhoods: [],
      },
      {
        id: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        activeStoreCount: 2,
        coverageStatus: 'live',
        regionLabel: '2 estabelecimentos ativos',
        status: 'supported',
        stores: [],
        neighborhoods: [],
      },
    ],
  }),
}));

vi.mock('@/app/theme-context', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/components/ui/select', () => {
  const collectItems = (children: unknown): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = [];

    const visit = (node: unknown) => {
      Children.forEach(node as ReactNode, (child) => {
        if (!isValidElement(child)) {
          return;
        }

        const element = child as ReactElement<{
          value?: string;
          children?: ReactNode;
        }>;

        if (element.type === SelectItem) {
          items.push({
            value: element.props.value as string,
            label: String(element.props.children),
          });
        }

        if (element.props.children) {
          visit(element.props.children);
        }
      });
    };

    visit(children);
    return items;
  };

  const Select = ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => {
    const items = collectItems(children);
    return (
      <select
        aria-label="Escolha sua cidade"
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value}
      >
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    );
  };

  const SelectTrigger = ({ children }: { children: ReactNode }) => <>{children}</>;
  const SelectValue = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const SelectContent = ({ children }: { children: ReactNode }) => <>{children}</>;
  const SelectGroup = ({ children }: { children: ReactNode }) => <>{children}</>;
  const SelectItem = ({
    children,
  }: {
    children: ReactNode;
    value: string;
  }) => <>{children}</>;

  return {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

describe('PublicLayout', () => {
  beforeEach(() => {
    setCityId.mockReset();
    saveBrowserLocation.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    cleanup();
  });

  it('shows active city coverage and allows changing the selected city', async () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('Contexto da compra')).toBeTruthy();
    expect(screen.getByText('Localizacao para otimizacao local')).toBeTruthy();
    expect(screen.getByText(/raio local padrao 5 km/i)).toBeTruthy();
    expect(screen.getByText(/modos locais usam essa localizacao salva/i)).toBeTruthy();
    expect(screen.queryByText('Sua compra continua de onde voce parou')).toBeNull();
    expect(screen.getAllByText(/0 estabelecimentos ativos/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole('combobox', { name: 'Escolha sua cidade' }), {
      target: { value: 'sao-paulo-sp' },
    });

    await waitFor(() => expect(setCityId).toHaveBeenCalledWith('sao-paulo-sp'));
  });

  it('keeps browser location as an explicit preview state', () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /usar localizacao/i }));

    expect(document.body.textContent).toMatch(/Permiss[aã]o:/);
    expect(document.body.textContent).toMatch(/indispon[ií]vel|manual|negada/);
  });

  it('saves explicit browser coordinates with the default local radius', async () => {
    saveBrowserLocation.mockResolvedValueOnce({
      id: 'location-1',
      regionId: 'region-1',
      regionSlug: 'campinas-sp',
      label: 'Local atual',
      latitude: -22.9,
      longitude: -47.06,
      coverageRadiusKm: 5,
      activeEstablishmentCount: 2,
      isDefault: true,
      locationSource: 'browser_geolocation',
      createdAt: '2026-05-13T12:00:00.000Z',
      updatedAt: '2026-05-13T12:00:00.000Z',
    });
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (
          success: (position: GeolocationPosition) => void,
        ) => {
          success({
            coords: {
              latitude: -22.9,
              longitude: -47.06,
              accuracy: 50,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as GeolocationPosition);
        },
      },
    });

    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /usar localizacao/i }));

    await waitFor(() =>
      expect(saveBrowserLocation).toHaveBeenCalledWith({
        latitude: -22.9,
        longitude: -47.06,
        coverageRadiusKm: 5,
      }),
    );
    await waitFor(() =>
      expect(document.body.textContent).toMatch(/capturada para preview/),
    );
  });
});
