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
    availabilityStatus: 'available' | 'unavailable' | 'uncertain';
    confidenceLevel: 'high' | 'medium' | 'low';
    sourceType?: string;
    sourceReference?: string;
    observedAt?: string;
    isActive?: boolean;
  }) {
    return this.prisma.productOffer.create({
      data: {
        catalogProductId: input.catalogProductId,
        productVariantId: input.productVariantId,
        establishmentId: input.establishmentId,
        displayName: input.displayName,
        packageLabel: input.packageLabel,
        priceAmount: input.priceAmount,
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
      availabilityStatus: 'available' | 'unavailable' | 'uncertain';
      confidenceLevel: 'high' | 'medium' | 'low';
      sourceType: string;
      sourceReference: string;
      observedAt: string;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.productOffer.update({
      where: { id },
      data: {
        ...input,
        observedAt: input.observedAt ? new Date(input.observedAt) : undefined,
      },
    });
  }
}
