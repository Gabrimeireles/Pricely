import { randomBytes, createHash } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type Prisma,
  type UserEmailNotificationDestination,
  type UserNotificationDeliveryChannel,
  type UserNotificationDeliveryStatus,
  type UserNotificationPreference,
  type UserNotificationType,
} from '@prisma/client';

import { PrismaService } from '../persistence/prisma.service';

type EmailUnsubscribeCategory =
  | 'all'
  | 'price_drop'
  | 'receipt_outcome'
  | 'optimization';

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
      emailEnabled?: boolean;
    },
  ) {
    const emailEnabled =
      input.emailEnabled === true
        ? await this.hasVerifiedEmailDestination(userId)
        : input.emailEnabled;

    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
        emailEnabled: emailEnabled ?? false,
        pushEnabled: false,
      },
      update: {
        ...input,
        emailEnabled,
        pushEnabled: false,
      },
    });
  }

  async getEmailDestination(userId: string) {
    return this.prisma.userEmailNotificationDestination.findUnique({
      where: { userId },
      select: {
        id: true,
        email: true,
        status: true,
        verifiedAt: true,
        unsubscribedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async requestEmailDestination(userId: string, email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const verificationToken = this.createToken();
    const unsubscribeToken = this.createToken();
    const existing =
      await this.prisma.userEmailNotificationDestination.findUnique({
        where: { userId },
      });

    const destination = existing
      ? await this.prisma.userEmailNotificationDestination.update({
          where: { userId },
          data: {
            email: normalizedEmail,
            status: 'pending',
            verificationTokenHash: this.hashToken(verificationToken),
            verifiedAt: null,
            unsubscribedAt: null,
          },
        })
      : await this.prisma.userEmailNotificationDestination.create({
          data: {
            userId,
            email: normalizedEmail,
            status: 'pending',
            verificationTokenHash: this.hashToken(verificationToken),
            unsubscribeTokenHash: this.hashToken(unsubscribeToken),
          },
        });

    await this.updatePreferences(userId, { emailEnabled: false });

    return this.toEmailDestinationResponse(destination, {
      verificationToken,
      unsubscribeToken: existing ? undefined : unsubscribeToken,
    });
  }

  async confirmEmailDestination(token: string) {
    const destination =
      await this.prisma.userEmailNotificationDestination.findFirst({
        where: {
          verificationTokenHash: this.hashToken(token),
          status: 'pending',
        },
      });
    if (!destination) {
      throw new NotFoundException('Destino de email nao encontrado');
    }

    const updated = await this.prisma.userEmailNotificationDestination.update({
      where: { id: destination.id },
      data: {
        status: 'verified',
        verificationTokenHash: null,
        verifiedAt: new Date(),
        unsubscribedAt: null,
      },
    });
    await this.updatePreferences(updated.userId, { emailEnabled: true });

    return this.toEmailDestinationResponse(updated);
  }

  async unsubscribeEmail(input: {
    token: string;
    category?: EmailUnsubscribeCategory;
  }) {
    const destination =
      await this.prisma.userEmailNotificationDestination.findFirst({
        where: { unsubscribeTokenHash: this.hashToken(input.token) },
      });
    if (!destination) {
      throw new NotFoundException('Destino de email nao encontrado');
    }

    const category = input.category ?? 'all';
    await this.prisma.userNotificationPreference.upsert({
      where: { userId: destination.userId },
      create: {
        userId: destination.userId,
        ...this.unsubscribePreferencePatch(category),
      },
      update: this.unsubscribePreferencePatch(category),
    });

    if (category === 'all') {
      const updated = await this.prisma.userEmailNotificationDestination.update({
        where: { id: destination.id },
        data: {
          status: 'unsubscribed',
          unsubscribedAt: new Date(),
        },
      });
      return this.toEmailDestinationResponse(updated);
    }

    return this.toEmailDestinationResponse(destination);
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
    const notification = await this.prisma.userNotification.create({
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
    await this.queueEmailDeliveryIfEligible(notification, preferences);
    return notification;
  }

  async createDeliveryAttempt(input: {
    notificationId: string;
    userId: string;
    channel: UserNotificationDeliveryChannel;
    maxAttempts?: number;
    nextAttemptAt?: Date;
    emailDestinationId?: string;
  }) {
    return this.prisma.userNotificationDeliveryAttempt.create({
      data: {
        notificationId: input.notificationId,
        userId: input.userId,
        channel: input.channel,
        maxAttempts: input.maxAttempts ?? 3,
        nextAttemptAt: input.nextAttemptAt,
        emailDestinationId: input.emailDestinationId,
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

  private async queueEmailDeliveryIfEligible(
    notification: {
      id: string;
      userId: string;
      type: UserNotificationType;
    },
    preferences: UserNotificationPreference,
  ) {
    if (
      !preferences.emailEnabled ||
      !this.typeEnabled(preferences, notification.type)
    ) {
      return;
    }
    const destination =
      await this.prisma.userEmailNotificationDestination.findFirst({
        where: {
          userId: notification.userId,
          status: 'verified',
        },
      });
    if (!destination) {
      return;
    }
    await this.createDeliveryAttempt({
      notificationId: notification.id,
      userId: notification.userId,
      channel: 'email',
      emailDestinationId: destination.id,
    });
  }

  private async hasVerifiedEmailDestination(userId: string) {
    const count = await this.prisma.userEmailNotificationDestination.count({
      where: { userId, status: 'verified' },
    });
    return count > 0;
  }

  private unsubscribePreferencePatch(category: EmailUnsubscribeCategory) {
    if (category === 'all') {
      return { emailEnabled: false };
    }
    if (category === 'price_drop') {
      return { priceDropsEnabled: false };
    }
    if (category === 'receipt_outcome') {
      return { receiptOutcomesEnabled: false };
    }
    return { optimizationReadyEnabled: false };
  }

  private toEmailDestinationResponse(
    destination: UserEmailNotificationDestination,
    tokens: { verificationToken?: string; unsubscribeToken?: string } = {},
  ) {
    return {
      id: destination.id,
      email: destination.email,
      status: destination.status,
      verifiedAt: destination.verifiedAt,
      unsubscribedAt: destination.unsubscribedAt,
      verificationToken:
        process.env.NODE_ENV === 'production'
          ? undefined
          : tokens.verificationToken,
      unsubscribeToken:
        process.env.NODE_ENV === 'production' ? undefined : tokens.unsubscribeToken,
    };
  }

  private normalizeEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      throw new BadRequestException('Email invalido');
    }
    return normalizedEmail;
  }

  private createToken() {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token.trim()).digest('hex');
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
