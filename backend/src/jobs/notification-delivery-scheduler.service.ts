import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  NotificationDeliveryExecutorService,
  type NotificationDeliveryExecutionSummary,
} from '../notifications/notification-delivery-executor.service';

const DEFAULT_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 100;
const DEFAULT_POLL_INTERVAL_MS = 30_000;
const MIN_POLL_INTERVAL_MS = 1_000;

@Injectable()
export class NotificationDeliverySchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationDeliverySchedulerService.name);
  private interval: NodeJS.Timeout | null = null;
  private inFlight = false;
  private batchSize = DEFAULT_BATCH_SIZE;
  private pollIntervalMs = DEFAULT_POLL_INTERVAL_MS;

  constructor(
    private readonly deliveryExecutor: NotificationDeliveryExecutorService,
  ) {}

  onModuleInit() {
    const config = this.resolveConfig();

    if (config.disabledReason) {
      this.logger.log({
        event: 'notification_delivery_scheduler_skipped',
        reason: config.disabledReason,
      });
      return;
    }

    this.batchSize = config.batchSize;
    this.pollIntervalMs = config.pollIntervalMs;
    this.logger.log({
      event: 'notification_delivery_scheduler_started',
      batchSize: this.batchSize,
      pollIntervalMs: this.pollIntervalMs,
    });

    void this.runOnce('startup');
    this.interval = setInterval(
      () => void this.runOnce('interval'),
      this.pollIntervalMs,
    );
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async runOnce(
    trigger = 'manual',
  ): Promise<NotificationDeliveryExecutionSummary | null> {
    if (this.inFlight) {
      this.logger.warn({
        event: 'notification_delivery_scheduler_tick_skipped',
        reason: 'previous_tick_in_flight',
        trigger,
      });
      return null;
    }

    const startedAt = Date.now();
    this.inFlight = true;

    try {
      const summary = await this.deliveryExecutor.processDueAttempts({
        take: this.batchSize,
      });
      this.logger.log({
        event: 'notification_delivery_scheduler_tick_completed',
        trigger,
        batchSize: this.batchSize,
        durationMs: Date.now() - startedAt,
        ...summary,
      });
      return summary;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'notification_delivery_scheduler_failed';
      this.logger.error({
        event: 'notification_delivery_scheduler_tick_failed',
        trigger,
        batchSize: this.batchSize,
        durationMs: Date.now() - startedAt,
        message,
      });
      return null;
    } finally {
      this.inFlight = false;
    }
  }

  private resolveConfig() {
    if (process.env.JEST_WORKER_ID) {
      return {
        disabledReason: 'test_environment',
        batchSize: DEFAULT_BATCH_SIZE,
        pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      };
    }

    if (process.env.QUEUE_WORKERS_ENABLED === 'false') {
      return {
        disabledReason: 'queue_workers_disabled',
        batchSize: DEFAULT_BATCH_SIZE,
        pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      };
    }

    if (process.env.NOTIFICATION_DELIVERY_WORKER_ENABLED === 'false') {
      return {
        disabledReason: 'notification_delivery_worker_disabled',
        batchSize: DEFAULT_BATCH_SIZE,
        pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      };
    }

    return {
      disabledReason: null,
      batchSize: boundedNumber(
        process.env.NOTIFICATION_DELIVERY_BATCH_SIZE,
        DEFAULT_BATCH_SIZE,
        1,
        MAX_BATCH_SIZE,
      ),
      pollIntervalMs: boundedNumber(
        process.env.NOTIFICATION_DELIVERY_POLL_INTERVAL_MS,
        DEFAULT_POLL_INTERVAL_MS,
        MIN_POLL_INTERVAL_MS,
        Number.MAX_SAFE_INTEGER,
      ),
    };
  }
}

function boundedNumber(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
