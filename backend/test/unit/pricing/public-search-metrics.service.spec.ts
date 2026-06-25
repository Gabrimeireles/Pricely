import { PublicSearchMetricsService } from '../../../src/pricing/application/public-search-metrics.service';

describe('PublicSearchMetricsService', () => {
  const envKeys = [
    'PUBLIC_SEARCH_METRICS_WINDOW_SIZE',
    'PUBLIC_SEARCH_P95_TARGET_MS',
    'PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES',
    'PUBLIC_SEARCH_METRICS_RETENTION_DAYS',
    'PUBLIC_SEARCH_ALERT_COOLDOWN_MINUTES',
  ] as const;
  const originalEnv = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );

  afterEach(() => {
    for (const key of envKeys) {
      const originalValue = originalEnv[key];
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  });

  it('calculates persisted percentiles, volume, timeline and strategy rates', async () => {
    process.env.PUBLIC_SEARCH_METRICS_WINDOW_SIZE = '4';
    process.env.PUBLIC_SEARCH_P95_TARGET_MS = '750';
    process.env.PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES = '3';
    const now = new Date();
    const samples = [
      {
        durationMs: 900,
        strategy: 'broad_fallback',
        resultCount: 20,
        createdAt: new Date(now.getTime() - 1_000),
      },
      {
        durationMs: 200,
        strategy: 'candidate',
        resultCount: 3,
        createdAt: new Date(now.getTime() - 2_000),
      },
      {
        durationMs: 100,
        strategy: 'candidate',
        resultCount: 2,
        createdAt: new Date(now.getTime() - 3_000),
      },
    ];
    const prisma = {
      publicSearchMetric: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(samples)
          .mockResolvedValueOnce([...samples].reverse()),
        count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(3),
      },
      publicSearchSloAlert: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new PublicSearchMetricsService(prisma as never);

    const snapshot = await service.getSnapshot();

    expect(snapshot).toEqual(
      expect.objectContaining({
        windowSize: 4,
        retentionDays: 30,
        sampleCount: 3,
        volume: {
          last24Hours: 3,
          last7Days: 3,
        },
        p50Ms: 200,
        p95Ms: 900,
        maxMs: 900,
        strategyCounts: {
          candidate: 2,
          broadFallback: 1,
        },
        fallbackRate: 0.3333,
        pgTrgmEvaluation: {
          minimumSamples: 3,
          recommended: true,
          reason: 'p95_above_target',
        },
        alert: expect.objectContaining({
          status: 'healthy',
        }),
      }),
    );
    expect(snapshot.timeline).toHaveLength(12);
    expect(snapshot.timeline.at(-1)).toEqual(
      expect.objectContaining({
        sampleCount: 3,
        p95Ms: 900,
      }),
    );
  });

  it('persists samples, prunes retention and opens an SLO alert', async () => {
    process.env.PUBLIC_SEARCH_P95_TARGET_MS = '100';
    process.env.PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES = '2';
    const now = new Date();
    const samples = [
      {
        durationMs: 500,
        strategy: 'candidate',
        resultCount: 1,
        createdAt: now,
      },
      {
        durationMs: 400,
        strategy: 'candidate',
        resultCount: 1,
        createdAt: new Date(now.getTime() - 1_000),
      },
    ];
    const prisma = {
      publicSearchMetric: {
        create: jest.fn().mockResolvedValue({ id: 'metric-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest
          .fn()
          .mockImplementation(({ take }: { take: number }) =>
            Promise.resolve(take === 5_000 ? [...samples].reverse() : samples),
          ),
        count: jest.fn().mockResolvedValue(2),
      },
      publicSearchSloAlert: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'alert-1' }),
        update: jest.fn(),
      },
    };
    const service = new PublicSearchMetricsService(prisma as never);

    await service.record({
      durationMs: 500,
      strategy: 'candidate',
      resultCount: 1,
      regionSlug: 'sao-paulo-sp',
      candidateCounts: {
        offers: 1,
        products: 1,
        variants: 1,
        establishments: 0,
      },
    });

    expect(prisma.publicSearchMetric.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        regionSlug: 'sao-paulo-sp',
        strategy: 'candidate',
        durationMs: 500,
      }),
    });
    expect(prisma.publicSearchMetric.deleteMany).toHaveBeenCalled();
    expect(prisma.publicSearchSloAlert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sampleCount: 2,
        observedP95Ms: 500,
        targetP95Ms: 100,
        reason: 'p95_above_target',
      }),
    });
  });

  it('resolves an active alert after the rolling p95 recovers', async () => {
    process.env.PUBLIC_SEARCH_P95_TARGET_MS = '750';
    process.env.PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES = '2';
    const now = new Date();
    const activeAlert = {
      id: 'alert-1',
      status: 'active',
      sampleCount: 2,
      observedP95Ms: 900,
      targetP95Ms: 750,
      triggeredAt: new Date(now.getTime() - 60_000),
      lastNotifiedAt: new Date(now.getTime() - 60_000),
    };
    const samples = [
      {
        durationMs: 200,
        strategy: 'candidate',
        resultCount: 1,
        createdAt: now,
      },
      {
        durationMs: 100,
        strategy: 'candidate',
        resultCount: 1,
        createdAt: new Date(now.getTime() - 1_000),
      },
    ];
    const prisma = {
      publicSearchMetric: {
        create: jest.fn().mockResolvedValue({ id: 'metric-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest
          .fn()
          .mockImplementation(({ take }: { take: number }) =>
            Promise.resolve(take === 5_000 ? [...samples].reverse() : samples),
          ),
        count: jest.fn().mockResolvedValue(2),
      },
      publicSearchSloAlert: {
        findFirst: jest.fn().mockResolvedValue(activeAlert),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({
          ...activeAlert,
          status: 'resolved',
        }),
      },
    };
    const service = new PublicSearchMetricsService(prisma as never);

    await service.record({
      durationMs: 200,
      strategy: 'candidate',
      resultCount: 1,
      regionSlug: 'sao-paulo-sp',
      candidateCounts: {
        offers: 1,
        products: 0,
        variants: 0,
        establishments: 0,
      },
    });

    expect(prisma.publicSearchSloAlert.update).toHaveBeenCalledWith({
      where: { id: 'alert-1' },
      data: {
        status: 'resolved',
        resolvedAt: expect.any(Date),
      },
    });
  });
});
