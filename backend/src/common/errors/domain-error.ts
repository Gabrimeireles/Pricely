export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code = 'domain_error',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
