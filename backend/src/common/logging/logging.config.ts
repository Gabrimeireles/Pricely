import { randomUUID } from 'node:crypto';
import { type IncomingMessage, type ServerResponse } from 'node:http';

export const LOG_REDACTION_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.body.password',
  'req.body.passwordHash',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.cpf',
  'req.body.name',
  'req.body.address',
  'req.body.endereco',
  'res.headers["set-cookie"]',
];

export function resolveRequestId(
  req: IncomingMessage,
  res: ServerResponse,
): string {
  const incoming = req.headers['x-request-id'];
  const requestId =
    (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();

  res.setHeader('x-request-id', requestId);

  return requestId;
}
