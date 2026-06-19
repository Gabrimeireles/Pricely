import { BadRequestException, NotFoundException } from '@nestjs/common';

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

  it('rejects sharing an empty shopping list', async () => {
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue({
        id: 'list-1',
        items: [],
      }),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(service.share('user-1', 'list-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('publishes an owned shopping list behind an opaque share token', async () => {
    const shared = {
      id: 'list-1',
      shareToken: 'token-1',
      items: [{ id: 'item-1', purchaseStatus: 'pending' }],
    };
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue({
        id: 'list-1',
        items: [{ id: 'item-1', purchaseStatus: 'pending' }],
      }),
      share: jest.fn().mockResolvedValue(shared),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(service.share('user-1', 'list-1')).resolves.toBe(shared);
    expect(repository.share).toHaveBeenCalledWith(
      'list-1',
      'user-1',
      expect.any(String),
    );
  });

  it('returns a public shared shopping list by token', async () => {
    const shared = {
      id: 'list-1',
      shareToken: 'token-1',
      items: [{ id: 'item-1', purchaseStatus: 'pending' }],
    };
    const repository = {
      findByShareToken: jest.fn().mockResolvedValue(shared),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(service.getByShareToken('token-1')).resolves.toBe(shared);
  });

  it('rejects checkout completion while items are still pending', async () => {
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue({
        id: 'list-1',
        items: [{ id: 'item-1', purchaseStatus: 'pending' }],
      }),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(
      service.completeCheckout('user-1', 'list-1', 42.5),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists checkout completion when all items are purchased', async () => {
    const completed = {
      id: 'list-1',
      items: [{ id: 'item-1', purchaseStatus: 'purchased' }],
    };
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue(completed),
      completeCheckout: jest.fn().mockResolvedValue(completed),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(
      service.completeCheckout('user-1', 'list-1', 42.5),
    ).resolves.toBe(completed);
    expect(repository.completeCheckout).toHaveBeenCalledWith(
      'list-1',
      'user-1',
      42.5,
    );
  });

  it('persists a price mismatch report for an owned list item', async () => {
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue({
        id: 'list-1',
        items: [{ id: 'item-1', purchaseStatus: 'pending' }],
      }),
      createPriceMismatchReport: jest.fn().mockResolvedValue({
        id: 'report-1',
        createdAt: '2026-05-10T00:00:00.000Z',
      }),
    };
    const service = new ShoppingListsService(
      repository as never,
      productNormalizerService as never,
      prisma as never,
    );

    await expect(
      service.reportItemPriceMismatch('user-1', 'list-1', 'item-1', {
        expectedPrice: 21.9,
        reportedPrice: 23.49,
        reason: 'Etiqueta diferente',
      }),
    ).resolves.toEqual({
      id: 'report-1',
      createdAt: '2026-05-10T00:00:00.000Z',
    });
  });
});
