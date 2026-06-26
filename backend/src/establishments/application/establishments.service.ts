import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class EstablishmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.establishment.findMany({
      include: {
        region: true,
      },
      orderBy: [{ cityName: 'asc' }, { unitName: 'asc' }],
    });
  }

  async countActiveByRegion(regionId: string) {
    return this.prisma.establishment.count({
      where: {
        regionId,
        isActive: true,
      },
    });
  }

  async create(input: {
    brandName: string;
    unitName: string;
    cnpj: string;
    cityName?: string;
    neighborhood: string;
    regionId: string;
    isActive?: boolean;
  }) {
    const region = await this.prisma.region.findUnique({
      where: { id: input.regionId },
      select: { name: true },
    });

    return this.prisma.establishment.create({
      data: {
        ...input,
        cityName: input.cityName ?? region?.name ?? '',
        isActive: input.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    input: Partial<{
      brandName: string;
      unitName: string;
      cnpj: string;
      cityName: string;
      neighborhood: string;
      regionId: string;
      isActive: boolean;
    }>,
  ) {
    const region = input.regionId
      ? await this.prisma.region.findUnique({
          where: { id: input.regionId },
          select: { name: true },
        })
      : null;

    return this.prisma.establishment.update({
      where: { id },
      data: {
        ...input,
        cityName: input.cityName ?? region?.name,
      },
    });
  }
}
