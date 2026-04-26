import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    return this.toProfile(user);
  }

  toProfile(user: {
    id: string;
    email: string;
    displayName: string;
    role: 'customer' | 'admin';
    status: 'active' | 'suspended';
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profileStats: this.buildEmptyProfileStats(),
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
}
