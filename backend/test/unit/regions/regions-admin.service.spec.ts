import { RegionsAdminService } from '../../../src/regions/application/regions-admin.service';

describe('RegionsAdminService', () => {
  it('returns only active establishment counts for the admin region list', async () => {
    const prisma = {
      region: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'region-2',
            slug: 'campinas-sp',
            name: 'Campinas',
            stateCode: 'SP',
            implantationStatus: 'activating',
            publicSortOrder: 0,
            _count: {
              establishments: 1,
            },
            establishments: [],
          },
          {
            id: 'region-1',
            slug: 'sao-paulo-sp',
            name: 'Sao Paulo',
            stateCode: 'SP',
            implantationStatus: 'active',
            publicSortOrder: 1,
            _count: {
              establishments: 3,
            },
            establishments: [
              {
                id: 'store-1',
                brandName: 'Mercado Azul',
                unitName: 'Unidade Pinheiros',
                neighborhood: 'Pinheiros',
                cityName: 'Sao Paulo',
                isActive: true,
                _count: {
                  productOffers: 12,
                },
              },
            ],
          },
        ]),
      },
    };

    const service = new RegionsAdminService(prisma as never);

    await expect(service.list()).resolves.toEqual([
      {
        id: 'region-1',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        implantationStatus: 'active',
        publicSortOrder: 1,
        activeEstablishmentsCount: 3,
        establishments: [
          {
            id: 'store-1',
            brandName: 'Mercado Azul',
            unitName: 'Unidade Pinheiros',
            neighborhood: 'Pinheiros',
            cityName: 'Sao Paulo',
            isActive: true,
            auditedProductsCount: 12,
          },
        ],
      },
      {
        id: 'region-2',
        slug: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
        implantationStatus: 'activating',
        publicSortOrder: 0,
        activeEstablishmentsCount: 1,
        establishments: [],
      },
    ]);

    expect(prisma.region.findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }],
      include: {
        _count: {
          select: {
            establishments: {
              where: {
                isActive: true,
              },
            },
          },
        },
        establishments: {
          orderBy: [{ unitName: 'asc' }],
          include: {
            _count: {
              select: {
                productOffers: {
                  where: {
                    isActive: true,
                    availabilityStatus: 'available',
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});
