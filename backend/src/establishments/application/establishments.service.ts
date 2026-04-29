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
    cityName: string;
    neighborhood: string;
    regionId: string;
    isActive?: boolean;
  }) {
    return this.prisma.establishment.create({
      data: {
        ...input,
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
    return this.prisma.establishment.update({
      where: { id },
      data: input,
    });
  }
}
