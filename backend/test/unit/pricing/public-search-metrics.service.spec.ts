import { PublicSearchMetricsService } from '../../../src/pricing/application/public-search-metrics.service';

describe('PublicSearchMetricsService', () => {
  const envKeys = [
    'PUBLIC_SEARCH_METRICS_WINDOW_SIZE',
    'PUBLIC_SEARCH_P95_TARGET_MS',
    'PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES',
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

  it('calculates sliding-window percentiles and strategy rates', () => {
    process.env.PUBLIC_SEARCH_METRICS_WINDOW_SIZE = '4';
    process.env.PUBLIC_SEARCH_P95_TARGET_MS = '750';
    process.env.PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES = '3';
    const service = new PublicSearchMetricsService();

    service.record({
      durationMs: 100,
      strategy: 'candidate',
      resultCount: 2,
    });
    service.record({
      durationMs: 200,
      strategy: 'candidate',
      resultCount: 3,
    });
    service.record({
      durationMs: 900,
      strategy: 'broad-fallback',
      resultCount: 20,
    });

    expect(service.getSnapshot()).toEqual(
      expect.objectContaining({
        windowSize: 4,
        sampleCount: 3,
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
      }),
    );
  });

  it('does not recommend pg_trgm before the minimum sample count', () => {
    process.env.PUBLIC_SEARCH_P95_TARGET_MS = '100';
    process.env.PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES = '2';
    const service = new PublicSearchMetricsService();

    service.record({
      durationMs: 500,
      strategy: 'candidate',
      resultCount: 1,
    });

    expect(service.getSnapshot().pgTrgmEvaluation).toEqual({
      minimumSamples: 2,
      recommended: false,
      reason: 'insufficient_samples',
    });
  });
});
