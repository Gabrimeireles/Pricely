import { Logger } from '@nestjs/common';

import { PublicRegionsService } from '../../../src/regions/application/public-regions.service';

describe('PublicRegionsService', () => {
  it('returns active and activating regions with active-store counts and coverage status', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const prisma = {
      region: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'region-1',
            slug: 'sao-paulo-sp',
            name: 'Sao Paulo',
            stateCode: 'SP',
            implantationStatus: 'active',
            establishments: [
              {
                productOffers: [{ id: 'offer-1' }, { id: 'offer-2' }],
              },
            ],
          },
          {
            id: 'region-2',
            slug: 'campinas-sp',
            name: 'Campinas',
            stateCode: 'SP',
            implantationStatus: 'activating',
            establishments: [],
          },
        ]),
      },
    };

    const service = new PublicRegionsService(prisma as never);

    await expect(service.listVisibleRegions()).resolves.toEqual([
      {
        id: 'region-1',
        slug: 'sao-paulo-sp',
        name: 'Sao Paulo',
        stateCode: 'SP',
        implantationStatus: 'active',
        activeEstablishmentCount: 1,
        offerCoverageStatus: 'live',
      },
      {
        id: 'region-2',
        slug: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
        implantationStatus: 'activating',
        activeEstablishmentCount: 0,
        offerCoverageStatus: 'collecting_data',
      },
    ]);

    expect(logSpy).toHaveBeenCalledWith(
      'Public regions requested: 2 regions visible',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Public regions response contains 1 zero-store regions',
    );
  });
});
