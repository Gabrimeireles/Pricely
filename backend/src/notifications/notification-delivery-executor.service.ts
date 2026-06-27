import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type UserEmailNotificationDestination,
  type UserNotification,
  type UserNotificationDeliveryAttempt,
  type UserPushDevice,
} from '@prisma/client';

import { PrismaService } from '../persistence/prisma.service';
import {
  NOTIFICATION_DELIVERY_PROVIDER,
  type NotificationDeliveryProvider,
  type NotificationDeliveryRequest,
} from './notification-delivery.provider';
import { NotificationsService } from './notifications.service';

type DeliveryAttemptWithTargets = UserNotificationDeliveryAttempt & {
  notification: UserNotification;
  emailDestination: UserEmailNotificationDestination | null;
  pushDevice: UserPushDevice | null;
};

export interface NotificationDeliveryExecutionSummary {
  processed: number;
  delivered: number;
  retrying: number;
  failed: number;
  skipped: number;
}

@Injectable()
export class NotificationDeliveryExecutorService {
  private readonly logger = new Logger(NotificationDeliveryExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    @Inject(NOTIFICATION_DELIVERY_PROVIDER)
    private readonly provider: NotificationDeliveryProvider,
  ) {}

  async processDueAttempts(input: { take?: number; now?: Date } = {}) {
    const now = input.now ?? new Date();
    const attempts = await this.prisma.userNotificationDeliveryAttempt.findMany({
      where: {
        status: { in: ['queued', 'retrying'] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      include: {
        notification: true,
        emailDestination: true,
        pushDevice: true,
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      take: input.take ?? 25,
    });

    const summary: NotificationDeliveryExecutionSummary = {
      processed: attempts.length,
      delivered: 0,
      retrying: 0,
      failed: 0,
      skipped: 0,
    };

    for (const attempt of attempts) {
      const result = await this.processAttempt(attempt);
      summary[result] += 1;
    }

    this.logger.log({
      event: 'notification_delivery_batch_processed',
      ...summary,
    });

    return summary;
  }

  async processAttempt(
    attempt: DeliveryAttemptWithTargets,
  ): Promise<'delivered' | 'retrying' | 'failed' | 'skipped'> {
    if (!['queued', 'retrying'].includes(attempt.status)) {
      return 'skipped';
    }

    const request = this.toDeliveryRequest(attempt);
    if (!request) {
      await this.notificationsService.markDeliveryFailed(attempt.id, {
        reason: 'notification_delivery_destination_unavailable',
        retryable: false,
      });
      return 'failed';
    }

    const sendingAttempt =
      await this.notificationsService.markDeliverySending(attempt.id);

    try {
      const result = await this.provider.deliver(request);
      if (!result.failureReason) {
        await this.notificationsService.markDeliveryDelivered(attempt.id, {
          providerMessageId: result.providerMessageId,
        });
        return 'delivered';
      }

      const retryable = result.retryable === true;
      await this.notificationsService.markDeliveryFailed(attempt.id, {
        reason: result.failureReason,
        retryable,
        nextAttemptAt: retryable
          ? this.nextRetryAt(sendingAttempt.attemptCount)
          : undefined,
      });
      return retryable ? 'retrying' : 'failed';
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'notification_delivery_provider_error';
      await this.notificationsService.markDeliveryFailed(attempt.id, {
        reason: message,
        retryable: true,
        nextAttemptAt: this.nextRetryAt(sendingAttempt.attemptCount),
      });
      return 'retrying';
    }
  }

  private toDeliveryRequest(
    attempt: DeliveryAttemptWithTargets,
  ): NotificationDeliveryRequest | null {
    if (attempt.channel === 'email') {
      if (
        !attempt.emailDestination ||
        attempt.emailDestination.status !== 'verified'
      ) {
        return null;
      }
      return {
        attemptId: attempt.id,
        channel: attempt.channel,
        title: attempt.notification.title,
        message: attempt.notification.message,
        destination: {
          id: attempt.emailDestination.id,
          label: this.maskEmail(attempt.emailDestination.email),
          provider: 'sandbox-email',
        },
      };
    }

    if (!attempt.pushDevice || !attempt.pushDevice.isActive) {
      return null;
    }
    return {
      attemptId: attempt.id,
      channel: attempt.channel,
      title: attempt.notification.title,
      message: attempt.notification.message,
      destination: {
        id: attempt.pushDevice.id,
        label: `${attempt.pushDevice.platform}:${this.redactTail(
          attempt.pushDevice.deviceTokenTail,
        )}`,
        provider: attempt.pushDevice.provider,
      },
      metadata: {
        notificationId: attempt.notificationId,
        resourceType: attempt.notification.resourceType,
        resourceId: attempt.notification.resourceId,
      },
    };
  }

  private nextRetryAt(attemptCount: number) {
    const delayMinutes = Math.min(60, 5 * 2 ** Math.max(attemptCount - 1, 0));
    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }

  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    if (!domain) {
      return '[email]';
    }
    return `${name.slice(0, 2)}***@${domain}`;
  }

  private redactTail(value: string) {
    return `redacted:${value.slice(-6)}`;
  }
}
