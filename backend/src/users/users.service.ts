import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../persistence/prisma.service';
import { type UserProfile, type UserProfileStats } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.userAccount.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });
  }

  async findById(id: string) {
    return this.prisma.userAccount.findUnique({
      where: { id },
    });
  }

  async createCustomerAccount(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    return this.prisma.userAccount.create({
      data: {
        email: normalizedEmail,
        passwordHash: input.passwordHash,
        displayName: input.displayName.trim(),
        role: 'customer',
        status: 'active',
      },
    });
  }

  async markSuccessfulLogin(id: string) {
    return this.prisma.userAccount.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async getProfileById(id: string): Promise<UserProfile> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Authenticated account was not found');
    }

    const preferredRegion = user.preferredRegionId
      ? await this.prisma.region.findUnique({
          where: {
            id: user.preferredRegionId,
          },
          select: {
            slug: true,
          },
        })
      : null;

    const [shoppingListsCount, completedOptimizationRuns, latestOptimizationSavings, receiptSubmissionsCount] =
      await Promise.all([
        this.prisma.shoppingList.count({
          where: { userId: id },
        }),
        this.prisma.optimizationRun.count({
          where: {
            userId: id,
            status: 'completed',
          },
        }),
        this.getLatestCompletedSavingsByList(id),
        this.prisma.receiptRecord.count({
          where: { userId: id },
        }),
      ]);

    return this.toProfile(
      user,
      {
        completedOptimizationRuns,
        contributionsCount: receiptSubmissionsCount,
        offerReportsCount: 0,
        receiptSubmissionsCount,
        shoppingListsCount,
        totalEstimatedSavings: latestOptimizationSavings,
      },
      preferredRegion?.slug ?? null,
    );
  }

  async updatePreferredRegionBySlug(id: string, regionSlug: string): Promise<UserProfile> {
    const region = await this.prisma.region.findUnique({
      where: { slug: regionSlug },
      select: { id: true, slug: true },
    });

    if (!region) {
      throw new NotFoundException('Selected city was not found');
    }

    await this.prisma.userAccount.update({
      where: { id },
      data: {
        preferredRegionId: region.id,
      },
    });

    return this.getProfileById(id);
  }

  toProfile(
    user: {
    id: string;
    email: string;
    displayName: string;
    role: 'customer' | 'admin';
    status: 'active' | 'suspended';
    preferredRegionId?: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    },
    stats: UserProfileStats = this.buildEmptyProfileStats(),
    preferredRegionSlug: string | null = null,
  ): UserProfile {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      preferredRegionSlug,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profileStats: stats,
    };
  }

  private buildEmptyProfileStats(): UserProfileStats {
    return {
      totalEstimatedSavings: 0,
      shoppingListsCount: 0,
      completedOptimizationRuns: 0,
      contributionsCount: 0,
      receiptSubmissionsCount: 0,
      offerReportsCount: 0,
    };
  }

  private async getLatestCompletedSavingsByList(userId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<
      Array<{ totalEstimatedSavings: Prisma.Decimal | number | string | null }>
    >`
      SELECT COALESCE(SUM(latest."estimatedSavings"), 0) AS "totalEstimatedSavings"
      FROM (
        SELECT DISTINCT ON ("shoppingListId") "shoppingListId", "estimatedSavings"
        FROM "OptimizationRun"
        WHERE "userId" = ${userId}
          AND "status" = 'completed'
          AND "estimatedSavings" IS NOT NULL
        ORDER BY "shoppingListId", "createdAt" DESC
      ) latest
    `;

    return Number(rows[0]?.totalEstimatedSavings ?? 0);
  }
}
