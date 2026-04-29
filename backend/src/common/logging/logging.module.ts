import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        genReqId: (req, res) => {
          const incoming = req.headers['x-request-id'];
          const requestId =
            (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
          res.setHeader('x-request-id', requestId);
          return requestId;
        },
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
        redact: ['req.headers.authorization'],
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
