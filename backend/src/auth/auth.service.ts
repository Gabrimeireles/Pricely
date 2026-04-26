import {
  Injectable,
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

    return this.buildSession(user);
  }

  async login(input: LoginDto) {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const updatedUser = await this.usersService.markSuccessfulLogin(user.id);
    return this.buildSession(updatedUser);
  }

  async getCurrentUser(userId: string) {
    return this.usersService.getProfileById(userId);
  }

  private async buildSession(user: {
    id: string;
    email: string;
    displayName: string;
    role: 'customer' | 'admin';
    status: 'active' | 'suspended';
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
      user: this.usersService.toProfile(user),
    };
  }
}
