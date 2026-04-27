// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminOverviewPage, AdminQueuePage } from './dashboard-pages';

const fetchAdminMetrics = vi.fn();
const fetchAdminQueueHealth = vi.fn();
const fetchAdminProcessingJobs = vi.fn();
const fetchAdminRegions = vi.fn();
const fetchAdminEstablishments = vi.fn();
const updateAdminRegion = vi.fn();
const createAdminRegion = vi.fn();
const createAdminEstablishment = vi.fn();

vi.mock('@/app/pricely-context', () => ({
  usePricely: () => ({
    accessToken: 'token',
    currentUser: {
      id: 'admin-1',
      email: 'admin@pricely.local',
      displayName: 'Admin',
      role: 'admin',
    },
    lists: [],
  }),
}));

vi.mock('@/app/api', () => ({
  fetchAdminMetrics: (...args: unknown[]) => fetchAdminMetrics(...args),
  fetchAdminQueueHealth: (...args: unknown[]) => fetchAdminQueueHealth(...args),
  fetchAdminProcessingJobs: (...args: unknown[]) => fetchAdminProcessingJobs(...args),
  fetchAdminRegions: (...args: unknown[]) => fetchAdminRegions(...args),
  fetchAdminEstablishments: (...args: unknown[]) => fetchAdminEstablishments(...args),
  updateAdminRegion: (...args: unknown[]) => updateAdminRegion(...args),
  createAdminRegion: (...args: unknown[]) => createAdminRegion(...args),
  createAdminEstablishment: (...args: unknown[]) => createAdminEstablishment(...args),
  fetchAdminOffers: vi.fn(),
  fetchAdminProducts: vi.fn(),
  fetchAdminProductVariants: vi.fn(),
  createAdminOffer: vi.fn(),
  createAdminProduct: vi.fn(),
  createAdminProductVariant: vi.fn(),
  updateAdminOffer: vi.fn(),
  updateAdminProduct: vi.fn(),
  updateAdminProductVariant: vi.fn(),
}));

describe('Admin dashboard pages', () => {
  beforeEach(() => {
    fetchAdminMetrics.mockReset();
    fetchAdminQueueHealth.mockReset();
    fetchAdminProcessingJobs.mockReset();
    fetchAdminRegions.mockReset();
    fetchAdminEstablishments.mockReset();
    updateAdminRegion.mockReset();
    createAdminRegion.mockReset();
    createAdminEstablishment.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders queue health when overview data loads successfully', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 2,
      shoppingListsCount: 3,
      optimizationRunsCount: 4,
      activeRegions: 1,
      activeEstablishments: 5,
      activeOffers: 6,
      productCount: 7,
      queuedJobs: 1,
    });
    fetchAdminQueueHealth.mockResolvedValue({
      queuedJobs: 1,
      runningJobs: 0,
      failedJobs: 0,
      completedJobs: 2,
      jobsByStatus: { queued: 1, completed: 2 },
      queues: ['optimization'],
      recentFailures: [],
    });

    render(<AdminOverviewPage />);

    expect(await screen.findByText('Saude das filas')).toBeTruthy();
    expect(screen.getByText('Em fila')).toBeTruthy();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('shows an empty-state message when all overview metrics are zero', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 0,
      shoppingListsCount: 0,
      optimizationRunsCount: 0,
      activeRegions: 0,
      activeEstablishments: 0,
      activeOffers: 0,
      productCount: 0,
      queuedJobs: 0,
    });
    fetchAdminQueueHealth.mockResolvedValue({
      queuedJobs: 0,
      runningJobs: 0,
      failedJobs: 0,
      completedJobs: 0,
      jobsByStatus: {},
      queues: [],
      recentFailures: [],
    });

    render(<AdminOverviewPage />);

    expect(await screen.findByText('Nenhuma metrica operacional ainda')).toBeTruthy();
  });

  it('shows a validation error when region creation fails', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 2,
      shoppingListsCount: 3,
      optimizationRunsCount: 4,
      activeRegions: 1,
      activeEstablishments: 5,
      activeOffers: 6,
      productCount: 7,
      queuedJobs: 1,
    });
    fetchAdminQueueHealth.mockResolvedValue({
      queuedJobs: 1,
      runningJobs: 0,
      failedJobs: 0,
      completedJobs: 2,
      jobsByStatus: { queued: 1, completed: 2 },
      queues: ['optimization'],
      recentFailures: [],
    });
    fetchAdminProcessingJobs.mockResolvedValue([]);
    fetchAdminRegions.mockResolvedValue([]);
    fetchAdminEstablishments.mockResolvedValue([]);
    createAdminRegion.mockRejectedValue(new Error('Slug ja existe.'));

    render(<AdminQueuePage />);

    fireEvent.change(screen.getByPlaceholderText('slug'), {
      target: { value: 'sao-paulo-sp' },
    });
    fireEvent.change(screen.getByPlaceholderText('nome'), {
      target: { value: 'Sao Paulo' },
    });
    fireEvent.change(screen.getByPlaceholderText('UF'), {
      target: { value: 'SP' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar regiao' }));

    await waitFor(() =>
      expect(screen.getByText('Slug ja existe.')).toBeTruthy(),
    );
  });

  it('allows toggling a region activation state from the queue page', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 2,
      shoppingListsCount: 3,
      optimizationRunsCount: 4,
      activeRegions: 1,
      activeEstablishments: 5,
      activeOffers: 6,
      productCount: 7,
      queuedJobs: 1,
    });
    fetchAdminQueueHealth.mockResolvedValue({
      queuedJobs: 1,
      runningJobs: 0,
      failedJobs: 0,
      completedJobs: 2,
      jobsByStatus: { queued: 1, completed: 2 },
      queues: ['optimization'],
      recentFailures: [],
    });
    fetchAdminProcessingJobs.mockResolvedValue([]);
    fetchAdminRegions
      .mockResolvedValueOnce([
        {
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
          implantationStatus: 'active',
          publicSortOrder: 1,
          establishmentsCount: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
          implantationStatus: 'inactive',
          publicSortOrder: 1,
          establishmentsCount: 1,
        },
      ]);
    fetchAdminEstablishments.mockResolvedValue([]);
    updateAdminRegion.mockResolvedValue({});

    render(<AdminQueuePage />);

    const toggleButton = await screen.findByRole('button', { name: 'Desativar regiao' });
    fireEvent.click(toggleButton);

    await waitFor(() =>
      expect(updateAdminRegion).toHaveBeenCalledWith('token', 'region-1', {
        implantationStatus: 'inactive',
      }),
    );
  });
});
