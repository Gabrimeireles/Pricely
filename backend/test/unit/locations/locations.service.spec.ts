import { BadRequestException } from '@nestjs/common';

import { LocationsService } from '../../../src/locations/application/locations.service';

describe('LocationsService', () => {
  it('previews coverage with default 5 km radius and coordinates', async () => {
    const prisma = {
      establishment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'store-near',
            brandName: 'Mercado Azul',
            unitName: 'Unidade Pinheiros',
            neighborhood: 'Pinheiros',
            postalCode: '05422-001',
            latitude: { toString: () => '-23.566263' },
            longitude: { toString: () => '-46.683677' },
          },
          {
            id: 'store-far',
            brandName: 'Mercado Verde',
            unitName: 'Unidade Campinas',
            neighborhood: 'Centro',
            postalCode: '13010-000',
            latitude: { toString: () => '-22.905600' },
            longitude: { toString: () => '-47.060800' },
          },
        ]),
      },
    };

    const service = new LocationsService(prisma as never);
    const preview = await service.previewCoverage({
      regionId: 'region-1',
      latitude: -23.566,
      longitude: -46.684,
    });

    expect(prisma.establishment.findMany).toHaveBeenCalledWith({
      where: {
        regionId: 'region-1',
        isActive: true,
      },
      orderBy: [{ brandName: 'asc' }, { unitName: 'asc' }],
    });
    expect(preview.coverageRadiusKm).toBe(5);
    expect(preview.activeEstablishmentCount).toBe(1);
    expect(preview.fallbackUsed).toBe(false);
    expect(preview.establishments[0]).toEqual(
      expect.objectContaining({
        id: 'store-near',
        distanceKm: expect.any(Number),
      }),
    );
  });

  it('sorts covered establishments by distance and honors the requested radius', async () => {
    const prisma = {
      establishment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'store-farther',
            brandName: 'Mercado B',
            unitName: 'Unidade B',
            neighborhood: 'Pinheiros',
            postalCode: '05422-020',
            latitude: { toString: () => '-23.575200' },
            longitude: { toString: () => '-46.690400' },
          },
          {
            id: 'store-nearest',
            brandName: 'Mercado A',
            unitName: 'Unidade A',
            neighborhood: 'Pinheiros',
            postalCode: '05422-001',
            latitude: { toString: () => '-23.566263' },
            longitude: { toString: () => '-46.683677' },
          },
          {
            id: 'store-outside-radius',
            brandName: 'Mercado C',
            unitName: 'Unidade C',
            neighborhood: 'Centro',
            postalCode: '01001-000',
            latitude: { toString: () => '-23.550520' },
            longitude: { toString: () => '-46.633308' },
          },
        ]),
      },
    };

    const service = new LocationsService(prisma as never);
    const preview = await service.previewCoverage({
      regionId: 'region-1',
      latitude: -23.566,
      longitude: -46.684,
      coverageRadiusKm: 2,
    });

    expect(preview.coverageRadiusKm).toBe(2);
    expect(preview.fallbackUsed).toBe(false);
    expect(preview.establishments.map((store) => store.id)).toEqual([
      'store-nearest',
      'store-farther',
    ]);
    expect(preview.activeEstablishmentCount).toBe(2);
  });

  it('uses CEP fallback when coordinates are not provided', async () => {
    const prisma = {
      establishment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'store-1',
            brandName: 'Mercado Azul',
            unitName: 'Unidade Pinheiros',
            neighborhood: 'Pinheiros',
            postalCode: '05422-001',
            latitude: null,
            longitude: null,
          },
        ]),
      },
    };

    const service = new LocationsService(prisma as never);
    await expect(
      service.previewCoverage({
        regionId: 'region-1',
        postalCode: '05422-001',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        activeEstablishmentCount: 1,
        coverageRadiusKm: 5,
        fallbackUsed: true,
        fallbackReason: 'postal_code_only',
      }),
    );
  });

  it('rejects preferences without coordinates or CEP fallback', async () => {
    const service = new LocationsService({} as never);

    await expect(
      service.upsertPreference('user-1', {
        regionId: 'region-1',
        label: 'Casa',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects partial coordinates and out-of-policy radius values', async () => {
    const service = new LocationsService({} as never);

    await expect(
      service.upsertPreference('user-1', {
        regionId: 'region-1',
        label: 'Casa',
        latitude: -23.566,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.previewCoverage({
        regionId: 'region-1',
        latitude: -23.566,
        longitude: -46.684,
        coverageRadiusKm: 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
