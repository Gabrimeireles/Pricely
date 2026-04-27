import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from '../../../src/common/auth/roles.guard';

describe('RolesGuard', () => {
  const buildContext = (role?: 'customer' | 'admin') =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { id: 'user-1', role } : undefined,
        }),
      }),
    }) as never;

  it('allows access when no role metadata is declared', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext('customer'))).toBe(true);
  });

  it('allows access when the authenticated user has the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext('admin'))).toBe(true);
  });

  it('rejects access when the authenticated user does not have the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(buildContext('customer'))).toThrow(
      ForbiddenException,
    );
  });
});
