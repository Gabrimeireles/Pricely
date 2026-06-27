import { Logger } from '@nestjs/common';

import { NotificationDeliverySchedulerService } from '../../../src/jobs/notification-delivery-scheduler.service';

describe('NotificationDeliverySchedulerService', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    delete process.env.JEST_WORKER_ID;
    delete process.env.QUEUE_WORKERS_ENABLED;
    delete process.env.NOTIFICATION_DELIVERY_WORKER_ENABLED;
    delete process.env.NOTIFICATION_DELIVERY_BATCH_SIZE;
    delete process.env.NOTIFICATION_DELIVERY_POLL_INTERVAL_MS;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('skips bootstrap when delivery workers are disabled', () => {
    process.env.NOTIFICATION_DELIVERY_WORKER_ENABLED = 'false';
    const executor = {
      processDueAttempts: jest.fn(),
    };
    const service = new NotificationDeliverySchedulerService(
      executor as never,
    );

    service.onModuleInit();

    expect(executor.processDueAttempts).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith({
      event: 'notification_delivery_scheduler_skipped',
      reason: 'notification_delivery_worker_disabled',
    });
  });

  it('processes startup and interval ticks with bounded batch size', async () => {
    process.env.NOTIFICATION_DELIVERY_BATCH_SIZE = '250';
    process.env.NOTIFICATION_DELIVERY_POLL_INTERVAL_MS = '500';
    const executor = {
      processDueAttempts: jest.fn().mockResolvedValue({
        processed: 1,
        delivered: 1,
        retrying: 0,
        failed: 0,
        skipped: 0,
      }),
    };
    const service = new NotificationDeliverySchedulerService(
      executor as never,
    );

    service.onModuleInit();
    await Promise.resolve();

    expect(executor.processDueAttempts).toHaveBeenCalledWith({ take: 100 });
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'notification_delivery_scheduler_started',
        batchSize: 100,
        pollIntervalMs: 1000,
      }),
    );

    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(executor.processDueAttempts).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'notification_delivery_scheduler_tick_completed',
        trigger: 'interval',
        batchSize: 100,
        processed: 1,
        delivered: 1,
      }),
    );

    service.onModuleDestroy();
  });

  it('does not overlap ticks when the previous batch is still running', async () => {
    let releaseBatch: () => void = () => undefined;
    const pendingBatch = new Promise((resolve) => {
      releaseBatch = () =>
        resolve({
          processed: 0,
          delivered: 0,
          retrying: 0,
          failed: 0,
          skipped: 0,
        });
    });
    const executor = {
      processDueAttempts: jest.fn().mockReturnValue(pendingBatch),
    };
    const service = new NotificationDeliverySchedulerService(
      executor as never,
    );

    const firstRun = service.runOnce('manual');
    await Promise.resolve();
    await expect(service.runOnce('manual')).resolves.toBeNull();

    expect(executor.processDueAttempts).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith({
      event: 'notification_delivery_scheduler_tick_skipped',
      reason: 'previous_tick_in_flight',
      trigger: 'manual',
    });

    releaseBatch();
    await firstRun;
  });

  it('logs failed ticks without throwing to the interval loop', async () => {
    const executor = {
      processDueAttempts: jest.fn().mockRejectedValue(new Error('provider down')),
    };
    const service = new NotificationDeliverySchedulerService(
      executor as never,
    );

    await expect(service.runOnce('manual')).resolves.toBeNull();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'notification_delivery_scheduler_tick_failed',
        trigger: 'manual',
        message: 'provider down',
      }),
    );
  });
});
