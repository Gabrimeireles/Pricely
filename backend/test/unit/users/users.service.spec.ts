import { NotFoundException } from '@nestjs/common';

import { UsersService } from '../../../src/users/users.service';

describe('UsersService', () => {
  it('updates the preferred region by slug and returns the refreshed profile', async () => {
    const prisma = {
      userAccount: {
        findUnique: jest.fn().mockResolvedValue({
            id: 'user-1',
            email: 'cliente@pricely.local',
            passwordHash: 'hash',
            displayName: 'Cliente',
            role: 'customer',
            status: 'active',
            lastLoginAt: null,
            createdAt: new Date('2026-04-29T00:00:00.000Z'),
            updatedAt: new Date('2026-04-29T00:00:00.000Z'),
            preferredRegionId: 'region-1',
          }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      region: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'region-1',
          slug: 'sao-paulo-sp',
        }),
      },
      shoppingList: {
        count: jest.fn().mockResolvedValue(0),
      },
      optimizationRun: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            estimatedSavings: 0,
          },
        }),
      },
      receiptRecord: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const service = new UsersService(prisma as never);

    const profile = await service.updatePreferredRegionBySlug('user-1', 'sao-paulo-sp');

    expect(prisma.region.findUnique).toHaveBeenCalledWith({
      where: { slug: 'sao-paulo-sp' },
      select: { id: true, slug: true },
    });
    expect(prisma.userAccount.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { preferredRegionId: 'region-1' },
    });
    expect(profile.preferredRegionSlug).toBe('sao-paulo-sp');
  });

  it('fails when the preferred region slug does not exist', async () => {
    const prisma = {
      region: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new UsersService(prisma as never);

    await expect(
      service.updatePreferredRegionBySlug('user-1', 'cidade-inexistente'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
