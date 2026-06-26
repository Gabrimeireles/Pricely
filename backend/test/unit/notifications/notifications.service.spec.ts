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
      },
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
