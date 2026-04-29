import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { EstablishmentsModule } from '../establishments/establishments.module';
import { PrismaModule } from '../persistence/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { RegionsModule } from '../regions/regions.module';
import { AdminDashboardService } from './application/admin-dashboard.service';
import { AdminDashboardController } from './api/admin-dashboard.controller';
import { AdminAccessController } from './admin-access.controller';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    EstablishmentsModule,
    CatalogModule,
    PricingModule,
    RegionsModule,
  ],
  providers: [AdminDashboardService],
  controllers: [AdminAccessController, AdminDashboardController],
})
export class AdminModule {}
