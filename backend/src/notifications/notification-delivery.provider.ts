import { type UserNotificationDeliveryChannel } from '@prisma/client';

export interface NotificationDeliveryRequest {
  attemptId: string;
  channel: UserNotificationDeliveryChannel;
  title: string;
  message: string;
  destination: {
    id: string;
    label: string;
    provider?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface NotificationDeliveryResult {
  providerMessageId?: string;
  retryable?: boolean;
  failureReason?: string;
}

export interface NotificationDeliveryProvider {
  deliver(
    request: NotificationDeliveryRequest,
  ): Promise<NotificationDeliveryResult>;
}

export const NOTIFICATION_DELIVERY_PROVIDER =
  'NOTIFICATION_DELIVERY_PROVIDER';
