import { Injectable, Logger } from '@nestjs/common';

import { type CreateCityInclusionRequestContract } from '../../common/contracts';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class PublicRegionsService {
  private readonly logger = new Logger(PublicRegionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listVisibleRegions() {
    const regions = await this.prisma.region.findMany({
      where: {
        implantationStatus: {
          not: 'inactive',
        },
      },
      orderBy: [{ publicSortOrder: 'asc' }, { name: 'asc' }],
      include: {
        establishments: {
          where: {
            isActive: true,
          },
          include: {
            productOffers: {
              where: {
                isActive: true,
                availabilityStatus: 'available',
              },
            },
          },
        },
      },
    });

    const projectedRegions = regions.map((region) => {
      const activeEstablishmentCount = region.establishments.length;
      const liveOffersCount = region.establishments.reduce(
        (count, establishment) => count + establishment.productOffers.length,
        0,
      );

      return {
        id: region.id,
        slug: region.slug,
        name: region.name,
        stateCode: region.stateCode,
        implantationStatus: region.implantationStatus,
        activeEstablishmentCount,
        offerCoverageStatus: liveOffersCount > 0 ? 'live' : 'collecting_data',
        establishments: region.establishments.map((establishment) => ({
          id: establishment.id,
          brandName: establishment.brandName,
          unitName: establishment.unitName,
          neighborhood: establishment.neighborhood,
          cityName: establishment.cityName,
          offerCount: establishment.productOffers.length,
        })),
      };
    });

    this.logger.log(
      `Public regions requested: ${projectedRegions.length} regions visible`,
    );

    const zeroStoreRegions = projectedRegions.filter(
      (region) => region.activeEstablishmentCount === 0,
    ).length;
    if (zeroStoreRegions > 0) {
      this.logger.warn(
        `Public regions response contains ${zeroStoreRegions} zero-store regions`,
      );
    }

    return projectedRegions;
  }

  async getPublicImpact() {
    const [aggregatedSavings, optimizedListsCount] = await Promise.all([
      this.prisma.optimizationRun.aggregate({
        where: {
          status: 'completed',
        },
        _sum: {
          estimatedSavings: true,
        },
      }),
      this.prisma.optimizationRun.count({
        where: {
          status: 'completed',
        },
      }),
    ]);

    const impact = {
      totalEstimatedSavings: Number(
        aggregatedSavings._sum.estimatedSavings ?? 0,
      ),
      optimizedListsCount,
    };

    this.logger.log(
      `Public impact requested: savings=${impact.totalEstimatedSavings}, optimizedLists=${impact.optimizedListsCount}`,
    );

    return impact;
  }

  async requestCityInclusion(input: CreateCityInclusionRequestContract) {
    const request = await this.prisma.cityInclusionRequest.create({
      data: {
        cityName: input.cityName.trim(),
        stateCode: input.stateCode.trim().toUpperCase(),
        contactName: input.contactName?.trim(),
        contactEmail: input.contactEmail?.trim().toLowerCase(),
        message: input.message?.trim(),
      },
    });

    this.logger.log(
      `City inclusion requested: ${request.cityName}-${request.stateCode}`,
    );

    return {
      id: request.id,
      cityName: request.cityName,
      stateCode: request.stateCode,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }
}
