import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { HttpExceptionFilter } from './common/errors/http-exception.filter';
import { AppValidationPipe } from './common/validation/validation.pipe';
import { AppModule } from './app.module';

loadEnv();

const localWebOrigins = [
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsOrigins(): string[] {
  const configuredOrigins = [
    ...(process.env.CORS_ALLOWED_ORIGINS ?? '').split(','),
    process.env.WEB_APP_URL,
  ];

  return Array.from(
    new Set(
      [...configuredOrigins, ...localWebOrigins]
        .map((origin) => origin?.trim())
        .filter((origin): origin is string => Boolean(origin)),
    ),
  );
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(
    Number(process.env.PORT || 3000),
    process.env.APP_HOST || '0.0.0.0',
  );
}

void bootstrap();
