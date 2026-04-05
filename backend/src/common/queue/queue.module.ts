import { Global, Module } from '@nestjs/common';
import { type ConnectionOptions, Queue } from 'bullmq';

import {
  createQueueConfig,
  QUEUE_CONFIG,
  QUEUE_CONNECTION,
  type QueueConfig,
} from './queue.config';
import {
  OPTIMIZATION_QUEUE,
  RECEIPT_PROCESSING_QUEUE,
} from './queue.tokens';

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_CONFIG,
      useFactory: (): QueueConfig => createQueueConfig(),
    },
    {
      provide: QUEUE_CONNECTION,
      useFactory: (config: QueueConfig): ConnectionOptions => ({
        host: config.host,
        port: config.port,
        db: config.db,
      }),
      inject: [QUEUE_CONFIG],
    },
    {
      provide: RECEIPT_PROCESSING_QUEUE,
      useFactory: (connection: ConnectionOptions): Queue =>
        new Queue('receipt-processing', { connection }),
      inject: [QUEUE_CONNECTION],
    },
    {
      provide: OPTIMIZATION_QUEUE,
      useFactory: (connection: ConnectionOptions): Queue =>
        new Queue('optimization', { connection }),
      inject: [QUEUE_CONNECTION],
    },
  ],
  exports: [
    QUEUE_CONFIG,
    QUEUE_CONNECTION,
    RECEIPT_PROCESSING_QUEUE,
    OPTIMIZATION_QUEUE,
  ],
})
export class QueueModule {}
