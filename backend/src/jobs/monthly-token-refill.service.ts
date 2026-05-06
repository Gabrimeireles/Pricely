import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaService } from '../persistence/prisma.service';
import { EntitlementsService } from '../users/entitlements.service';

const DAILY_REFILL_CHECK_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MonthlyTokenRefillService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MonthlyTokenRefillService.name);
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async onModuleInit() {
    if (
      process.env.JEST_WORKER_ID ||
      process.env.TOKEN_REFILL_WORKER_ENABLED === 'false'
    ) {
      this.logger.log(
        'Monthly token refill bootstrap skipped for test or disabled environment',
      );
      return;
    }

    await this.refillActiveUsers();
    this.interval = setInterval(
      () => void this.refillActiveUsers(),
      DAILY_REFILL_CHECK_MS,
    );
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async refillActiveUsers(now = new Date()): Promise<number> {
    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const users = await this.prisma.userAccount.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      users.map((user) =>
        this.entitlementsService.grantMonthlyFreeTokens(user.id, period),
      ),
    );

    this.logger.log(
      `Granted monthly optimization tokens for ${users.length} active users in ${period}`,
    );
    return users.length;
  }
}
