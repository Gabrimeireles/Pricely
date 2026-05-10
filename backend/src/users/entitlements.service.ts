import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

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

  monthlyFreeTokenCount(): number {
    const configured = Number(process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH);

    return Number.isInteger(configured) && configured >= 0
      ? configured
      : DEFAULT_MONTHLY_FREE_TOKENS;
  }

  async getProfile(userId: string) {
    const hasPremium = await this.hasActivePremium(userId);

    if (!hasPremium) {
      await this.grantMonthlyFreeTokens(userId);
    }

    return {
      plan: hasPremium ? ('premium' as const) : ('free' as const),
      status: 'active' as const,
      availableOptimizationTokens: hasPremium
        ? 0
        : await this.getAvailableTokenBalance(userId),
      monthlyFreeOptimizationTokens: this.monthlyFreeTokenCount(),
      billingEnabled: false,
      checkoutEnabled: false,
    };
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

  async setManualPremium(input: {
    userId: string;
    enabled: boolean;
    adminUserId: string;
  }) {
    if (input.enabled) {
      const existing = await this.prisma.userEntitlement.findFirst({
        where: {
          userId: input.userId,
          plan: 'premium',
          status: {
            in: ['active', 'trialing'],
          },
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
      });

      if (existing) {
        return existing;
      }

      return this.prisma.userEntitlement.create({
        data: {
          userId: input.userId,
          plan: 'premium',
          status: 'active',
          source: 'admin_manual',
          externalRef: `admin:${input.adminUserId}`,
        },
      });
    }

    await this.prisma.userEntitlement.updateMany({
      where: {
        userId: input.userId,
        plan: 'premium',
        status: {
          in: ['active', 'trialing', 'past_due'],
        },
      },
      data: {
        status: 'cancelled',
        endsAt: new Date(),
        externalRef: `admin:${input.adminUserId}:cancelled`,
      },
    });

    return null;
  }

  async grantAdminOptimizationTokens(input: {
    userId: string;
    amount: number;
    adminUserId: string;
    reason?: string;
  }) {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new BadRequestException('Token adjustment amount must be positive');
    }

    return this.prisma.optimizationTokenLedgerEntry.create({
      data: {
        userId: input.userId,
        action: 'admin_adjustment',
        amount: input.amount,
        source: input.reason
          ? `admin_adjustment:${input.reason}`
          : 'admin_adjustment',
        idempotencyKey: `admin-adjustment:${input.userId}:${input.adminUserId}:${Date.now()}`,
      },
    });
  }

  async grantReceiptBonusTokens(input: {
    userId: string;
    receiptRecordId: string;
    amount?: number;
  }) {
    const amount = input.amount ?? 1;
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Receipt bonus amount must be positive');
    }

    return this.prisma.optimizationTokenLedgerEntry.upsert({
      where: {
        idempotencyKey: `receipt-bonus:${input.receiptRecordId}`,
      },
      update: {},
      create: {
        userId: input.userId,
        action: 'receipt_bonus',
        amount,
        source: 'receipt_quality_reward',
        idempotencyKey: `receipt-bonus:${input.receiptRecordId}`,
      },
    });
  }

  private currentPeriod(now = new Date()): string {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }
}
