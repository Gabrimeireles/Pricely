import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminAccessController } from './admin-access.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminAccessController],
})
export class AdminModule {}
