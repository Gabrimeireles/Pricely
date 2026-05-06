import { MonthlyTokenRefillService } from '../../../src/jobs/monthly-token-refill.service';

describe('MonthlyTokenRefillService', () => {
  it('grants the current monthly token allowance to active users idempotently by period', async () => {
    const prisma = {
      userAccount: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]),
      },
    };
    const entitlementsService = {
      grantMonthlyFreeTokens: jest.fn().mockResolvedValue(undefined),
    };
    const service = new MonthlyTokenRefillService(
      prisma as never,
      entitlementsService as never,
    );

    const count = await service.refillActiveUsers(
      new Date('2026-05-06T00:00:00Z'),
    );

    expect(count).toBe(2);
    expect(entitlementsService.grantMonthlyFreeTokens).toHaveBeenCalledWith(
      'user-1',
      '2026-05',
    );
    expect(entitlementsService.grantMonthlyFreeTokens).toHaveBeenCalledWith(
      'user-2',
      '2026-05',
    );
  });
});
