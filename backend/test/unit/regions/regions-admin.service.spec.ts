import { RegionsAdminService } from '../../../src/regions/application/regions-admin.service';

describe('RegionsAdminService', () => {
  it('returns only active establishment counts for the admin region list', async () => {
    const prisma = {
      region: {
        findMany: jest.fn().mockResolvedValue([
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
      },
    ]);

    expect(prisma.region.findMany).toHaveBeenCalledWith({
      orderBy: [{ publicSortOrder: 'asc' }, { name: 'asc' }],
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
      },
    });
  });
});
