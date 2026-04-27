// @vitest-environment jsdom

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicLayout } from './public-shell';

const setCityId = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    cityId: 'campinas-sp',
    setCityId,
    currentUser: null,
    isAuthenticated: false,
    signOut: vi.fn(),
    cities: [
      {
        id: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
        regionLabel: '0 estabelecimentos ativos',
        status: 'pilot',
        stores: [],
        neighborhoods: [],
      },
      {
        id: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        regionLabel: '2 estabelecimentos ativos',
        status: 'supported',
        stores: [],
        neighborhoods: [],
      },
    ],
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows active city coverage and allows changing the selected city', async () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/0 estabelecimentos ativos/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole('combobox', { name: 'Escolha sua cidade' }), {
      target: { value: 'sao-paulo-sp' },
    });

    await waitFor(() => expect(setCityId).toHaveBeenCalledWith('sao-paulo-sp'));
  });
});
