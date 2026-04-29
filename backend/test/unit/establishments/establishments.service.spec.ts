import { EstablishmentsService } from '../../../src/establishments/application/establishments.service';

describe('EstablishmentsService', () => {
  it('lists establishments ordered by city and unit name with region context', async () => {
    const prisma = {
      establishment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'est-1',
            brandName: 'Mercado Azul',
            unitName: 'Unidade Centro',
            cnpj: '00.000.000/0001-00',
            cityName: 'Campinas',
            neighborhood: 'Centro',
            regionId: 'region-1',
            isActive: true,
            region: {
              id: 'region-1',
              slug: 'campinas-sp',
              name: 'Campinas',
              stateCode: 'SP',
            },
          },
        ]),
      },
    };

    const service = new EstablishmentsService(prisma as never);

    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'est-1',
        cityName: 'Campinas',
        unitName: 'Unidade Centro',
        region: expect.objectContaining({
          slug: 'campinas-sp',
        }),
      }),
    ]);
    expect(prisma.establishment.findMany).toHaveBeenCalledWith({
      include: {
        region: true,
      },
      orderBy: [{ cityName: 'asc' }, { unitName: 'asc' }],
    });
  });

  it('creates and updates establishments with explicit active-state handling', async () => {
    const prisma = {
      establishment: {
        create: jest.fn().mockResolvedValue({
          id: 'est-1',
          brandName: 'Mercado Azul',
          unitName: 'Unidade Centro',
          cnpj: '00.000.000/0001-00',
          cityName: 'Campinas',
          neighborhood: 'Centro',
          regionId: 'region-1',
          isActive: true,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'est-1',
          isActive: false,
        }),
      },
    };

    const service = new EstablishmentsService(prisma as never);

    await service.create({
      brandName: 'Mercado Azul',
      unitName: 'Unidade Centro',
      cnpj: '00.000.000/0001-00',
      cityName: 'Campinas',
      neighborhood: 'Centro',
      regionId: 'region-1',
    });
    await service.update('est-1', { isActive: false });

    expect(prisma.establishment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isActive: true,
      }),
    });
    expect(prisma.establishment.update).toHaveBeenCalledWith({
      where: { id: 'est-1' },
      data: { isActive: false },
    });
  });
});
