import { Injectable } from '@nestjs/common';

export type PublicSearchStrategy = 'candidate' | 'broad-fallback';

type SearchSample = {
  durationMs: number;
  strategy: PublicSearchStrategy;
  resultCount: number;
  recordedAt: string;
};

@Injectable()
export class PublicSearchMetricsService {
  private readonly samples: SearchSample[] = [];
  private readonly windowSize = this.readPositiveInteger(
    process.env.PUBLIC_SEARCH_METRICS_WINDOW_SIZE,
    500,
  );
  private readonly p95TargetMs = this.readPositiveInteger(
    process.env.PUBLIC_SEARCH_P95_TARGET_MS,
    750,
  );
  private readonly pgTrgmMinimumSamples = this.readPositiveInteger(
    process.env.PUBLIC_SEARCH_PG_TRGM_MIN_SAMPLES,
    100,
  );

  record(sample: Omit<SearchSample, 'recordedAt'>) {
    this.samples.push({
      ...sample,
      durationMs: Math.round(sample.durationMs * 100) / 100,
      recordedAt: new Date().toISOString(),
    });

    if (this.samples.length > this.windowSize) {
      this.samples.splice(0, this.samples.length - this.windowSize);
    }

    return this.getSnapshot();
  }

  getSnapshot() {
    const durations = this.samples
      .map((sample) => sample.durationMs)
      .sort((left, right) => left - right);
    const candidateCount = this.samples.filter(
      (sample) => sample.strategy === 'candidate',
    ).length;
    const broadFallbackCount = this.samples.length - candidateCount;
    const p50Ms = this.percentile(durations, 0.5);
    const p95Ms = this.percentile(durations, 0.95);
    const fallbackRate =
      this.samples.length > 0 ? broadFallbackCount / this.samples.length : 0;
    const shouldEvaluatePgTrgm =
      this.samples.length >= this.pgTrgmMinimumSamples &&
      p95Ms !== null &&
      p95Ms > this.p95TargetMs;

    return {
      windowSize: this.windowSize,
      sampleCount: this.samples.length,
      p50Ms,
      p95Ms,
      maxMs: durations.at(-1) ?? null,
      p95TargetMs: this.p95TargetMs,
      strategyCounts: {
        candidate: candidateCount,
        broadFallback: broadFallbackCount,
      },
      fallbackRate: Math.round(fallbackRate * 10_000) / 10_000,
      pgTrgmEvaluation: {
        minimumSamples: this.pgTrgmMinimumSamples,
        recommended: shouldEvaluatePgTrgm,
        reason: shouldEvaluatePgTrgm
          ? 'p95_above_target'
          : this.samples.length < this.pgTrgmMinimumSamples
            ? 'insufficient_samples'
            : 'p95_within_target',
      },
      lastRecordedAt: this.samples.at(-1)?.recordedAt ?? null,
    };
  }

  private percentile(values: number[], percentile: number) {
    if (values.length === 0) {
      return null;
    }

    const index = Math.ceil(values.length * percentile) - 1;
    return values[Math.max(0, index)];
  }

  private readPositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
