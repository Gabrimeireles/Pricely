import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import {
  LOG_REDACTION_PATHS,
  resolveRequestId,
} from './logging.config';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        genReqId: resolveRequestId,
        customProps: (req) => ({
          requestId: req.id,
        }),
        transport:
          process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,
        redact: LOG_REDACTION_PATHS,
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
