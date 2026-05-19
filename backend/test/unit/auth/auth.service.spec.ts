import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '../../../src/auth/auth.service';

describe('AuthService', () => {
  it('registers a customer session with a normalized account payload', async () => {
    const usersService = {
      createCustomerAccount: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'cliente@pricely.local',
        displayName: 'Cliente Pricely',
        role: 'customer',
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date('2026-04-27T10:00:00Z'),
        updatedAt: new Date('2026-04-27T10:00:00Z'),
      }),
      getProfileById: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'cliente@pricely.local',
        displayName: 'Cliente Pricely',
        role: 'customer',
        status: 'active',
        preferredRegionSlug: null,
        lastLoginAt: null,
        createdAt: '2026-04-27T10:00:00.000Z',
        updatedAt: '2026-04-27T10:00:00.000Z',
        profileStats: {
          totalEstimatedSavings: 0,
          shoppingListsCount: 0,
          completedOptimizationRuns: 0,
          contributionsCount: 0,
          receiptSubmissionsCount: 0,
          offerReportsCount: 0,
        },
      }),
      toProfile: jest.fn().mockReturnValue({
        id: 'user-1',
        email: 'cliente@pricely.local',
        displayName: 'Cliente Pricely',
        role: 'customer',
        status: 'active',
        lastLoginAt: null,
        createdAt: '2026-04-27T10:00:00.000Z',
        updatedAt: '2026-04-27T10:00:00.000Z',
        profileStats: {
          totalEstimatedSavings: 0,
          shoppingListsCount: 0,
          completedOptimizationRuns: 0,
          contributionsCount: 0,
          receiptSubmissionsCount: 0,
          offerReportsCount: 0,
        },
      }),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as JwtService;
    const prisma = {
      userSession: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const service = new AuthService(
      usersService as never,
      jwtService,
      prisma as never,
    );

    await expect(
      service.register({
        email: ' Cliente@Pricely.Local ',
        password: 'strong-password',
        displayName: 'Cliente Pricely',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        accessToken: 'signed-token',
        accessTokenExpiresInSeconds: 900,
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: 'cliente@pricely.local',
        }),
      }),
    );

    expect(usersService.createCustomerAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: ' Cliente@Pricely.Local ',
        displayName: 'Cliente Pricely',
        passwordHash: expect.any(String),
      }),
    );
    expect(usersService.getProfileById).toHaveBeenCalledWith('user-1');
  });

  it('rejects login when the password does not match', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'cliente@pricely.local',
        passwordHash: '$2a$10$w0VhJnJ8L4JwP5cYk0VCAe0xq1Y1Qz4d5mVwK0V0gRz7X7h7lFQTu',
        displayName: 'Cliente',
        role: 'customer',
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date('2026-04-27T10:00:00Z'),
        updatedAt: new Date('2026-04-27T10:00:00Z'),
      }),
      markSuccessfulLogin: jest.fn(),
      toProfile: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const prisma = {
      userSession: {
        create: jest.fn(),
      },
    };

    const service = new AuthService(
      usersService as never,
      jwtService,
      prisma as never,
    );

    await expect(
      service.login({
        email: 'cliente@pricely.local',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.markSuccessfulLogin).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(prisma.userSession.create).not.toHaveBeenCalled();
  });

  it('rotates refresh sessions and rejects reuse of revoked tokens', async () => {
    const usersService = {
      getProfileById: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'cliente@pricely.local',
        displayName: 'Cliente',
        role: 'customer',
        status: 'active',
      }),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('new-access-token'),
    } as unknown as JwtService;
    const session = {
      id: 'session-1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        email: 'cliente@pricely.local',
        displayName: 'Cliente',
        role: 'customer',
        status: 'active',
        preferredRegionId: null,
        lastLoginAt: null,
        createdAt: new Date('2026-04-27T10:00:00Z'),
        updatedAt: new Date('2026-04-27T10:00:00Z'),
      },
    };
    const prisma = {
      userSession: {
        findUnique: jest.fn().mockResolvedValue(session),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new AuthService(
      usersService as never,
      jwtService,
      prisma as never,
    );

    await expect(service.refresh('refresh-token')).resolves.toEqual(
      expect.objectContaining({
        accessToken: 'new-access-token',
        refreshToken: expect.any(String),
      }),
    );

    expect(prisma.userSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.userSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        refreshTokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });

    prisma.userSession.findUnique.mockResolvedValue({
      ...session,
      revokedAt: new Date(),
    });

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
