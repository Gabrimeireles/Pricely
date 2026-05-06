import { LOG_REDACTION_PATHS, resolveRequestId } from '../../../src/common/logging/logging.config';

describe('logging config', () => {
  it('propagates incoming request ids to response headers', () => {
    const req = {
      headers: {
        'x-request-id': 'req-known',
      },
    };
    const res = {
      setHeader: jest.fn(),
    };

    const requestId = resolveRequestId(req as never, res as never);

    expect(requestId).toBe('req-known');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'req-known');
  });

  it('redacts auth, token, and receipt personal-data fields', () => {
    expect(LOG_REDACTION_PATHS).toEqual(
      expect.arrayContaining([
        'req.headers.authorization',
        'req.body.password',
        'req.body.accessToken',
        'req.body.cpf',
        'req.body.address',
      ]),
    );
  });
});
