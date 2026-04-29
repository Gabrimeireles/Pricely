import { NotFoundException } from '@nestjs/common';

import { PublicCatalogService } from '../../../src/catalog/application/public-catalog.service';

describe('PublicCatalogService', () => {
  it('returns an empty list when the search query is blank', async () => {
    const prisma = {
      catalogProduct: {
        findMany: jest.fn(),
      },
    };
    const catalogProductsService = {
      searchCatalogProducts: jest.fn().mockResolvedValue([]),
    };
    const service = new PublicCatalogService(
      prisma as never,
      catalogProductsService as never,
    );

    await expect(service.searchCatalogProducts('   ')).resolves.toEqual([]);
    expect(catalogProductsService.searchCatalogProducts).toHaveBeenCalledWith('   ');
  });

  it('rejects variant listing for an unknown base product', async () => {
    const prisma = {
      catalogProduct: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      productVariant: {
        findMany: jest.fn(),
      },
    };
    const catalogProductsService = {
      listVariants: jest.fn(),
    };
    const service = new PublicCatalogService(
      prisma as never,
      catalogProductsService as never,
    );

    await expect(service.listVariants('missing-product')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.productVariant.findMany).not.toHaveBeenCalled();
  });
});
