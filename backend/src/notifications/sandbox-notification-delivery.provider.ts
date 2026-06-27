import { Injectable, Logger } from '@nestjs/common';

import {
  type NotificationDeliveryProvider,
  type NotificationDeliveryRequest,
  type NotificationDeliveryResult,
} from './notification-delivery.provider';

@Injectable()
export class SandboxNotificationDeliveryProvider
  implements NotificationDeliveryProvider
{
  private readonly logger = new Logger(SandboxNotificationDeliveryProvider.name);

  async deliver(
    request: NotificationDeliveryRequest,
  ): Promise<NotificationDeliveryResult> {
    this.logger.log({
      event: 'notification_delivery_sandbox_send',
      attemptId: request.attemptId,
      channel: request.channel,
      destinationId: request.destination.id,
      destinationLabel: request.destination.label,
      provider: request.destination.provider ?? 'sandbox',
    });

    return {
      providerMessageId: `sandbox-${request.channel}-${request.attemptId}`,
    };
  }
}
