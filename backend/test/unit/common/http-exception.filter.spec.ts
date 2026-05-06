import { ArgumentsHost, BadRequestException } from '@nestjs/common';

import { DomainError } from '../../../src/common/errors/domain-error';
import { HttpExceptionFilter } from '../../../src/common/errors/http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('includes the request id in error payloads and headers', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const setHeader = jest.fn();
    const request = {
      url: '/auth/login',
      method: 'POST',
      id: 'req-test-123',
      headers: {
        'x-request-id': 'req-test-123',
      },
    };
    const response = {
      status,
      setHeader,
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    new HttpExceptionFilter().catch(new BadRequestException('invalid'), host);

    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'req-test-123');
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/auth/login',
        requestId: 'req-test-123',
      }),
    );
  });

  it('classifies domain errors as bad requests with stable error codes', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const setHeader = jest.fn();
    const request = {
      url: '/shopping-lists',
      method: 'POST',
      id: 'req-domain-1',
      headers: {},
    };
    const response = {
      status,
      setHeader,
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    new HttpExceptionFilter().catch(
      new DomainError('List limit reached', 'LIST_LIMIT'),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'LIST_LIMIT',
        message: 'List limit reached',
        requestId: 'req-domain-1',
      }),
    );
  });
});
