import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../persistence/prisma.service';

const DEFAULT_MONTHLY_FREE_TOKENS = 2;

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async hasActivePremium(userId: string, now = new Date()): Promise<boolean> {
    const entitlement = await this.prisma.userEntitlement.findFirst({
      where: {
        userId,
        plan: 'premium',
        status: {
          in: ['active', 'trialing'],
        },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
    });

    return Boolean(entitlement);
  }

  async grantMonthlyFreeTokens(
    userId: string,
    period = this.currentPeriod(),
    amount = this.monthlyFreeTokenCount(),
  ) {
    return this.prisma.optimizationTokenLedgerEntry.upsert({
      where: {
        idempotencyKey: `monthly-free:${userId}:${period}`,
      },
      create: {
        userId,
        action: 'grant',
        amount,
        source: 'monthly_free_refill',
        idempotencyKey: `monthly-free:${userId}:${period}`,
      },
      update: {},
    });
  }

  async getAvailableTokenBalance(userId: string): Promise<number> {
    const result = await this.prisma.optimizationTokenLedgerEntry.aggregate({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount ?? 0);
  }

  async ensureOptimizationAllowed(userId: string): Promise<void> {
    if (await this.hasActivePremium(userId)) {
      return;
    }

    await this.grantMonthlyFreeTokens(userId);
    const balance = await this.getAvailableTokenBalance(userId);

    if (balance <= 0) {
      throw new HttpException(
        'No optimization tokens are available for this account',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async consumeOptimizationToken(input: {
    userId: string;
    optimizationRunId: string;
  }) {
    if (await this.hasActivePremium(input.userId)) {
      return null;
    }

    const idempotencyKey = `optimization-consume:${input.optimizationRunId}`;
    const existing = await this.prisma.optimizationTokenLedgerEntry.findUnique({
      where: {
        idempotencyKey,
      },
    });

    if (existing) {
      return existing;
    }

    const balance = await this.getAvailableTokenBalance(input.userId);

    if (balance <= 0) {
      throw new HttpException(
        'No optimization tokens are available for this account',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return this.prisma.optimizationTokenLedgerEntry.create({
      data: {
        userId: input.userId,
        action: 'consume',
        amount: -1,
        source: 'optimization_run',
        idempotencyKey,
        relatedOptimizationRunId: input.optimizationRunId,
      },
    });
  }

  async refundOptimizationToken(input: {
    userId: string;
    optimizationRunId: string;
    reason: string;
  }) {
    const consumeKey = `optimization-consume:${input.optimizationRunId}`;
    const consumed = await this.prisma.optimizationTokenLedgerEntry.findUnique({
      where: {
        idempotencyKey: consumeKey,
      },
    });

    if (!consumed) {
      return null;
    }

    return this.prisma.optimizationTokenLedgerEntry.upsert({
      where: {
        idempotencyKey: `optimization-refund:${input.optimizationRunId}`,
      },
      create: {
        userId: input.userId,
        action: 'refund',
        amount: 1,
        source: input.reason,
        idempotencyKey: `optimization-refund:${input.optimizationRunId}`,
        relatedOptimizationRunId: input.optimizationRunId,
      },
      update: {},
    });
  }

  private currentPeriod(now = new Date()): string {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private monthlyFreeTokenCount(): number {
    const configured = Number(process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH);

    return Number.isInteger(configured) && configured >= 0
      ? configured
      : DEFAULT_MONTHLY_FREE_TOKENS;
  }
}
