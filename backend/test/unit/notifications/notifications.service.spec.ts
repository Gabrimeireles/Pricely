import { NotificationsService } from '../../../src/notifications/notifications.service';

describe('NotificationsService', () => {
  it('respects category preferences before creating an in-app notification', async () => {
    const prisma = {
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({
          inAppEnabled: true,
          priceDropsEnabled: false,
          receiptOutcomesEnabled: true,
          optimizationReadyEnabled: true,
        }),
      },
      userNotification: {
        create: jest.fn(),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.create({
      userId: 'user-1',
      type: 'price_drop',
      title: 'Preco menor',
      message: 'Novo preco disponivel.',
    });

    expect(prisma.userNotification.create).not.toHaveBeenCalled();
  });

  it('creates only price-drop alerts relevant to saved list products', async () => {
    const prisma = {
      shoppingListItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { shoppingList: { userId: 'user-1' } },
            { shoppingList: { userId: 'user-1' } },
            { shoppingList: { userId: 'user-2' } },
          ]),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({
          inAppEnabled: true,
          priceDropsEnabled: true,
          receiptOutcomesEnabled: true,
          optimizationReadyEnabled: true,
        }),
      },
      userNotification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.notifyPriceDropForProduct({
      catalogProductId: 'product-1',
      productName: 'Arroz 1kg',
      previousPrice: 10,
      currentPrice: 8,
      offerId: 'offer-1',
    });

    expect(prisma.userNotification.create).toHaveBeenCalledTimes(2);
  });

  it('creates queued delivery attempts without sending to external providers', async () => {
    const prisma = {
      userNotificationDeliveryAttempt: {
        create: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          notificationId: 'notification-1',
          channel: 'email',
          status: 'queued',
        }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.createDeliveryAttempt({
      notificationId: 'notification-1',
      userId: 'user-1',
      channel: 'email',
      maxAttempts: 5,
    });

    expect(prisma.userNotificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: {
        notificationId: 'notification-1',
        userId: 'user-1',
        channel: 'email',
        maxAttempts: 5,
        nextAttemptAt: undefined,
        emailDestinationId: undefined,
        pushDeviceId: undefined,
      },
    });
  });

  it('does not enable email preferences until the destination is verified', async () => {
    const prisma = {
      userEmailNotificationDestination: {
        count: jest.fn().mockResolvedValue(0),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({ emailEnabled: false }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.updatePreferences('user-1', { emailEnabled: true });

    expect(prisma.userNotificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ emailEnabled: false }),
        update: expect.objectContaining({ emailEnabled: false }),
      }),
    );
  });

  it('does not enable push preferences until an active device exists', async () => {
    const prisma = {
      userPushDevice: {
        count: jest.fn().mockResolvedValue(0),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({ pushEnabled: false }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.updatePreferences('user-1', { pushEnabled: true });

    expect(prisma.userNotificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ pushEnabled: false }),
        update: expect.objectContaining({ pushEnabled: false }),
      }),
    );
  });

  it('requests email destination verification with normalized email tokens', async () => {
    const prisma = {
      userEmailNotificationDestination: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'destination-1',
          userId: 'user-1',
          email: 'cliente@pricely.local',
          status: 'pending',
          verifiedAt: null,
          unsubscribedAt: null,
        }),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({ emailEnabled: false }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    const result = await service.requestEmailDestination(
      'user-1',
      ' Cliente@Pricely.Local ',
    );

    expect(prisma.userEmailNotificationDestination.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        email: 'cliente@pricely.local',
        status: 'pending',
        verificationTokenHash: expect.any(String),
        unsubscribeTokenHash: expect.any(String),
      }),
    });
    expect(result.verificationToken).toEqual(expect.any(String));
    expect(result.unsubscribeToken).toEqual(expect.any(String));
  });

  it('confirms email destination and enables email preferences', async () => {
    const prisma = {
      userEmailNotificationDestination: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'destination-1',
          userId: 'user-1',
          email: 'cliente@pricely.local',
          status: 'pending',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'destination-1',
          userId: 'user-1',
          email: 'cliente@pricely.local',
          status: 'verified',
          verifiedAt: new Date('2026-06-26T04:00:00.000Z'),
          unsubscribedAt: null,
        }),
        count: jest.fn().mockResolvedValue(1),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({ emailEnabled: true }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.confirmEmailDestination('verification-token');

    expect(prisma.userEmailNotificationDestination.update).toHaveBeenCalledWith({
      where: { id: 'destination-1' },
      data: expect.objectContaining({
        status: 'verified',
        verificationTokenHash: null,
        verifiedAt: expect.any(Date),
        unsubscribedAt: null,
      }),
    });
    expect(prisma.userNotificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ emailEnabled: true }),
      }),
    );
  });

  it('maps email unsubscribe category to notification preferences', async () => {
    const prisma = {
      userEmailNotificationDestination: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'destination-1',
          userId: 'user-1',
          email: 'cliente@pricely.local',
          status: 'verified',
          verifiedAt: new Date('2026-06-26T04:00:00.000Z'),
          unsubscribedAt: null,
        }),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({
          receiptOutcomesEnabled: false,
        }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.unsubscribeEmail({
      token: 'unsubscribe-token',
      category: 'receipt_outcome',
    });

    expect(prisma.userNotificationPreference.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: {
        userId: 'user-1',
        receiptOutcomesEnabled: false,
      },
      update: {
        receiptOutcomesEnabled: false,
      },
    });
  });

  it('queues email delivery attempts for verified destinations and enabled categories', async () => {
    const prisma = {
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({
          inAppEnabled: true,
          emailEnabled: true,
          priceDropsEnabled: true,
          receiptOutcomesEnabled: true,
          optimizationReadyEnabled: true,
        }),
      },
      userNotification: {
        create: jest.fn().mockResolvedValue({
          id: 'notification-1',
          userId: 'user-1',
          type: 'price_drop',
        }),
      },
      userEmailNotificationDestination: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'destination-1',
          userId: 'user-1',
          status: 'verified',
        }),
      },
      userNotificationDeliveryAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.create({
      userId: 'user-1',
      type: 'price_drop',
      title: 'Preco menor',
      message: 'Novo preco disponivel.',
    });

    expect(prisma.userNotificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        notificationId: 'notification-1',
        userId: 'user-1',
        channel: 'email',
        emailDestinationId: 'destination-1',
      }),
    });
  });

  it('defers email delivery attempts until quiet hours end in the user timezone', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-06-26T23:30:00.000Z').getTime());
    const prisma = {
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({
          inAppEnabled: true,
          emailEnabled: true,
          priceDropsEnabled: true,
          receiptOutcomesEnabled: true,
          optimizationReadyEnabled: true,
          quietHoursEnabled: true,
          quietHoursStartMinute: 22 * 60,
          quietHoursEndMinute: 7 * 60,
          quietHoursTimezone: 'UTC',
        }),
      },
      userNotification: {
        create: jest.fn().mockResolvedValue({
          id: 'notification-1',
          userId: 'user-1',
          type: 'price_drop',
        }),
      },
      userEmailNotificationDestination: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'destination-1',
          userId: 'user-1',
          status: 'verified',
        }),
      },
      userNotificationDeliveryAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.create({
      userId: 'user-1',
      type: 'price_drop',
      title: 'Preco menor',
      message: 'Novo preco disponivel.',
    });

    expect(prisma.userNotificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        notificationId: 'notification-1',
        userId: 'user-1',
        channel: 'email',
        nextAttemptAt: new Date('2026-06-27T07:00:00.000Z'),
      }),
    });
    jest.useRealTimers();
  });

  it('persists quiet-hour preferences with default window when enabled', async () => {
    const prisma = {
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({
          quietHoursEnabled: true,
          quietHoursStartMinute: 1320,
          quietHoursEndMinute: 420,
          quietHoursTimezone: 'America/Sao_Paulo',
        }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.updatePreferences('user-1', { quietHoursEnabled: true });

    expect(prisma.userNotificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          quietHoursEnabled: true,
          quietHoursStartMinute: 1320,
          quietHoursEndMinute: 420,
          quietHoursTimezone: 'America/Sao_Paulo',
        }),
        update: expect.objectContaining({
          quietHoursEnabled: true,
          quietHoursStartMinute: 1320,
          quietHoursEndMinute: 420,
          quietHoursTimezone: 'America/Sao_Paulo',
        }),
      }),
    );
  });

  it('registers push devices with hashed token and enables push preferences', async () => {
    const prisma = {
      userPushDevice: {
        upsert: jest.fn().mockResolvedValue({
          id: 'device-1',
          userId: 'user-1',
          platform: 'android',
          deviceTokenTail: 'token-tail-1',
          isActive: true,
        }),
        count: jest.fn().mockResolvedValue(1),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({ pushEnabled: true }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.registerPushDevice('user-1', {
      platform: 'android',
      deviceToken: 'push-token-value-1234567890',
      appVersion: '1.0.0',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    });

    expect(prisma.userPushDevice.upsert).toHaveBeenCalledWith({
      where: { deviceTokenHash: expect.any(String) },
      create: expect.objectContaining({
        userId: 'user-1',
        platform: 'android',
        deviceTokenHash: expect.any(String),
        deviceTokenTail: 'e-1234567890',
        provider: 'fcm',
        appVersion: '1.0.0',
        locale: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        isActive: true,
        revokedAt: null,
        lastSeenAt: expect.any(Date),
      }),
      update: expect.objectContaining({
        userId: 'user-1',
        isActive: true,
        revokedAt: null,
        lastSeenAt: expect.any(Date),
      }),
    });
    expect(prisma.userNotificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ pushEnabled: true }),
      }),
    );
  });

  it('revokes push devices and disables push when no active device remains', async () => {
    const prisma = {
      userPushDevice: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'device-1',
          userId: 'user-1',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'device-1',
          isActive: false,
        }),
        count: jest.fn().mockResolvedValue(0),
      },
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({ pushEnabled: false }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.revokePushDevice('user-1', 'device-1');

    expect(prisma.userPushDevice.update).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: {
        isActive: false,
        revokedAt: expect.any(Date),
      },
    });
    expect(prisma.userNotificationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ pushEnabled: false }),
      }),
    );
  });

  it('queues push delivery attempts for each active device', async () => {
    const prisma = {
      userNotificationPreference: {
        upsert: jest.fn().mockResolvedValue({
          inAppEnabled: true,
          emailEnabled: false,
          pushEnabled: true,
          priceDropsEnabled: true,
          receiptOutcomesEnabled: true,
          optimizationReadyEnabled: true,
        }),
      },
      userNotification: {
        create: jest.fn().mockResolvedValue({
          id: 'notification-1',
          userId: 'user-1',
          type: 'optimization_ready',
        }),
      },
      userPushDevice: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'device-1' },
          { id: 'device-2' },
        ]),
      },
      userNotificationDeliveryAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.create({
      userId: 'user-1',
      type: 'optimization_ready',
      title: 'Otimizacao pronta',
      message: 'Sua lista foi otimizada.',
    });

    expect(prisma.userNotificationDeliveryAttempt.create).toHaveBeenCalledTimes(
      2,
    );
    expect(prisma.userNotificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        notificationId: 'notification-1',
        userId: 'user-1',
        channel: 'push',
        pushDeviceId: 'device-1',
      }),
    });
  });

  it('marks a delivery attempt as sending and increments attempt count', async () => {
    const prisma = {
      userNotificationDeliveryAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          attemptCount: 0,
          maxAttempts: 3,
        }),
        update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.markDeliverySending('attempt-1');

    expect(prisma.userNotificationDeliveryAttempt.update).toHaveBeenCalledWith({
      where: { id: 'attempt-1' },
      data: expect.objectContaining({
        status: 'sending',
        attemptCount: { increment: 1 },
        lastAttemptAt: expect.any(Date),
      }),
    });
  });

  it('marks retryable delivery failure as retrying while attempts remain', async () => {
    const nextAttemptAt = new Date('2026-06-26T03:15:00.000Z');
    const prisma = {
      userNotificationDeliveryAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          attemptCount: 1,
          maxAttempts: 3,
        }),
        update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.markDeliveryFailed('attempt-1', {
      reason: 'provider_rate_limited',
      retryable: true,
      nextAttemptAt,
    });

    expect(prisma.userNotificationDeliveryAttempt.update).toHaveBeenCalledWith({
      where: { id: 'attempt-1' },
      data: {
        status: 'retrying',
        lastFailureReason: 'provider_rate_limited',
        terminalFailureReason: null,
        nextAttemptAt,
      },
    });
  });

  it('marks non-retryable delivery failure as terminal failed', async () => {
    const prisma = {
      userNotificationDeliveryAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          attemptCount: 2,
          maxAttempts: 3,
        }),
        update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.markDeliveryFailed('attempt-1', {
      reason: 'email_unsubscribed',
      retryable: false,
    });

    expect(prisma.userNotificationDeliveryAttempt.update).toHaveBeenCalledWith({
      where: { id: 'attempt-1' },
      data: {
        status: 'failed',
        lastFailureReason: 'email_unsubscribed',
        terminalFailureReason: 'email_unsubscribed',
        nextAttemptAt: null,
      },
    });
  });

  it('marks delivery success with provider message id', async () => {
    const prisma = {
      userNotificationDeliveryAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          attemptCount: 1,
          maxAttempts: 3,
        }),
        update: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
    } as any;
    const service = new NotificationsService(prisma);

    await service.markDeliveryDelivered('attempt-1', {
      providerMessageId: 'provider-message-1',
    });

    expect(prisma.userNotificationDeliveryAttempt.update).toHaveBeenCalledWith({
      where: { id: 'attempt-1' },
      data: expect.objectContaining({
        status: 'delivered',
        providerMessageId: 'provider-message-1',
        lastFailureReason: null,
        terminalFailureReason: null,
        nextAttemptAt: null,
        deliveredAt: expect.any(Date),
      }),
    });
  });
});
