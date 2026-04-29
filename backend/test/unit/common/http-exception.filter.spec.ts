import { ArgumentsHost, BadRequestException } from '@nestjs/common';

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
});
