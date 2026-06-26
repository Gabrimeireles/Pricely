import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type Prisma,
  type UserNotificationDeliveryChannel,
  type UserNotificationDeliveryStatus,
  type UserNotificationType,
} from '@prisma/client';

import { PrismaService } from '../persistence/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, unreadOnly = false) {
    return this.prisma.userNotification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(
    userId: string,
    input: {
      inAppEnabled?: boolean;
      priceDropsEnabled?: boolean;
      receiptOutcomesEnabled?: boolean;
      optimizationReadyEnabled?: boolean;
    },
  ) {
    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
        emailEnabled: false,
        pushEnabled: false,
      },
      update: {
        ...input,
        emailEnabled: false,
        pushEnabled: false,
      },
    });
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.userNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notificacao nao encontrada');
    }
    return this.prisma.userNotification.update({
      where: { id: notificationId },
      data: { readAt: notification.readAt ?? new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.userNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { status: 'ok' };
  }

  async create(input: {
    userId: string;
    type: UserNotificationType;
    title: string;
    message: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const preferences = await this.getPreferences(input.userId);
    if (
      !preferences.inAppEnabled ||
      !this.typeEnabled(preferences, input.type)
    ) {
      return null;
    }
    return this.prisma.userNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title.slice(0, 160),
        message: input.message.slice(0, 500),
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata,
      },
    });
  }

  async createDeliveryAttempt(input: {
    notificationId: string;
    userId: string;
    channel: UserNotificationDeliveryChannel;
    maxAttempts?: number;
    nextAttemptAt?: Date;
  }) {
    return this.prisma.userNotificationDeliveryAttempt.create({
      data: {
        notificationId: input.notificationId,
        userId: input.userId,
        channel: input.channel,
        maxAttempts: input.maxAttempts ?? 3,
        nextAttemptAt: input.nextAttemptAt,
      },
    });
  }

  async listDeliveryAttempts(input: {
    userId?: string;
    notificationId?: string;
    channel?: UserNotificationDeliveryChannel;
    status?: UserNotificationDeliveryStatus;
    dueOnly?: boolean;
    take?: number;
  }) {
    return this.prisma.userNotificationDeliveryAttempt.findMany({
      where: {
        userId: input.userId,
        notificationId: input.notificationId,
        channel: input.channel,
        status: input.status,
        ...(input.dueOnly
          ? {
              OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
            }
          : {}),
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      take: input.take ?? 100,
    });
  }

  async markDeliverySending(attemptId: string) {
    const attempt = await this.findDeliveryAttempt(attemptId);
    return this.prisma.userNotificationDeliveryAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'sending',
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
  }

  async markDeliveryDelivered(
    attemptId: string,
    input: { providerMessageId?: string } = {},
  ) {
    const attempt = await this.findDeliveryAttempt(attemptId);
    return this.prisma.userNotificationDeliveryAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'delivered',
        providerMessageId: input.providerMessageId,
        lastFailureReason: null,
        terminalFailureReason: null,
        nextAttemptAt: null,
        deliveredAt: new Date(),
      },
    });
  }

  async markDeliveryFailed(
    attemptId: string,
    input: {
      reason: string;
      retryable: boolean;
      nextAttemptAt?: Date;
    },
  ) {
    const attempt = await this.findDeliveryAttempt(attemptId);
    const shouldRetry =
      input.retryable && attempt.attemptCount < attempt.maxAttempts;
    return this.prisma.userNotificationDeliveryAttempt.update({
      where: { id: attempt.id },
      data: {
        status: shouldRetry ? 'retrying' : 'failed',
        lastFailureReason: input.reason.slice(0, 500),
        terminalFailureReason: shouldRetry
          ? null
          : input.reason.slice(0, 500),
        nextAttemptAt: shouldRetry ? input.nextAttemptAt : null,
      },
    });
  }

  async notifyPriceDropForProduct(input: {
    catalogProductId: string;
    productName: string;
    previousPrice: number;
    currentPrice: number;
    offerId: string;
  }) {
    if (input.currentPrice >= input.previousPrice) {
      return;
    }
    const users = await this.prisma.shoppingListItem.findMany({
      where: {
        catalogProductId: input.catalogProductId,
        shoppingList: { status: { not: 'archived' } },
      },
      select: { shoppingList: { select: { userId: true } } },
      distinct: ['shoppingListId'],
      take: 500,
    });
    const userIds = [...new Set(users.map((item) => item.shoppingList.userId))];
    await Promise.all(
      userIds.map((userId) =>
        this.create({
          userId,
          type: 'price_drop',
          title: `Preco menor para ${input.productName}`,
          message: `O preco caiu de R$ ${input.previousPrice.toFixed(2)} para R$ ${input.currentPrice.toFixed(2)}.`,
          resourceType: 'product_offer',
          resourceId: input.offerId,
          metadata: {
            catalogProductId: input.catalogProductId,
            previousPrice: input.previousPrice,
            currentPrice: input.currentPrice,
          },
        }),
      ),
    );
  }

  private typeEnabled(
    preferences: {
      priceDropsEnabled: boolean;
      receiptOutcomesEnabled: boolean;
      optimizationReadyEnabled: boolean;
    },
    type: UserNotificationType,
  ) {
    if (type === 'price_drop') {
      return preferences.priceDropsEnabled;
    }
    if (type === 'receipt_outcome') {
      return preferences.receiptOutcomesEnabled;
    }
    return preferences.optimizationReadyEnabled;
  }

  private async findDeliveryAttempt(attemptId: string) {
    const attempt = await this.prisma.userNotificationDeliveryAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException('Tentativa de entrega nao encontrada');
    }
    return attempt;
  }
}
