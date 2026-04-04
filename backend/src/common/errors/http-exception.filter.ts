import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { DomainError } from './domain-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof DomainError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      response.status(statusCode).json({
        statusCode,
        error: payload,
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
