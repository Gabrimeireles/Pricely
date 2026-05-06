import { HttpException } from '@nestjs/common';

import { EntitlementsService } from '../../../src/users/entitlements.service';

function createPrismaMock() {
  const ledger = new Map<string, any>();
  const entitlements: any[] = [];

  return {
    entitlements,
    ledger,
    prisma: {
      userEntitlement: {
        findFirst: jest.fn(async ({ where }: { where: any }) =>
          entitlements.find(
            (entry) =>
              entry.userId === where.userId &&
              entry.plan === where.plan &&
              where.status.in.includes(entry.status),
          ) ?? null,
        ),
      },
      optimizationTokenLedgerEntry: {
        upsert: jest.fn(async ({ where, create }: { where: any; create: any }) => {
          const existing = ledger.get(where.idempotencyKey);

          if (existing) {
            return existing;
          }

          const entry = { id: crypto.randomUUID(), ...create };
          ledger.set(entry.idempotencyKey, entry);
          return entry;
        }),
        aggregate: jest.fn(async ({ where }: { where: any }) => ({
          _sum: {
            amount: [...ledger.values()]
              .filter((entry) => entry.userId === where.userId)
              .reduce((total, entry) => total + entry.amount, 0),
          },
        })),
        findUnique: jest.fn(async ({ where }: { where: any }) =>
          ledger.get(where.idempotencyKey) ?? null,
        ),
        create: jest.fn(async ({ data }: { data: any }) => {
          const entry = { id: crypto.randomUUID(), ...data };
          ledger.set(entry.idempotencyKey, entry);
          return entry;
        }),
      },
    },
  };
}

describe('EntitlementsService', () => {
  it('grants monthly free tokens idempotently', async () => {
    const mock = createPrismaMock();
    const service = new EntitlementsService(mock.prisma as never);

    await service.grantMonthlyFreeTokens('user-1', '2026-05', 2);
    await service.grantMonthlyFreeTokens('user-1', '2026-05', 2);

    expect(mock.ledger.size).toBe(1);
    await expect(service.getAvailableTokenBalance('user-1')).resolves.toBe(2);
  });

  it('consumes only one token for idempotent optimization retries', async () => {
    const mock = createPrismaMock();
    const service = new EntitlementsService(mock.prisma as never);

    await service.grantMonthlyFreeTokens('user-1', '2026-05', 2);
    await service.consumeOptimizationToken({
      userId: 'user-1',
      optimizationRunId: 'run-1',
    });
    await service.consumeOptimizationToken({
      userId: 'user-1',
      optimizationRunId: 'run-1',
    });

    await expect(service.getAvailableTokenBalance('user-1')).resolves.toBe(1);
  });

  it('bypasses token consumption for active premium users', async () => {
    const mock = createPrismaMock();
    mock.entitlements.push({
      userId: 'user-1',
      plan: 'premium',
      status: 'active',
      endsAt: null,
    });
    const service = new EntitlementsService(mock.prisma as never);

    await service.ensureOptimizationAllowed('user-1');
    const consumed = await service.consumeOptimizationToken({
      userId: 'user-1',
      optimizationRunId: 'run-1',
    });

    expect(consumed).toBeNull();
    expect(mock.ledger.size).toBe(0);
  });

  it('refunds failed optimization consumption idempotently', async () => {
    const mock = createPrismaMock();
    const service = new EntitlementsService(mock.prisma as never);

    await service.grantMonthlyFreeTokens('user-1', '2026-05', 1);
    await service.consumeOptimizationToken({
      userId: 'user-1',
      optimizationRunId: 'run-1',
    });
    await service.refundOptimizationToken({
      userId: 'user-1',
      optimizationRunId: 'run-1',
      reason: 'optimization_failed',
    });
    await service.refundOptimizationToken({
      userId: 'user-1',
      optimizationRunId: 'run-1',
      reason: 'optimization_failed',
    });

    await expect(service.getAvailableTokenBalance('user-1')).resolves.toBe(1);
  });


  it('rejects optimization when the configured free grant is zero', async () => {
    process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH = '0';
    const mock = createPrismaMock();
    const service = new EntitlementsService(mock.prisma as never);

    await expect(service.ensureOptimizationAllowed('user-1')).rejects.toBeInstanceOf(
      HttpException,
    );
    delete process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH;
  });
});
