import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module';
import { NotificationDeliveryExecutorService } from './notification-delivery-executor.service';
import { NOTIFICATION_DELIVERY_PROVIDER } from './notification-delivery.provider';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SandboxNotificationDeliveryProvider } from './sandbox-notification-delivery.provider';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDeliveryExecutorService,
    SandboxNotificationDeliveryProvider,
    {
      provide: NOTIFICATION_DELIVERY_PROVIDER,
      useExisting: SandboxNotificationDeliveryProvider,
    },
  ],
  exports: [NotificationsService, NotificationDeliveryExecutorService],
})
export class NotificationsModule {}
