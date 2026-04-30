import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { type JwtUserPayload } from './auth.types';
import { UsersService } from '../users/users.service';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: await this.usersService.getProfileById(user.id),
    };
  }
}
