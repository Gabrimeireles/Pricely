import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { type ReceiptRecordEntity } from '../domain/receipt-record.entity';

@Injectable()
export class ReceiptRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(record: ReceiptRecordEntity): Promise<ReceiptRecordEntity> {
    const establishment = await this.prisma.establishment.findFirst({
      where: {
        unitName: record.storeName,
      },
    });

    await this.prisma.receiptRecord.create({
      data: {
        id: record.id,
        userId: await this.resolveFallbackUserId(),
        establishmentId:
          establishment?.id ?? (await this.resolveFallbackEstablishmentId(record.storeName)),
        sourceType: record.sourceType === 'image_parse' ? 'image_parse' : 'manual_entry',
        parseStatus:
          record.parseStatus === 'parsed'
            ? 'parsed'
            : record.parseStatus === 'partial'
              ? 'partial'
              : 'failed',
        purchaseDate: record.purchaseDate ? new Date(record.purchaseDate) : null,
        rawReference: JSON.stringify(record),
      },
    });

    return record;
  }

  async findById(id: string): Promise<ReceiptRecordEntity | null> {
    const record = await this.prisma.receiptRecord.findUnique({
      where: {
        id,
      },
    });

    if (!record?.rawReference) {
      return null;
    }

    return JSON.parse(record.rawReference) as ReceiptRecordEntity;
  }

  private async resolveFallbackUserId(): Promise<string> {
    const user = await this.prisma.userAccount.findFirst({
      where: {
        status: 'active',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!user) {
      throw new Error('No active user exists to persist the receipt record');
    }

    return user.id;
  }

  private async resolveFallbackEstablishmentId(storeName: string): Promise<string> {
    const region = await this.prisma.region.findFirst({
      where: {
        implantationStatus: {
          not: 'inactive',
        },
      },
      orderBy: {
        publicSortOrder: 'asc',
      },
    });

    if (!region) {
      throw new Error('No active region exists to persist the receipt record');
    }

    const safeDigits = storeName
      .replace(/\D/g, '')
      .padEnd(14, '0')
      .slice(0, 14);
    const formattedCnpj = `${safeDigits.slice(0, 2)}.${safeDigits.slice(2, 5)}.${safeDigits.slice(
      5,
      8,
    )}/${safeDigits.slice(8, 12)}-${safeDigits.slice(12, 14)}`;

    const establishment = await this.prisma.establishment.create({
      data: {
        brandName: storeName,
        unitName: storeName,
        cnpj: formattedCnpj,
        cityName: region.name,
        neighborhood: 'Nao informado',
        regionId: region.id,
        isActive: true,
      },
    });

    return establishment.id;
  }
}
