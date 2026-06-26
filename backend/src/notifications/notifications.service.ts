import { randomBytes, createHash } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type Prisma,
  type UserEmailNotificationDestination,
  type UserNotificationDeliveryChannel,
  type UserNotificationDeliveryStatus,
  type UserNotificationPreference,
  type UserNotificationType,
  type UserPushDevicePlatform,
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
      pushEnabled?: boolean;
      quietHoursEnabled?: boolean;
      quietHoursStartMinute?: number | null;
      quietHoursEndMinute?: number | null;
      quietHoursTimezone?: string | null;
    },
  ) {
    const emailEnabled =
      input.emailEnabled === true
        ? await this.hasVerifiedEmailDestination(userId)
        : input.emailEnabled;
    const pushEnabled =
      input.pushEnabled === true
        ? await this.hasActivePushDevice(userId)
        : input.pushEnabled;
    const quietHoursPatch = this.normalizeQuietHoursPatch(input);

    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
        ...quietHoursPatch,
        emailEnabled: emailEnabled ?? false,
        pushEnabled: pushEnabled ?? false,
      },
      update: {
        ...input,
        ...quietHoursPatch,
        emailEnabled,
        pushEnabled,
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

  async listPushDevices(userId: string) {
    return this.prisma.userPushDevice.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { lastSeenAt: 'desc' }],
      select: {
        id: true,
        platform: true,
        provider: true,
        deviceTokenTail: true,
        appVersion: true,
        locale: true,
        timezone: true,
        isActive: true,
        revokedAt: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async registerPushDevice(
    userId: string,
    input: {
      platform: UserPushDevicePlatform;
      deviceToken: string;
      provider?: string;
      appVersion?: string;
      locale?: string;
      timezone?: string;
    },
  ) {
    const deviceToken = input.deviceToken.trim();
    if (deviceToken.length < 16) {
      throw new BadRequestException('Token de push invalido');
    }

    const now = new Date();
    const device = await this.prisma.userPushDevice.upsert({
      where: { deviceTokenHash: this.hashToken(deviceToken) },
      create: {
        userId,
        platform: input.platform,
        deviceTokenHash: this.hashToken(deviceToken),
        deviceTokenTail: deviceToken.slice(-12),
        provider: input.provider?.trim() || 'fcm',
        appVersion: input.appVersion,
        locale: input.locale,
        timezone: input.timezone,
        isActive: true,
        revokedAt: null,
        lastSeenAt: now,
      },
      update: {
        userId,
        platform: input.platform,
        deviceTokenTail: deviceToken.slice(-12),
        provider: input.provider?.trim() || 'fcm',
        appVersion: input.appVersion,
        locale: input.locale,
        timezone: input.timezone,
        isActive: true,
        revokedAt: null,
        lastSeenAt: now,
      },
    });
    await this.updatePreferences(userId, { pushEnabled: true });
    return device;
  }

  async revokePushDevice(userId: string, deviceId: string) {
    const device = await this.prisma.userPushDevice.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) {
      throw new NotFoundException('Dispositivo de push nao encontrado');
    }

    const updated = await this.prisma.userPushDevice.update({
      where: { id: device.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
    const hasActiveDevice = await this.hasActivePushDevice(userId);
    if (!hasActiveDevice) {
      await this.updatePreferences(userId, { pushEnabled: false });
    }
    return updated;
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
    await this.queuePushDeliveryIfEligible(notification, preferences);
    return notification;
  }

  async createDeliveryAttempt(input: {
    notificationId: string;
    userId: string;
    channel: UserNotificationDeliveryChannel;
    maxAttempts?: number;
    nextAttemptAt?: Date;
    emailDestinationId?: string;
    pushDeviceId?: string;
  }) {
    return this.prisma.userNotificationDeliveryAttempt.create({
      data: {
        notificationId: input.notificationId,
        userId: input.userId,
        channel: input.channel,
        maxAttempts: input.maxAttempts ?? 3,
        nextAttemptAt: input.nextAttemptAt,
        emailDestinationId: input.emailDestinationId,
        pushDeviceId: input.pushDeviceId,
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

  async retryDeliveryAttempt(attemptId: string) {
    const attempt = await this.findDeliveryAttempt(attemptId);
    if (!['failed', 'retrying'].includes(attempt.status)) {
      throw new BadRequestException(
        'Apenas entregas com falha ou retry podem ser reenfileiradas',
      );
    }
    if (attempt.attemptCount >= attempt.maxAttempts) {
      throw new BadRequestException('Limite de tentativas ja foi atingido');
    }
    return this.prisma.userNotificationDeliveryAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'queued',
        lastFailureReason: null,
        terminalFailureReason: null,
        nextAttemptAt: new Date(),
      },
    });
  }

  async cancelDeliveryAttempt(attemptId: string, reason?: string) {
    const attempt = await this.findDeliveryAttempt(attemptId);
    if (!['queued', 'retrying'].includes(attempt.status)) {
      throw new BadRequestException(
        'Apenas entregas aguardando envio podem ser canceladas',
      );
    }
    return this.prisma.userNotificationDeliveryAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'cancelled',
        nextAttemptAt: null,
        terminalFailureReason: (reason ?? 'admin_cancelled').slice(0, 500),
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
      nextAttemptAt: this.resolveQuietHoursNextAttemptAt(preferences),
    });
  }

  private async queuePushDeliveryIfEligible(
    notification: {
      id: string;
      userId: string;
      type: UserNotificationType;
    },
    preferences: UserNotificationPreference,
  ) {
    if (
      !preferences.pushEnabled ||
      !this.typeEnabled(preferences, notification.type)
    ) {
      return;
    }

    const devices = await this.prisma.userPushDevice.findMany({
      where: {
        userId: notification.userId,
        isActive: true,
      },
      take: 10,
      orderBy: { lastSeenAt: 'desc' },
    });

    await Promise.all(
      devices.map((device) =>
        this.createDeliveryAttempt({
          notificationId: notification.id,
          userId: notification.userId,
          channel: 'push',
          pushDeviceId: device.id,
          nextAttemptAt: this.resolveQuietHoursNextAttemptAt(preferences),
        }),
      ),
    );
  }

  private normalizeQuietHoursPatch(input: {
    quietHoursEnabled?: boolean;
    quietHoursStartMinute?: number | null;
    quietHoursEndMinute?: number | null;
    quietHoursTimezone?: string | null;
  }) {
    const patch: {
      quietHoursEnabled?: boolean;
      quietHoursStartMinute?: number | null;
      quietHoursEndMinute?: number | null;
      quietHoursTimezone?: string | null;
    } = {};

    if (input.quietHoursEnabled !== undefined) {
      patch.quietHoursEnabled = input.quietHoursEnabled;
      if (input.quietHoursEnabled) {
        patch.quietHoursStartMinute = input.quietHoursStartMinute ?? 22 * 60;
        patch.quietHoursEndMinute = input.quietHoursEndMinute ?? 7 * 60;
        patch.quietHoursTimezone =
          this.normalizeTimezone(input.quietHoursTimezone) ??
          'America/Sao_Paulo';
      }
    }
    if (input.quietHoursStartMinute !== undefined) {
      patch.quietHoursStartMinute = input.quietHoursStartMinute;
    }
    if (input.quietHoursEndMinute !== undefined) {
      patch.quietHoursEndMinute = input.quietHoursEndMinute;
    }
    if (input.quietHoursTimezone !== undefined) {
      patch.quietHoursTimezone = this.normalizeTimezone(
        input.quietHoursTimezone,
      );
    }

    return patch;
  }

  private resolveQuietHoursNextAttemptAt(
    preferences: Pick<
      UserNotificationPreference,
      | 'quietHoursEnabled'
      | 'quietHoursStartMinute'
      | 'quietHoursEndMinute'
      | 'quietHoursTimezone'
    >,
    now = new Date(),
  ) {
    if (!preferences.quietHoursEnabled) {
      return undefined;
    }
    const startMinute = preferences.quietHoursStartMinute ?? 22 * 60;
    const endMinute = preferences.quietHoursEndMinute ?? 7 * 60;
    if (startMinute === endMinute) {
      return undefined;
    }
    const timezone = preferences.quietHoursTimezone ?? 'America/Sao_Paulo';
    const localMinute = this.localMinuteOfDay(now, timezone);
    const minutes = this.minutesUntilQuietHoursEnd(
      startMinute,
      endMinute,
      localMinute,
    );
    if (minutes <= 0) {
      return undefined;
    }
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  private minutesUntilQuietHoursEnd(
    startMinute: number,
    endMinute: number,
    currentMinute: number,
  ) {
    if (startMinute < endMinute) {
      return currentMinute >= startMinute && currentMinute < endMinute
        ? endMinute - currentMinute
        : 0;
    }
    if (currentMinute >= startMinute) {
      return 1440 - currentMinute + endMinute;
    }
    if (currentMinute < endMinute) {
      return endMinute - currentMinute;
    }
    return 0;
  }

  private localMinuteOfDay(date: Date, timezone: string) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date);
      const hour = Number(parts.find((part) => part.type === 'hour')?.value);
      const minute = Number(
        parts.find((part) => part.type === 'minute')?.value,
      );
      if (Number.isFinite(hour) && Number.isFinite(minute)) {
        return (hour % 24) * 60 + minute;
      }
    } catch {
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    }
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }

  private async hasVerifiedEmailDestination(userId: string) {
    const count = await this.prisma.userEmailNotificationDestination.count({
      where: { userId, status: 'verified' },
    });
    return count > 0;
  }

  private async hasActivePushDevice(userId: string) {
    const count = await this.prisma.userPushDevice.count({
      where: { userId, isActive: true },
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

  private normalizeTimezone(timezone?: string | null) {
    if (timezone === null) {
      return null;
    }
    const normalizedTimezone = timezone?.trim();
    if (!normalizedTimezone) {
      return undefined;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: normalizedTimezone });
      return normalizedTimezone;
    } catch {
      throw new BadRequestException('Timezone invalido');
    }
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
