import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class OfferManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.productOffer.findMany({
      include: {
        catalogProduct: true,
        productVariant: true,
        establishment: {
          include: {
            region: true,
          },
        },
      },
      orderBy: [{ observedAt: 'desc' }],
    });
  }

  async create(input: {
    catalogProductId: string;
    productVariantId: string;
    establishmentId: string;
    displayName: string;
    packageLabel: string;
    priceAmount: number;
    basePriceAmount?: number;
    promotionalPriceAmount?: number | null;
    availabilityStatus: 'available' | 'unavailable' | 'uncertain';
    confidenceLevel: 'high' | 'medium' | 'low';
    sourceType?: string;
    sourceReference?: string;
    observedAt?: string;
    isActive?: boolean;
  }) {
    const effectivePrice = input.promotionalPriceAmount ?? input.priceAmount;

    return this.prisma.productOffer.create({
      data: {
        catalogProductId: input.catalogProductId,
        productVariantId: input.productVariantId,
        establishmentId: input.establishmentId,
        displayName: input.displayName,
        packageLabel: input.packageLabel,
        priceAmount: effectivePrice,
        basePriceAmount: input.basePriceAmount ?? input.priceAmount,
        promotionalPriceAmount: input.promotionalPriceAmount ?? null,
        currencyCode: 'BRL',
        availabilityStatus: input.availabilityStatus,
        confidenceLevel: input.confidenceLevel,
        sourceType: input.sourceType ?? 'admin',
        sourceReference: input.sourceReference,
        observedAt: input.observedAt ? new Date(input.observedAt) : new Date(),
        isActive: input.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    input: Partial<{
      catalogProductId: string;
      productVariantId: string;
      establishmentId: string;
      displayName: string;
      packageLabel: string;
      priceAmount: number;
      basePriceAmount: number;
      promotionalPriceAmount: number | null;
      availabilityStatus: 'available' | 'unavailable' | 'uncertain';
      confidenceLevel: 'high' | 'medium' | 'low';
      sourceType: string;
      sourceReference: string;
      observedAt: string;
      isActive: boolean;
    }>,
  ) {
    const priceData =
      input.promotionalPriceAmount !== undefined
        ? {
            promotionalPriceAmount: input.promotionalPriceAmount,
            priceAmount: input.promotionalPriceAmount ?? input.priceAmount,
          }
        : {};

    return this.prisma.productOffer.update({
      where: { id },
      data: {
        ...input,
        ...priceData,
        observedAt: input.observedAt ? new Date(input.observedAt) : undefined,
      },
    });
  }
}
