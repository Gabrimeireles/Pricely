import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { DomainError } from './domain-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { id?: string }>();
    const requestId =
      request.id ||
      (Array.isArray(request.headers['x-request-id'])
        ? request.headers['x-request-id'][0]
        : request.headers['x-request-id']) ||
      'unknown';
    response.setHeader('x-request-id', requestId);

    if (exception instanceof DomainError) {
      this.logger.warn(
        `[${requestId}] Domain error on ${request.method} ${request.url}: ${exception.code}`,
      );
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        path: request.url,
        requestId,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();
      const logLine = `[${requestId}] HTTP ${statusCode} on ${request.method} ${request.url}`;
      if (statusCode >= 500) {
        this.logger.error(logLine);
      } else {
        this.logger.warn(logLine);
      }

      response.status(statusCode).json({
        statusCode,
        error: payload,
        path: request.url,
        requestId,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    if (exception instanceof Error) {
      this.logger.error(
        `[${requestId}] Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
