import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

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

  it('notifies server errors without transmitting request payloads', async () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const incidentNotifier = {
      notify: jest.fn().mockResolvedValue({ delivered: true }),
    };
    const request = {
      url: '/admin/users/user-sensitive?token=secret',
      path: '/admin/users/user-sensitive',
      route: { path: '/admin/users/:id' },
      method: 'PATCH',
      id: 'req-server-1',
      headers: {},
      body: {
        password: 'not-for-webhook',
      },
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          status,
          setHeader: jest.fn(),
        }),
      }),
    } as ArgumentsHost;

    new HttpExceptionFilter(incidentNotifier as never).catch(
      new InternalServerErrorException(),
      host,
    );
    await Promise.resolve();

    expect(incidentNotifier.notify).toHaveBeenCalledWith({
      event: 'backend_http_server_error',
      severity: 'critical',
      summary: 'Backend request failed with a server error.',
      details: {
        method: 'PATCH',
        route: '/admin/users/:id',
        statusCode: 500,
        requestId: 'req-server-1',
      },
    });
    expect(JSON.stringify(incidentNotifier.notify.mock.calls)).not.toContain(
      'not-for-webhook',
    );
    expect(JSON.stringify(incidentNotifier.notify.mock.calls)).not.toContain(
      'secret',
    );
  });
});
