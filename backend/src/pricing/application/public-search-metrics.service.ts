import { Injectable, Logger, Optional } from '@nestjs/common';
import type { PublicSearchStrategy as PrismaPublicSearchStrategy } from '@prisma/client';

import { IncidentNotifierService } from '../../common/logging/incident-notifier.service';
import { PrismaService } from '../../persistence/prisma.service';

export type PublicSearchStrategy = 'candidate' | 'broad-fallback';

type SearchSampleInput = {
  durationMs: number;
  strategy: PublicSearchStrategy;
  resultCount: number;
  regionSlug: string;
  candidateCounts: {
    offers: number;
    products: number;
    variants: number;
    establishments: number;
  };
};

type PersistedSearchSample = {
  durationMs: unknown;
  strategy: PrismaPublicSearchStrategy;
  resultCount: number;
  createdAt: Date;
};

type NormalizedSearchSample = {
  durationMs: number;
  strategy: PublicSearchStrategy;
  resultCount: number;
  createdAt: Date;
};

@Injectable()
export class PublicSearchMetricsService {
  private readonly logger = new Logger(PublicSearchMetricsService.name);
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
  private readonly retentionDays = this.readPositiveInteger(
    process.env.PUBLIC_SEARCH_METRICS_RETENTION_DAYS,
    30,
  );
  private readonly alertCooldownMinutes = this.readPositiveInteger(
    process.env.PUBLIC_SEARCH_ALERT_COOLDOWN_MINUTES,
    60,
  );
  private lastRetentionCleanupAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly incidentNotifier?: IncidentNotifierService,
  ) {}

  async record(sample: SearchSampleInput) {
    await this.prisma.publicSearchMetric.create({
      data: {
        regionSlug: sample.regionSlug,
        strategy: this.toPrismaStrategy(sample.strategy),
        durationMs: Math.round(sample.durationMs * 100) / 100,
        resultCount: sample.resultCount,
        candidateOfferCount: sample.candidateCounts.offers,
        candidateProductCount: sample.candidateCounts.products,
        candidateVariantCount: sample.candidateCounts.variants,
        candidateEstablishmentCount: sample.candidateCounts.establishments,
      },
    });

    await this.cleanupExpiredSamples();
    const snapshot = await this.getSnapshot();
    await this.evaluateAlert(snapshot);
    return snapshot;
  }

  async getSnapshot() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [samples, lastDaySamples, lastDayCount, lastWeekCount, activeAlert] =
      await Promise.all([
        this.prisma.publicSearchMetric.findMany({
          orderBy: { createdAt: 'desc' },
          take: this.windowSize,
          select: {
            durationMs: true,
            strategy: true,
            resultCount: true,
            createdAt: true,
          },
        }),
        this.prisma.publicSearchMetric.findMany({
          where: { createdAt: { gte: dayAgo } },
          orderBy: { createdAt: 'asc' },
          take: 5_000,
          select: {
            durationMs: true,
            strategy: true,
            resultCount: true,
            createdAt: true,
          },
        }),
        this.prisma.publicSearchMetric.count({
          where: { createdAt: { gte: dayAgo } },
        }),
        this.prisma.publicSearchMetric.count({
          where: { createdAt: { gte: weekAgo } },
        }),
        this.prisma.publicSearchSloAlert.findFirst({
          where: { status: 'active' },
          orderBy: { triggeredAt: 'desc' },
        }),
      ]);

    const normalizedSamples = samples.map((sample) =>
      this.normalizeSample(sample),
    );
    const durations = normalizedSamples
      .map((sample) => sample.durationMs)
      .sort((left, right) => left - right);
    const candidateCount = normalizedSamples.filter(
      (sample) => sample.strategy === 'candidate',
    ).length;
    const broadFallbackCount = normalizedSamples.length - candidateCount;
    const p50Ms = this.percentile(durations, 0.5);
    const p95Ms = this.percentile(durations, 0.95);
    const fallbackRate =
      normalizedSamples.length > 0
        ? broadFallbackCount / normalizedSamples.length
        : 0;
    const shouldEvaluatePgTrgm =
      normalizedSamples.length >= this.pgTrgmMinimumSamples &&
      p95Ms !== null &&
      p95Ms > this.p95TargetMs;

    return {
      windowSize: this.windowSize,
      retentionDays: this.retentionDays,
      sampleCount: normalizedSamples.length,
      volume: {
        last24Hours: lastDayCount,
        last7Days: lastWeekCount,
      },
      p50Ms,
      p95Ms,
      maxMs: durations.at(-1) ?? null,
      p95TargetMs: this.p95TargetMs,
      strategyCounts: {
        candidate: candidateCount,
        broadFallback: broadFallbackCount,
      },
      fallbackRate: Math.round(fallbackRate * 10_000) / 10_000,
      timeline: this.buildTimeline(
        lastDaySamples.map((sample) => this.normalizeSample(sample)),
        now,
      ),
      pgTrgmEvaluation: {
        minimumSamples: this.pgTrgmMinimumSamples,
        recommended: shouldEvaluatePgTrgm,
        reason: shouldEvaluatePgTrgm
          ? 'p95_above_target'
          : normalizedSamples.length < this.pgTrgmMinimumSamples
            ? 'insufficient_samples'
            : 'p95_within_target',
      },
      alert: activeAlert
        ? {
            status: activeAlert.status,
            observedP95Ms: Number(activeAlert.observedP95Ms),
            targetP95Ms: activeAlert.targetP95Ms,
            sampleCount: activeAlert.sampleCount,
            triggeredAt: activeAlert.triggeredAt.toISOString(),
            lastNotifiedAt: activeAlert.lastNotifiedAt.toISOString(),
          }
        : {
            status: 'healthy',
            observedP95Ms: p95Ms,
            targetP95Ms: this.p95TargetMs,
            sampleCount: normalizedSamples.length,
            triggeredAt: null,
            lastNotifiedAt: null,
          },
      lastRecordedAt: normalizedSamples[0]?.createdAt.toISOString() ?? null,
    };
  }

  private async evaluateAlert(
    snapshot: Awaited<ReturnType<PublicSearchMetricsService['getSnapshot']>>,
  ) {
    const shouldAlert = snapshot.pgTrgmEvaluation.recommended;

    if (!shouldAlert && snapshot.alert.status !== 'active') {
      return;
    }

    if (!shouldAlert) {
      const activeAlert = await this.findActiveAlert();
      if (!activeAlert) {
        return;
      }
      await this.prisma.publicSearchSloAlert.update({
        where: { id: activeAlert.id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      });
      this.logger.log({
        event: 'public_search_slo_recovered',
        observedP95Ms: snapshot.p95Ms,
        targetP95Ms: snapshot.p95TargetMs,
        sampleCount: snapshot.sampleCount,
      });
      await this.deliverIncident({
        event: 'public_search_slo_recovered',
        severity: 'resolved',
        summary: 'Public search latency recovered below the configured SLO.',
        details: {
          observedP95Ms: snapshot.p95Ms,
          targetP95Ms: snapshot.p95TargetMs,
          sampleCount: snapshot.sampleCount,
          fallbackRate: snapshot.fallbackRate,
        },
      });
      return;
    }

    if (!shouldAlert || snapshot.p95Ms === null) {
      return;
    }

    if (snapshot.alert.status !== 'active') {
      await this.prisma.publicSearchSloAlert.create({
        data: {
          sampleCount: snapshot.sampleCount,
          observedP95Ms: snapshot.p95Ms,
          targetP95Ms: snapshot.p95TargetMs,
          reason: 'p95_above_target',
        },
      });
      this.logAlert(snapshot);
      await this.deliverSearchAlert(snapshot);
      return;
    }

    const activeAlert = await this.findActiveAlert();
    if (!activeAlert) {
      return;
    }
    const cooldownMs = this.alertCooldownMinutes * 60 * 1000;
    if (Date.now() - activeAlert.lastNotifiedAt.getTime() >= cooldownMs) {
      await this.prisma.publicSearchSloAlert.update({
        where: { id: activeAlert.id },
        data: {
          sampleCount: snapshot.sampleCount,
          observedP95Ms: snapshot.p95Ms,
          lastNotifiedAt: new Date(),
        },
      });
      this.logAlert(snapshot);
      await this.deliverSearchAlert(snapshot);
    }
  }

  private findActiveAlert() {
    return this.prisma.publicSearchSloAlert.findFirst({
      where: { status: 'active' },
      orderBy: { triggeredAt: 'desc' },
    });
  }

  private logAlert(
    snapshot: Awaited<ReturnType<PublicSearchMetricsService['getSnapshot']>>,
  ) {
    this.logger.warn({
      event: 'public_search_slo_alert',
      observedP95Ms: snapshot.p95Ms,
      targetP95Ms: snapshot.p95TargetMs,
      sampleCount: snapshot.sampleCount,
      fallbackRate: snapshot.fallbackRate,
      action: 'reevaluate_pg_trgm_benchmark',
    });
  }

  private deliverSearchAlert(
    snapshot: Awaited<ReturnType<PublicSearchMetricsService['getSnapshot']>>,
  ) {
    return this.deliverIncident({
      event: 'public_search_slo_alert',
      severity: 'critical',
      summary: 'Public search p95 exceeded the configured latency SLO.',
      details: {
        observedP95Ms: snapshot.p95Ms,
        targetP95Ms: snapshot.p95TargetMs,
        sampleCount: snapshot.sampleCount,
        fallbackRate: snapshot.fallbackRate,
        recommendedAction: 'reevaluate_pg_trgm_benchmark',
      },
    });
  }

  private async deliverIncident(
    notification: Parameters<IncidentNotifierService['notify']>[0],
  ) {
    if (!this.incidentNotifier) {
      return;
    }

    try {
      await this.incidentNotifier.notify(notification);
    } catch (error) {
      this.logger.error({
        event: 'incident_notification_failed',
        incidentEvent: notification.event,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async cleanupExpiredSamples() {
    const cleanupIntervalMs = 60 * 60 * 1000;
    if (Date.now() - this.lastRetentionCleanupAt < cleanupIntervalMs) {
      return;
    }

    this.lastRetentionCleanupAt = Date.now();
    await this.prisma.publicSearchMetric.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000),
        },
      },
    });
  }

  private buildTimeline(samples: NormalizedSearchSample[], now: Date) {
    const bucketDurationMs = 2 * 60 * 60 * 1000;
    return Array.from({ length: 12 }, (_, index) => {
      const startsAt = new Date(
        now.getTime() - (12 - index) * bucketDurationMs,
      );
      const endsAt = new Date(startsAt.getTime() + bucketDurationMs);
      const bucketSamples = samples.filter(
        (sample) =>
          sample.createdAt >= startsAt &&
          (sample.createdAt < endsAt ||
            (index === 11 && sample.createdAt <= now)),
      );
      const durations = bucketSamples
        .map((sample) => sample.durationMs)
        .sort((left, right) => left - right);

      return {
        startsAt: startsAt.toISOString(),
        sampleCount: bucketSamples.length,
        p95Ms: this.percentile(durations, 0.95),
      };
    });
  }

  private normalizeSample(sample: PersistedSearchSample) {
    return {
      durationMs: Number(sample.durationMs),
      strategy:
        sample.strategy === 'broad_fallback'
          ? ('broad-fallback' as const)
          : ('candidate' as const),
      resultCount: sample.resultCount,
      createdAt: sample.createdAt,
    };
  }

  private toPrismaStrategy(
    strategy: PublicSearchStrategy,
  ): PrismaPublicSearchStrategy {
    return strategy === 'broad-fallback' ? 'broad_fallback' : 'candidate';
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
