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
});
