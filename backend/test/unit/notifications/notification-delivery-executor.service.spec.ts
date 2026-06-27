import { Logger } from '@nestjs/common';

import { NotificationDeliveryExecutorService } from '../../../src/notifications/notification-delivery-executor.service';
import { SandboxNotificationDeliveryProvider } from '../../../src/notifications/sandbox-notification-delivery.provider';

function buildAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attempt-1',
    notificationId: 'notification-1',
    userId: 'user-1',
    emailDestinationId: 'destination-1',
    pushDeviceId: null,
    channel: 'email',
    status: 'queued',
    attemptCount: 0,
    maxAttempts: 3,
    providerMessageId: null,
    lastFailureReason: null,
    terminalFailureReason: null,
    nextAttemptAt: null,
    lastAttemptAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-06-26T10:00:00.000Z'),
    updatedAt: new Date('2026-06-26T10:00:00.000Z'),
    notification: {
      id: 'notification-1',
      userId: 'user-1',
      type: 'price_drop',
      title: 'Preco menor',
      message: 'Arroz caiu de preco.',
      resourceType: 'product_offer',
      resourceId: 'offer-1',
      metadata: null,
      readAt: null,
      createdAt: new Date('2026-06-26T09:59:00.000Z'),
    },
    emailDestination: {
      id: 'destination-1',
      userId: 'user-1',
      email: 'cliente@pricely.local',
      status: 'verified',
      verificationTokenHash: null,
      unsubscribeTokenHash: 'unsubscribe-hash',
      verifiedAt: new Date('2026-06-26T09:00:00.000Z'),
      unsubscribedAt: null,
      createdAt: new Date('2026-06-26T08:00:00.000Z'),
      updatedAt: new Date('2026-06-26T09:00:00.000Z'),
    },
    pushDevice: null,
    ...overrides,
  };
}

describe('NotificationDeliveryExecutorService', () => {
  it('delivers due email attempts through the provider and records provider message id', async () => {
    const attempt = buildAttempt();
    const prisma = {
      userNotificationDeliveryAttempt: {
        findMany: jest.fn().mockResolvedValue([attempt]),
      },
    };
    const notificationsService = {
      markDeliverySending: jest
        .fn()
        .mockResolvedValue({ ...attempt, attemptCount: 1, status: 'sending' }),
      markDeliveryDelivered: jest.fn().mockResolvedValue({}),
      markDeliveryFailed: jest.fn(),
    };
    const provider = {
      deliver: jest.fn().mockResolvedValue({
        providerMessageId: 'sandbox-email-attempt-1',
      }),
    };
    const service = new NotificationDeliveryExecutorService(
      prisma as never,
      notificationsService as never,
      provider,
    );

    await expect(service.processDueAttempts()).resolves.toEqual({
      processed: 1,
      delivered: 1,
      retrying: 0,
      failed: 0,
      skipped: 0,
    });

    expect(provider.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: 'attempt-1',
        channel: 'email',
        destination: {
          id: 'destination-1',
          label: 'cl***@pricely.local',
          provider: 'sandbox-email',
        },
      }),
    );
    expect(notificationsService.markDeliveryDelivered).toHaveBeenCalledWith(
      'attempt-1',
      { providerMessageId: 'sandbox-email-attempt-1' },
    );
    expect(notificationsService.markDeliveryFailed).not.toHaveBeenCalled();
  });

  it('fails terminally when a queued email destination is no longer verified', async () => {
    const attempt = buildAttempt({
      emailDestination: {
        ...(buildAttempt().emailDestination as Record<string, unknown>),
        status: 'unsubscribed',
      },
    });
    const prisma = {
      userNotificationDeliveryAttempt: {
        findMany: jest.fn().mockResolvedValue([attempt]),
      },
    };
    const notificationsService = {
      markDeliverySending: jest.fn(),
      markDeliveryDelivered: jest.fn(),
      markDeliveryFailed: jest.fn().mockResolvedValue({}),
    };
    const provider = { deliver: jest.fn() };
    const service = new NotificationDeliveryExecutorService(
      prisma as never,
      notificationsService as never,
      provider,
    );

    await expect(service.processDueAttempts()).resolves.toEqual({
      processed: 1,
      delivered: 0,
      retrying: 0,
      failed: 1,
      skipped: 0,
    });

    expect(provider.deliver).not.toHaveBeenCalled();
    expect(notificationsService.markDeliverySending).not.toHaveBeenCalled();
    expect(notificationsService.markDeliveryFailed).toHaveBeenCalledWith(
      'attempt-1',
      {
        reason: 'notification_delivery_destination_unavailable',
        retryable: false,
      },
    );
  });

  it('retries provider failures with bounded backoff', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-06-26T12:00:00.000Z').getTime());
    const attempt = buildAttempt();
    const prisma = {
      userNotificationDeliveryAttempt: {
        findMany: jest.fn().mockResolvedValue([attempt]),
      },
    };
    const notificationsService = {
      markDeliverySending: jest
        .fn()
        .mockResolvedValue({ ...attempt, attemptCount: 2, status: 'sending' }),
      markDeliveryDelivered: jest.fn(),
      markDeliveryFailed: jest.fn().mockResolvedValue({}),
    };
    const provider = {
      deliver: jest.fn().mockResolvedValue({
        retryable: true,
        failureReason: 'sandbox_provider_rate_limited',
      }),
    };
    const service = new NotificationDeliveryExecutorService(
      prisma as never,
      notificationsService as never,
      provider,
    );

    await expect(service.processDueAttempts()).resolves.toEqual({
      processed: 1,
      delivered: 0,
      retrying: 1,
      failed: 0,
      skipped: 0,
    });

    expect(notificationsService.markDeliveryFailed).toHaveBeenCalledWith(
      'attempt-1',
      {
        reason: 'sandbox_provider_rate_limited',
        retryable: true,
        nextAttemptAt: new Date('2026-06-26T12:10:00.000Z'),
      },
    );
    jest.useRealTimers();
  });
});

describe('SandboxNotificationDeliveryProvider', () => {
  it('returns deterministic sandbox ids and logs only redacted destination labels', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const provider = new SandboxNotificationDeliveryProvider();

    await expect(
      provider.deliver({
        attemptId: 'attempt-1',
        channel: 'push',
        title: 'Lista pronta',
        message: 'Abra o app para conferir.',
        destination: {
          id: 'device-1',
          label: 'android:redacted:il-123',
          provider: 'fcm',
        },
      }),
    ).resolves.toEqual({
      providerMessageId: 'sandbox-push-attempt-1',
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'notification_delivery_sandbox_send',
        attemptId: 'attempt-1',
        destinationLabel: 'android:redacted:il-123',
      }),
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(
      'push-token-value-1234567890',
    );
  });
});
