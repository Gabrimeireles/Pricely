import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma.module';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
