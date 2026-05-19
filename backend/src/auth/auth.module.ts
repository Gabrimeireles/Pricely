import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RolesGuard } from '../common/auth/roles.guard';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

function resolveJwtSecret(): string {
  return process.env.JWT_ACCESS_SECRET ?? 'changeme-local-secret';
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: resolveJwtSecret(),
        signOptions: {
          expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? 900),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy, RolesGuard],
})
export class AuthModule {}
