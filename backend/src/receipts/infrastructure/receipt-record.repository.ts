import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { type ReceiptRecordEntity } from '../domain/receipt-record.entity';

@Injectable()
export class ReceiptRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(record: ReceiptRecordEntity): Promise<ReceiptRecordEntity> {
    const establishment = await this.findKnownEstablishment(record);

    await this.prisma.receiptRecord.create({
      data: {
        id: record.id,
        userId: record.userId,
        establishmentId: establishment?.id ?? null,
        sourceType: record.sourceType,
        parseStatus: record.parseStatus,
        storeName: record.storeName,
        storeCnpj: record.storeCnpj,
        accessKey: record.accessKey,
        sefazUrl: record.sefazUrl,
        purchaseDate: record.purchaseDate ? new Date(record.purchaseDate) : null,
        rawReference: JSON.stringify({
          rawSourceReference: record.rawSourceReference,
          processingLogs: record.processingLogs,
        }),
        confidenceScore: record.confidenceScore,
        lineItems: {
          create: record.lineItems.map((lineItem) => ({
            id: lineItem.id,
            ean: lineItem.ean,
            rawProductName: lineItem.rawProductName,
            normalizedName: lineItem.normalizedName,
            packageSize: lineItem.packageSize,
            quantity: lineItem.quantity,
            unitPrice: lineItem.unitPrice,
            originalUnitPrice: lineItem.originalUnitPrice,
            promotionalUnitPrice: lineItem.promotionalUnitPrice,
            lineTotal: Number((lineItem.quantity * lineItem.unitPrice).toFixed(2)),
            currency: lineItem.currency,
            matchConfidence: lineItem.matchConfidence,
          })),
        },
      },
    });

    return record;
  }

  async attachProcessingJob(receiptRecordId: string, processingJobId: string): Promise<void> {
    await this.prisma.receiptRecord.update({
      where: {
        id: receiptRecordId,
      },
      data: {
        jobId: processingJobId,
      },
    });
  }

  async markExtractionFailed(receiptRecordId: string, reason: string): Promise<void> {
    const existing = await this.findById(receiptRecordId);

    await this.prisma.receiptRecord.update({
      where: {
        id: receiptRecordId,
      },
      data: {
        parseStatus: 'failed',
        rawReference: JSON.stringify({
          rawSourceReference: existing?.rawSourceReference,
          processingLogs: [
            ...(existing?.processingLogs ?? []),
            `extraction_failed:${reason}`,
          ],
        }),
      },
    });
  }

  async findById(id: string): Promise<ReceiptRecordEntity | null> {
    const record = await this.prisma.receiptRecord.findUnique({
      where: {
        id,
      },
      include: {
        processingJob: true,
        lineItems: true,
      },
    });

    if (!record) {
      return null;
    }

    const metadata = this.parseMetadata(record.rawReference);

    return {
      id: record.id,
      userId: record.userId,
      storeId: record.establishmentId ?? undefined,
      storeName: record.storeName ?? undefined,
      storeCnpj: record.storeCnpj ?? undefined,
      accessKey: record.accessKey ?? undefined,
      sefazUrl: record.sefazUrl ?? undefined,
      purchaseDate: record.purchaseDate?.toISOString(),
      sourceType: record.sourceType,
      parseStatus: record.parseStatus,
      confidenceScore: Number(record.confidenceScore ?? 0),
      rawSourceReference: metadata.rawSourceReference,
      processingJobId: record.jobId ?? undefined,
      processingStatus: record.processingJob?.status,
      processingLogs: metadata.processingLogs,
      lineItems: record.lineItems.map((lineItem) => ({
        id: lineItem.id,
        receiptRecordId: lineItem.receiptRecordId,
        ean: lineItem.ean ?? undefined,
        rawProductName: lineItem.rawProductName,
        normalizedName: lineItem.normalizedName,
        packageSize: lineItem.packageSize ?? undefined,
        quantity: Number(lineItem.quantity),
        unitPrice: Number(lineItem.unitPrice),
        originalUnitPrice:
          lineItem.originalUnitPrice === null
            ? undefined
            : Number(lineItem.originalUnitPrice),
        promotionalUnitPrice:
          lineItem.promotionalUnitPrice === null
            ? undefined
            : Number(lineItem.promotionalUnitPrice),
        currency: lineItem.currency,
        matchConfidence: Number(lineItem.matchConfidence),
      })),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private async findKnownEstablishment(record: ReceiptRecordEntity) {
    if (record.storeCnpj) {
      return this.prisma.establishment.findFirst({
        where: {
          OR: [
            { cnpj: record.storeCnpj },
            { cnpj: this.formatCnpj(record.storeCnpj) },
          ],
        },
      });
    }

    if (!record.storeName) {
      return null;
    }

    return this.prisma.establishment.findFirst({
      where: {
        unitName: record.storeName,
      },
    });
  }

  private parseMetadata(rawReference: string | null): {
    rawSourceReference?: string;
    processingLogs: string[];
  } {
    if (!rawReference) {
      return {
        processingLogs: [],
      };
    }

    const parsed = JSON.parse(rawReference) as {
      rawSourceReference?: string;
      processingLogs?: string[];
    };

    return {
      rawSourceReference: parsed.rawSourceReference,
      processingLogs: parsed.processingLogs ?? [],
    };
  }

  private formatCnpj(digits: string): string {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
      5,
      8,
    )}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
}
