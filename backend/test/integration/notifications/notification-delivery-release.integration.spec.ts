import { NotificationDeliveryExecutorService } from '../../../src/notifications/notification-delivery-executor.service';
import { NotificationsService } from '../../../src/notifications/notifications.service';
import { SandboxNotificationDeliveryProvider } from '../../../src/notifications/sandbox-notification-delivery.provider';

type AttemptStatus =
  | 'queued'
  | 'sending'
  | 'delivered'
  | 'retrying'
  | 'failed'
  | 'cancelled';

interface StoredAttempt {
  id: string;
  notificationId: string;
  userId: string;
  channel: 'email' | 'push';
  status: AttemptStatus;
  attemptCount: number;
  maxAttempts: number;
  providerMessageId: string | null;
  lastFailureReason: string | null;
  terminalFailureReason: string | null;
  nextAttemptAt: Date | null;
  lastAttemptAt: Date | null;
  deliveredAt: Date | null;
  emailDestinationId: string | null;
  pushDeviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredNotification {
  id: string;
  userId: string;
  type: 'price_drop' | 'receipt_outcome' | 'optimization_ready';
  title: string;
  message: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
}

interface StoredPreference {
  userId: string;
  inAppEnabled: boolean;
  priceDropsEnabled: boolean;
  receiptOutcomesEnabled: boolean;
  optimizationReadyEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStartMinute: number | null;
  quietHoursEndMinute: number | null;
  quietHoursTimezone: string | null;
}

interface StoredEmailDestination {
  id: string;
  userId: string;
  email: string;
  status: 'pending' | 'verified' | 'unsubscribed';
  verificationTokenHash: string | null;
  unsubscribeTokenHash: string | null;
  verifiedAt: Date | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredPushDevice {
  id: string;
  userId: string;
  platform: 'android' | 'ios' | 'web';
  provider: string;
  deviceTokenHash: string;
  deviceTokenTail: string;
  isActive: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class NotificationReleasePrismaMock {
  readonly notifications: StoredNotification[] = [];
  readonly attempts: StoredAttempt[] = [];
  readonly preferences = new Map<string, StoredPreference>();
  readonly emailDestinations: StoredEmailDestination[] = [];
  readonly pushDevices: StoredPushDevice[] = [];

  private notificationSequence = 0;
  private attemptSequence = 0;

  readonly userNotificationPreference = {
    upsert: jest.fn(({ where, create, update }) => {
      const existing = this.preferences.get(where.userId);
      const next = {
        ...(existing ?? this.defaultPreference(where.userId)),
        ...create,
        ...update,
      };
      this.preferences.set(where.userId, next);
      return Promise.resolve({ ...next });
    }),
  };

  readonly userNotification = {
    create: jest.fn(({ data }) => {
      const notification: StoredNotification = {
        id: `notification-${++this.notificationSequence}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        resourceType: data.resourceType ?? null,
        resourceId: data.resourceId ?? null,
        metadata: data.metadata ?? null,
        readAt: null,
        createdAt: new Date(),
      };
      this.notifications.push(notification);
      return Promise.resolve({ ...notification });
    }),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findFirst: jest.fn(),
  };

  readonly userEmailNotificationDestination = {
    count: jest.fn(({ where }) =>
      Promise.resolve(
        this.emailDestinations.filter(
          (destination) =>
            destination.userId === where.userId &&
            (!where.status || destination.status === where.status),
        ).length,
      ),
    ),
    findFirst: jest.fn(({ where }) =>
      Promise.resolve(
        this.emailDestinations.find(
          (destination) =>
            destination.userId === where.userId &&
            (!where.status || destination.status === where.status),
        ) ?? null,
      ),
    ),
  };

  readonly userPushDevice = {
    count: jest.fn(({ where }) =>
      Promise.resolve(
        this.pushDevices.filter(
          (device) =>
            device.userId === where.userId &&
            (where.isActive === undefined || device.isActive === where.isActive),
        ).length,
      ),
    ),
    findMany: jest.fn(({ where, take }) =>
      Promise.resolve(
        this.pushDevices
          .filter(
            (device) =>
              device.userId === where.userId &&
              (where.isActive === undefined ||
                device.isActive === where.isActive),
          )
          .slice(0, take ?? 10)
          .map((device) => ({ ...device })),
      ),
    ),
  };

  readonly userNotificationDeliveryAttempt = {
    create: jest.fn(({ data }) => {
      const attempt: StoredAttempt = {
        id: `attempt-${++this.attemptSequence}`,
        notificationId: data.notificationId,
        userId: data.userId,
        channel: data.channel,
        status: 'queued',
        attemptCount: 0,
        maxAttempts: data.maxAttempts ?? 3,
        providerMessageId: null,
        lastFailureReason: null,
        terminalFailureReason: null,
        nextAttemptAt: data.nextAttemptAt ?? null,
        lastAttemptAt: null,
        deliveredAt: null,
        emailDestinationId: data.emailDestinationId ?? null,
        pushDeviceId: data.pushDeviceId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.attempts.push(attempt);
      return Promise.resolve({ ...attempt });
    }),
    findMany: jest.fn(({ where, take }) => {
      const nowLimit = where.OR?.find(
        (entry: { nextAttemptAt?: { lte?: Date } }) => entry.nextAttemptAt?.lte,
      )?.nextAttemptAt?.lte;
      return Promise.resolve(
        this.attempts
          .filter((attempt) => {
            const matchesStatus = where.status?.in
              ? where.status.in.includes(attempt.status)
              : !where.status || attempt.status === where.status;
            const isDue =
              !nowLimit ||
              attempt.nextAttemptAt === null ||
              attempt.nextAttemptAt <= nowLimit;
            return matchesStatus && isDue;
          })
          .slice(0, take ?? 25)
          .map((attempt) => this.withTargets(attempt)),
      );
    }),
    findUnique: jest.fn(({ where }) =>
      Promise.resolve(
        this.attempts.find((attempt) => attempt.id === where.id) ?? null,
      ),
    ),
    update: jest.fn(({ where, data }) => {
      const attempt = this.attempts.find((entry) => entry.id === where.id);
      if (!attempt) {
        throw new Error(`Attempt ${where.id} not found`);
      }
      Object.assign(attempt, {
        ...data,
        attemptCount:
          typeof data.attemptCount?.increment === 'number'
            ? attempt.attemptCount + data.attemptCount.increment
            : data.attemptCount ?? attempt.attemptCount,
        updatedAt: new Date(),
      });
      return Promise.resolve({ ...attempt });
    }),
  };

  addVerifiedEmail(userId: string, email = 'cliente@pricely.local') {
    this.emailDestinations.push({
      id: `email-${this.emailDestinations.length + 1}`,
      userId,
      email,
      status: 'verified',
      verificationTokenHash: null,
      unsubscribeTokenHash: 'unsubscribe-hash',
      verifiedAt: new Date('2026-06-26T08:00:00.000Z'),
      unsubscribedAt: null,
      createdAt: new Date('2026-06-26T07:00:00.000Z'),
      updatedAt: new Date('2026-06-26T08:00:00.000Z'),
    });
  }

  addActivePushDevice(userId: string) {
    this.pushDevices.push({
      id: `push-${this.pushDevices.length + 1}`,
      userId,
      platform: 'android',
      provider: 'sandbox-push',
      deviceTokenHash: 'device-token-hash',
      deviceTokenTail: 'token-tail-123456',
      isActive: true,
      lastSeenAt: new Date('2026-06-26T08:00:00.000Z'),
      createdAt: new Date('2026-06-26T07:00:00.000Z'),
      updatedAt: new Date('2026-06-26T08:00:00.000Z'),
    });
  }

  setPreference(userId: string, patch: Partial<StoredPreference>) {
    this.preferences.set(userId, {
      ...this.defaultPreference(userId),
      ...patch,
    });
  }

  private defaultPreference(userId: string): StoredPreference {
    return {
      userId,
      inAppEnabled: true,
      priceDropsEnabled: true,
      receiptOutcomesEnabled: true,
      optimizationReadyEnabled: true,
      emailEnabled: false,
      pushEnabled: false,
      quietHoursEnabled: false,
      quietHoursStartMinute: null,
      quietHoursEndMinute: null,
      quietHoursTimezone: null,
    };
  }

  private withTargets(attempt: StoredAttempt) {
    return {
      ...attempt,
      notification: this.notifications.find(
        (notification) => notification.id === attempt.notificationId,
      ),
      emailDestination:
        this.emailDestinations.find(
          (destination) => destination.id === attempt.emailDestinationId,
        ) ?? null,
      pushDevice:
        this.pushDevices.find((device) => device.id === attempt.pushDeviceId) ??
        null,
    };
  }
}

async function createReleaseNotification(service: NotificationsService) {
  return service.create({
    userId: 'user-1',
    type: 'price_drop',
    title: 'Preco menor para arroz',
    message: 'O preco do arroz caiu na sua cidade.',
    resourceType: 'product_offer',
    resourceId: 'offer-1',
    metadata: { source: 'release-smoke' },
  });
}

describe('notification delivery release coverage', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('covers sandbox email and push delivery attempts through delivered state', async () => {
    const prisma = new NotificationReleasePrismaMock();
    prisma.addVerifiedEmail('user-1');
    prisma.addActivePushDevice('user-1');
    prisma.setPreference('user-1', { emailEnabled: true, pushEnabled: true });
    const notifications = new NotificationsService(prisma as never);
    const executor = new NotificationDeliveryExecutorService(
      prisma as never,
      notifications,
      new SandboxNotificationDeliveryProvider(),
    );

    await createReleaseNotification(notifications);
    await expect(executor.processDueAttempts()).resolves.toEqual({
      processed: 2,
      delivered: 2,
      retrying: 0,
      failed: 0,
      skipped: 0,
    });

    expect(prisma.attempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          channel: 'email',
          status: 'delivered',
          providerMessageId: 'sandbox-email-attempt-1',
        }),
        expect.objectContaining({
          channel: 'push',
          status: 'delivered',
          providerMessageId: 'sandbox-push-attempt-2',
        }),
      ]),
    );
  });

  it('covers quiet-hour deferral before delivering the deferred attempt', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-26T23:30:00.000Z').getTime());
    const prisma = new NotificationReleasePrismaMock();
    prisma.addVerifiedEmail('user-1');
    prisma.setPreference('user-1', {
      emailEnabled: true,
      quietHoursEnabled: true,
      quietHoursStartMinute: 22 * 60,
      quietHoursEndMinute: 7 * 60,
      quietHoursTimezone: 'UTC',
    });
    const notifications = new NotificationsService(prisma as never);
    const executor = new NotificationDeliveryExecutorService(
      prisma as never,
      notifications,
      new SandboxNotificationDeliveryProvider(),
    );

    await createReleaseNotification(notifications);
    expect(prisma.attempts[0]).toEqual(
      expect.objectContaining({
        status: 'queued',
        nextAttemptAt: new Date('2026-06-27T07:00:00.000Z'),
      }),
    );
    await expect(
      executor.processDueAttempts({
        now: new Date('2026-06-27T06:59:00.000Z'),
      }),
    ).resolves.toEqual({
      processed: 0,
      delivered: 0,
      retrying: 0,
      failed: 0,
      skipped: 0,
    });

    await expect(
      executor.processDueAttempts({
        now: new Date('2026-06-27T07:00:00.000Z'),
      }),
    ).resolves.toEqual({
      processed: 1,
      delivered: 1,
      retrying: 0,
      failed: 0,
      skipped: 0,
    });
  });

  it('covers retryable provider failure with a future retry window', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-26T12:00:00.000Z').getTime());
    const prisma = new NotificationReleasePrismaMock();
    prisma.addVerifiedEmail('user-1');
    prisma.setPreference('user-1', { emailEnabled: true });
    const notifications = new NotificationsService(prisma as never);
    const provider = {
      deliver: jest.fn().mockResolvedValue({
        retryable: true,
        failureReason: 'sandbox_provider_rate_limited',
      }),
    };
    const executor = new NotificationDeliveryExecutorService(
      prisma as never,
      notifications,
      provider,
    );

    await createReleaseNotification(notifications);
    await expect(executor.processDueAttempts()).resolves.toEqual({
      processed: 1,
      delivered: 0,
      retrying: 1,
      failed: 0,
      skipped: 0,
    });

    expect(prisma.attempts[0]).toEqual(
      expect.objectContaining({
        status: 'retrying',
        lastFailureReason: 'sandbox_provider_rate_limited',
        terminalFailureReason: null,
        nextAttemptAt: new Date('2026-06-26T12:05:00.000Z'),
      }),
    );
  });

  it('covers terminal provider failure without scheduling another attempt', async () => {
    const prisma = new NotificationReleasePrismaMock();
    prisma.addVerifiedEmail('user-1');
    prisma.setPreference('user-1', { emailEnabled: true });
    const notifications = new NotificationsService(prisma as never);
    const provider = {
      deliver: jest.fn().mockResolvedValue({
        retryable: false,
        failureReason: 'sandbox_provider_rejected_payload',
      }),
    };
    const executor = new NotificationDeliveryExecutorService(
      prisma as never,
      notifications,
      provider,
    );

    await createReleaseNotification(notifications);
    await expect(executor.processDueAttempts()).resolves.toEqual({
      processed: 1,
      delivered: 0,
      retrying: 0,
      failed: 1,
      skipped: 0,
    });

    expect(prisma.attempts[0]).toEqual(
      expect.objectContaining({
        status: 'failed',
        lastFailureReason: 'sandbox_provider_rejected_payload',
        terminalFailureReason: 'sandbox_provider_rejected_payload',
        nextAttemptAt: null,
      }),
    );
  });
});
