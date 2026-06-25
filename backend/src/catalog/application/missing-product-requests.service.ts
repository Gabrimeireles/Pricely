import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { toSlug } from '../../common/utils/slug.util';
import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class MissingProductRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: {
      requestedName: string;
      categoryHint?: string;
      packageHint?: string;
      notes?: string;
    },
  ) {
    const requestedName = input.requestedName.trim();
    if (requestedName.length < 2) {
      throw new BadRequestException('Informe o nome do produto solicitado');
    }
    return this.prisma.missingProductRequest.create({
      data: {
        userId,
        requestedName,
        categoryHint: input.categoryHint?.trim() || null,
        packageHint: input.packageHint?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.missingProductRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        catalogProduct: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async listForAdmin() {
    return this.prisma.missingProductRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        user: {
          select: { id: true, displayName: true, email: true },
        },
        catalogProduct: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async convert(
    requestId: string,
    adminUserId: string,
    input: {
      name?: string;
      category: string;
      defaultUnit?: string;
      imageUrl?: string;
    },
  ) {
    const request = await this.prisma.missingProductRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Solicitacao de produto nao encontrada');
    }
    if (request.status === 'converted') {
      throw new BadRequestException('Solicitacao ja convertida em produto');
    }

    const name = input.name?.trim() || request.requestedName;
    const slugBase = toSlug(name);
    const slug = `${slugBase}-${request.id.slice(0, 8)}`;
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.catalogProduct.create({
        data: {
          slug,
          name,
          category: input.category.trim(),
          defaultUnit: input.defaultUnit?.trim() || request.packageHint,
          imageUrl: input.imageUrl?.trim() || null,
          aliases: {
            create: {
              alias: request.requestedName,
              sourceType: 'admin',
              confidenceScore: 1,
            },
          },
        },
      });
      await transaction.missingProductRequest.update({
        where: { id: requestId },
        data: {
          status: 'converted',
          catalogProductId: product.id,
          reviewedByUserId: adminUserId,
          reviewedAt: new Date(),
        },
      });
      return product;
    });
  }

  async reject(requestId: string, adminUserId: string, notes?: string) {
    const existing = await this.prisma.missingProductRequest.findUnique({
      where: { id: requestId },
    });
    if (!existing) {
      throw new NotFoundException('Solicitacao de produto nao encontrada');
    }
    return this.prisma.missingProductRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        notes: notes?.trim() || existing.notes,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });
  }
}
