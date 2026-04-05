import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { HttpExceptionFilter } from './common/errors/http-exception.filter';
import { AppValidationPipe } from './common/validation/validation.pipe';
import { AppModule } from './app.module';

loadEnv();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(Number(process.env.PORT || 3000));
}

void bootstrap();
