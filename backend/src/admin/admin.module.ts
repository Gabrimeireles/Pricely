import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../persistence/prisma.module';
import { AdminDashboardService } from './application/admin-dashboard.service';
import { AdminDashboardController } from './api/admin-dashboard.controller';
import { AdminAccessController } from './admin-access.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [AdminDashboardService],
  controllers: [AdminAccessController, AdminDashboardController],
})
export class AdminModule {}
