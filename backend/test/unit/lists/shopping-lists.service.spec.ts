import { NotFoundException } from '@nestjs/common';

import { ShoppingListsService } from '../../../src/lists/application/shopping-lists.service';

describe('ShoppingListsService', () => {
  const productNormalizerService = {
    normalize: jest.fn((value: string) => ({
      canonicalName: value.trim().toLowerCase(),
    })),
  };
  const prisma = {
    region: {
      findUnique: jest.fn(),
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects addItems when the list does not belong to the authenticated user', async () => {
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue(null),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(
      service.addItems('user-1', 'list-1', [{ requestedName: 'Arroz' }]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects getById when the list does not belong to the authenticated user', async () => {
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue(null),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(service.getById('user-1', 'list-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
