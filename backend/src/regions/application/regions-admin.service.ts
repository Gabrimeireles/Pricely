import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class RegionsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const regions = await this.prisma.region.findMany({
      orderBy: [{ publicSortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            establishments: true,
          },
        },
      },
    });

    return regions.map((region) => ({
      id: region.id,
      slug: region.slug,
      name: region.name,
      stateCode: region.stateCode,
      implantationStatus: region.implantationStatus,
      publicSortOrder: region.publicSortOrder,
      establishmentsCount: region._count.establishments,
    }));
  }

  async create(input: {
    slug: string;
    name: string;
    stateCode: string;
    implantationStatus: 'active' | 'activating' | 'inactive';
    publicSortOrder?: number;
  }) {
    return this.prisma.region.create({
      data: {
        slug: input.slug,
        name: input.name,
        stateCode: input.stateCode,
        implantationStatus: input.implantationStatus,
        publicSortOrder: input.publicSortOrder ?? 0,
      },
    });
  }

  async update(
    id: string,
    input: Partial<{
      slug: string;
      name: string;
      stateCode: string;
      implantationStatus: 'active' | 'activating' | 'inactive';
      publicSortOrder: number;
    }>,
  ) {
    return this.prisma.region.update({
      where: { id },
      data: input,
    });
  }
}
