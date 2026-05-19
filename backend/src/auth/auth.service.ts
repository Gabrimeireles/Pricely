import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { type JwtUserPayload } from './auth.types';
import { UsersService } from '../users/users.service';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';
import { PrismaService } from '../persistence/prisma.service';

const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: RegisterDto) {
    const passwordHash = await hash(input.password, 10);
    const user = await this.usersService.createCustomerAccount({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    this.logger.log(`Registered shared account ${user.id} (${user.email})`);

    return this.buildSession(user);
  }

  async login(input: LoginDto) {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      this.logger.warn(`Rejected login for unknown email ${input.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      this.logger.warn(`Rejected login for user ${user.id}: invalid password`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const updatedUser = await this.usersService.markSuccessfulLogin(user.id);
    this.logger.log(`Authenticated user ${updatedUser.id}`);
    return this.buildSession(updatedUser);
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh session is required');
    }

    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: {
        refreshTokenHash: tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.user.status !== 'active'
    ) {
      throw new UnauthorizedException('Refresh session is no longer valid');
    }

    await this.prisma.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Rotated refresh session ${session.id} for user ${session.userId}`);
    return this.buildSession(session.user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { status: 'ok' };
    }

    await this.prisma.userSession.updateMany({
      where: {
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { status: 'ok' };
  }

  async getCurrentUser(userId: string) {
    return this.usersService.getProfileById(userId);
  }

  async updatePreferredRegion(userId: string, regionSlug: string) {
    this.logger.log(`Updating preferred region for user ${userId} to ${regionSlug}`);
    return this.usersService.updatePreferredRegionBySlug(userId, regionSlug);
  }

  private async buildSession(user: {
    id: string;
    email: string;
    displayName: string;
    role: 'customer' | 'admin';
    status: 'active' | 'suspended';
    preferredRegionId?: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const payload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshToken = this.createRefreshToken();
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: this.refreshTokenExpiresAt(),
      },
    });

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      }),
      accessTokenExpiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      refreshToken,
      user: await this.usersService.getProfileById(user.id),
    };
  }

  private createRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private refreshTokenExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
    return expiresAt;
  }
}
