import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma.module';
import { EntitlementsService } from './entitlements.service';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, EntitlementsService],
  exports: [UsersService, EntitlementsService],
})
export class UsersModule {}
