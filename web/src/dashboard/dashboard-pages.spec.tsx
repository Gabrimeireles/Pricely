// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminEstablishmentsPage, AdminOverviewPage, AdminQueuePage, AdminRegionsPage } from './dashboard-pages';

const fetchAdminMetrics = vi.fn();
const fetchAdminQueueHealth = vi.fn();
const fetchAdminProcessingJobs = vi.fn();
const fetchAdminRegions = vi.fn();
const fetchAdminEstablishments = vi.fn();

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
  fetchAdminShoppingLists: vi.fn(),
  updateAdminRegion: vi.fn(),
  createAdminRegion: vi.fn(),
  createAdminEstablishment: vi.fn(),
  updateAdminEstablishment: vi.fn(),
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
      globalEstimatedSavings: 35.2,
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
    expect(screen.getByText('Cobertura da operacao')).toBeTruthy();
    expect(screen.getByText('Sinais do dia')).toBeTruthy();
    expect(screen.getByText('Painel comparativo')).toBeTruthy();
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
      globalEstimatedSavings: 0,
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

    expect(await screen.findByText(/Nenhuma metrica operacional ainda/)).toBeTruthy();
  });

  it('renders queue diagnostics and recent jobs in the dedicated queue page', async () => {
    fetchAdminMetrics.mockResolvedValue({
      activeUsers: 2,
      shoppingListsCount: 3,
      optimizationRunsCount: 4,
      activeRegions: 1,
      activeEstablishments: 5,
      activeOffers: 6,
      productCount: 7,
      queuedJobs: 1,
      globalEstimatedSavings: 35.2,
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
    fetchAdminProcessingJobs.mockResolvedValue([
      {
        id: 'job-1',
        queueName: 'optimization',
        resourceType: 'shopping_list',
        resourceId: 'list-1',
        status: 'completed',
        attemptCount: 1,
        failureReason: null,
      },
    ]);

    render(<AdminQueuePage />);

    expect(await screen.findByText('Saude da fila')).toBeTruthy();
    expect(screen.getByText('Jobs recentes')).toBeTruthy();
    expect(screen.getByText(/shopping_list/)).toBeTruthy();
  });

  it('renders dedicated regions and establishments views', async () => {
    fetchAdminRegions.mockResolvedValue([
      {
        id: 'region-1',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        implantationStatus: 'active',
        publicSortOrder: 1,
        activeEstablishmentsCount: 2,
        establishments: [
          {
            id: 'store-1',
            brandName: 'Mercado Azul',
            unitName: 'Unidade Pinheiros',
            neighborhood: 'Pinheiros',
            cityName: 'Sao Paulo',
            isActive: true,
            auditedProductsCount: 12,
          },
        ],
      },
    ]);
    fetchAdminEstablishments.mockResolvedValue([
      {
        id: 'store-1',
        brandName: 'Mercado Azul',
        unitName: 'Unidade Pinheiros',
        cnpj: '00.000.000/0001-00',
        cityName: 'Sao Paulo',
        neighborhood: 'Pinheiros',
        regionId: 'region-1',
        isActive: true,
        region: {
          id: 'region-1',
          slug: 'sao-paulo-sp',
          name: 'Sao Paulo',
          stateCode: 'SP',
        },
      },
    ]);

    render(<AdminRegionsPage />);
    expect(await screen.findByText('Cidades públicas')).toBeTruthy();
    expect(screen.getAllByText(/Sao Paulo/).length).toBeGreaterThan(0);
    expect(screen.getByText('12 produtos auditados')).toBeTruthy();

    render(<AdminEstablishmentsPage />);
    expect(await screen.findByText('Unidades por cidade')).toBeTruthy();
    expect(screen.getAllByText('Unidade Pinheiros').length).toBeGreaterThan(0);
  });
});
