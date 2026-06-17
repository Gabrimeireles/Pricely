// @vitest-environment jsdom

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicLayout } from './public-shell';

const setCityId = vi.fn();
const saveBrowserLocation = vi.fn();
const savePostalCodeLocation = vi.fn();
const previewLocationCoverage = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    cityId: 'campinas-sp',
    setCityId,
    currentUser: null,
    isAuthenticated: false,
    signOut: vi.fn(),
    locationPreferences: [],
    previewLocationCoverage,
    saveBrowserLocation,
    savePostalCodeLocation,
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
  const collectItems = (
    children: unknown,
  ): Array<{ value: string; label: string }> => {
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

  const SelectTrigger = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  const SelectValue = ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  );
  const SelectContent = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  const SelectGroup = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  const SelectItem = ({ children }: { children: ReactNode; value: string }) => (
    <>{children}</>
  );

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
    savePostalCodeLocation.mockReset();
    previewLocationCoverage.mockReset();
    previewLocationCoverage.mockResolvedValue({
      regionId: 'campinas-sp',
      coverageRadiusKm: 5,
      activeEstablishmentCount: 2,
      fallbackUsed: false,
      establishments: [],
    });
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

    expect(screen.getByText('Localização manual')).toBeTruthy();
    expect(screen.getByText(/raio de 5 km/i)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /configurar localização/i }),
    ).toBeTruthy();
    expect(
      screen.queryByText('Sua compra continua de onde voce parou'),
    ).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Escolha sua cidade' }))
      .toBeTruthy();

    fireEvent.change(
      screen.getByRole('combobox', { name: 'Escolha sua cidade' }),
      {
        target: { value: 'sao-paulo-sp' },
      },
    );

    await waitFor(() => expect(setCityId).toHaveBeenCalledWith('sao-paulo-sp'));
  });

  it('keeps browser location as an explicit preview state', () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /configurar localização/i }),
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

    fireEvent.click(
      screen.getByRole('button', { name: /configurar localização/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: /usar localizacao/i }));

    await waitFor(() =>
      expect(previewLocationCoverage).toHaveBeenCalledWith({
        latitude: -22.9,
        longitude: -47.06,
        coverageRadiusKm: 5,
      }),
    );
    await waitFor(() =>
      expect(saveBrowserLocation).toHaveBeenCalledWith({
        latitude: -22.9,
        longitude: -47.06,
        coverageRadiusKm: 5,
      }),
    );
    expect(document.body.textContent).toMatch(/Preview local: 2 lojas/i);
    await waitFor(() =>
      expect(document.body.textContent).toMatch(/capturada para preview/),
    );
  });

  it('saves a postal code fallback without claiming distance', async () => {
    savePostalCodeLocation.mockResolvedValueOnce({
      id: 'location-cep',
      regionId: 'region-1',
      regionSlug: 'campinas-sp',
      label: 'CEP 13010000',
      latitude: null,
      longitude: null,
      postalCode: '13010000',
      coverageRadiusKm: 5,
      activeEstablishmentCount: 0,
      isDefault: true,
      locationSource: 'postal_code_fallback',
      createdAt: '2026-05-13T12:00:00.000Z',
      updatedAt: '2026-05-13T12:00:00.000Z',
    });

    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /configurar localização/i }),
    );
    fireEvent.change(screen.getByLabelText('CEP para fallback manual'), {
      target: { value: '13010-000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar cep/i }));

    await waitFor(() =>
      expect(previewLocationCoverage).toHaveBeenCalledWith({
        postalCode: '13010000',
        coverageRadiusKm: 5,
      }),
    );
    await waitFor(() =>
      expect(savePostalCodeLocation).toHaveBeenCalledWith({
        postalCode: '13010000',
        coverageRadiusKm: 5,
      }),
    );
    expect(document.body.textContent).toMatch(/n[aã]o prometem proximidade/i);
    expect(document.body.textContent).toMatch(/Preview por CEP: 2 lojas/i);
    await waitFor(() =>
      expect(document.body.textContent).toMatch(/CEP salvo como fallback/i),
    );
  });
});
