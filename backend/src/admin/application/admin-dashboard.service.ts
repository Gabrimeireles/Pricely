import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CatalogProductsService } from '../../catalog/application/catalog-products.service';
import { CatalogMediaService } from '../../catalog/application/catalog-media.service';
import { EstablishmentsService } from '../../establishments/application/establishments.service';
import { PrismaService } from '../../persistence/prisma.service';
import { OfferManagementService } from '../../pricing/application/offer-management.service';
import { ReceiptIngestionService } from '../../receipts/application/receipt-ingestion.service';
import { RegionsAdminService } from '../../regions/application/regions-admin.service';
import { EntitlementsService } from '../../users/entitlements.service';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly regionsAdminService: RegionsAdminService,
    private readonly establishmentsService: EstablishmentsService,
    private readonly catalogProductsService: CatalogProductsService,
    private readonly catalogMediaService: CatalogMediaService,
    private readonly offerManagementService: OfferManagementService,
    private readonly entitlementsService: EntitlementsService,
    private readonly receiptIngestionService: ReceiptIngestionService,
  ) {}

  async getMetrics() {
    const [
      activeUsers,
      shoppingListsCount,
      optimizationRunsCount,
      aggregatedSavings,
      activeRegions,
      activeEstablishments,
      activeOffers,
      productCount,
      queuedJobs,
    ] = await Promise.all([
      this.prisma.userAccount.count({
        where: { status: 'active' },
      }),
      this.prisma.shoppingList.count(),
      this.prisma.optimizationRun.count({
        where: { status: 'completed' },
      }),
      this.prisma.optimizationRun.aggregate({
        where: { status: 'completed' },
        _sum: {
          estimatedSavings: true,
        },
      }),
      this.prisma.region.count({
        where: { implantationStatus: 'active' },
      }),
      this.prisma.establishment.count({
        where: { isActive: true },
      }),
      this.prisma.productOffer.count({
        where: { isActive: true, availabilityStatus: 'available' },
      }),
      this.prisma.catalogProduct.count({
        where: { isActive: true },
      }),
      this.prisma.processingJob.count({
        where: {
          status: {
            in: ['queued', 'running', 'retrying'],
          },
        },
      }),
    ]);

    const metrics = {
      activeUsers,
      shoppingListsCount,
      optimizationRunsCount,
      activeRegions,
      activeEstablishments,
      activeOffers,
      productCount,
      queuedJobs,
      globalEstimatedSavings: Number(
        aggregatedSavings._sum.estimatedSavings ?? 0,
      ),
    };

    this.logger.log(
      `Admin metrics generated: users=${metrics.activeUsers}, lists=${metrics.shoppingListsCount}, queuedJobs=${metrics.queuedJobs}`,
    );

    return metrics;
  }

  async listProcessingJobs() {
    const jobs = await this.prisma.processingJob.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        receiptRecord: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        optimizationRun: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            shoppingList: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const projectedJobs = jobs.map((job) => ({
      id: job.id,
      queueName: job.queueName,
      jobType: job.jobType,
      resourceType: job.resourceType,
      resourceId: job.resourceId,
      status: job.status,
      attemptCount: job.attemptCount,
      failureReason: job.failureReason,
      reviewedAt: job.reviewedAt?.toISOString(),
      reviewedByUserId: job.reviewedByUserId,
      cancelledAt: job.cancelledAt?.toISOString(),
      cancelledByUserId: job.cancelledByUserId,
      cancellationReason: job.cancellationReason,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString(),
      owner: job.optimizationRun?.user ?? job.receiptRecord?.user,
      shoppingList: job.optimizationRun?.shoppingList,
      receiptRecord: job.receiptRecord
        ? {
            id: job.receiptRecord.id,
            storeName: job.receiptRecord.storeName,
            storeCnpj: job.receiptRecord.storeCnpj,
            parseStatus: job.receiptRecord.parseStatus,
            trustLevel: job.receiptRecord.trustLevel,
            moderationStatus: job.receiptRecord.moderationStatus,
            rewardEligibilityStatus: job.receiptRecord.rewardEligibilityStatus,
            reviewReason: job.receiptRecord.reviewReason,
            purchaseDate: job.receiptRecord.purchaseDate?.toISOString(),
          }
        : null,
      optimizationRun: job.optimizationRun
        ? {
            id: job.optimizationRun.id,
            mode: job.optimizationRun.mode,
            status: job.optimizationRun.status,
            createdAt: job.optimizationRun.createdAt.toISOString(),
            completedAt: job.optimizationRun.completedAt?.toISOString(),
          }
        : null,
    }));

    this.logger.log(
      `Admin processing jobs requested: ${projectedJobs.length} records returned`,
    );

    return projectedJobs;
  }

  async getProcessingJobDetail(id: string) {
    const job = await this.prisma.processingJob.findUnique({
      where: { id },
      include: {
        receiptRecord: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            lineItems: {
              orderBy: {
                id: 'asc',
              },
            },
          },
        },
        optimizationRun: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            shoppingList: {
              select: {
                id: true,
                name: true,
              },
            },
            optimizationSelections: {
              include: {
                shoppingListItem: true,
                productOffer: {
                  include: {
                    productVariant: true,
                    establishment: true,
                    receiptRecord: true,
                  },
                },
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Processing job ${id} was not found`);
    }

    const optimizationRun = job.optimizationRun;
    const receiptRecord = job.receiptRecord;

    return {
      id: job.id,
      queueName: job.queueName,
      jobType: job.jobType,
      resourceType: job.resourceType,
      resourceId: job.resourceId,
      status: job.status,
      attemptCount: job.attemptCount,
      failureReason: job.failureReason,
      reviewedAt: job.reviewedAt?.toISOString(),
      reviewedByUserId: job.reviewedByUserId,
      cancelledAt: job.cancelledAt?.toISOString(),
      cancelledByUserId: job.cancelledByUserId,
      cancellationReason: job.cancellationReason,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString(),
      owner: optimizationRun?.user ?? receiptRecord?.user ?? null,
      shoppingList: optimizationRun?.shoppingList ?? null,
      receiptRecord: receiptRecord
        ? {
            id: receiptRecord.id,
            storeName: receiptRecord.storeName,
            storeCnpj: receiptRecord.storeCnpj,
            parseStatus: receiptRecord.parseStatus,
            trustLevel: receiptRecord.trustLevel,
            moderationStatus: receiptRecord.moderationStatus,
            rewardEligibilityStatus: receiptRecord.rewardEligibilityStatus,
            reviewReason: receiptRecord.reviewReason,
            purchaseDate: receiptRecord.purchaseDate?.toISOString(),
            lineItems: receiptRecord.lineItems.map((item) => ({
              id: item.id,
              rawProductName: item.rawProductName,
              normalizedName: item.normalizedName,
              ean: item.ean,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              originalUnitPrice:
                item.originalUnitPrice === null
                  ? undefined
                  : Number(item.originalUnitPrice),
              promotionalUnitPrice:
                item.promotionalUnitPrice === null
                  ? undefined
                  : Number(item.promotionalUnitPrice),
              matchConfidence: Number(item.matchConfidence),
            })),
          }
        : null,
      optimizationRun: optimizationRun
        ? {
            id: optimizationRun.id,
            mode: optimizationRun.mode,
            status: optimizationRun.status,
            totalEstimatedCost: Number(optimizationRun.totalEstimatedCost ?? 0),
            estimatedSavings: Number(optimizationRun.estimatedSavings ?? 0),
            coverageStatus: optimizationRun.coverageStatus,
            summary: optimizationRun.summary,
            createdAt: optimizationRun.createdAt.toISOString(),
            completedAt: optimizationRun.completedAt?.toISOString(),
            selections: optimizationRun.optimizationSelections.map(
              (selection) => ({
                id: selection.id,
                shoppingListItemId: selection.shoppingListItemId,
                shoppingListItemName: selection.shoppingListItem.requestedName,
                status: selection.status,
                estimatedCost: Number(selection.estimatedCost ?? 0),
                confidenceNotice: selection.confidenceNotice,
                offer: selection.productOffer
                  ? {
                      id: selection.productOffer.id,
                      displayName: selection.productOffer.displayName,
                      variantName:
                        selection.productOffer.productVariant.displayName,
                      establishmentName:
                        selection.productOffer.establishment.unitName,
                      neighborhood:
                        selection.productOffer.establishment.neighborhood,
                      priceAmount: Number(selection.productOffer.priceAmount),
                      confidenceLevel: selection.productOffer.confidenceLevel,
                      sourceType: selection.productOffer.sourceType,
                      sourceLabel:
                        selection.productOffer.sourceReference ??
                        selection.productOffer.sourceType,
                      observedAt:
                        selection.productOffer.observedAt.toISOString(),
                      receiptEvidence: selection.productOffer.receiptRecord
                        ? {
                            id: selection.productOffer.receiptRecord.id,
                            moderationStatus:
                              selection.productOffer.receiptRecord
                                .moderationStatus,
                            trustLevel:
                              selection.productOffer.receiptRecord.trustLevel,
                            reviewReason:
                              selection.productOffer.receiptRecord.reviewReason,
                          }
                        : null,
                    }
                  : null,
              }),
            ),
          }
        : null,
    };
  }

  async listReceiptProcessingReviews() {
    const receipts = await this.prisma.receiptRecord.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        processingJob: true,
        lineItems: {
          select: {
            id: true,
            rawProductName: true,
            normalizedName: true,
            ean: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            originalUnitPrice: true,
            promotionalUnitPrice: true,
            matchConfidence: true,
            productOffers: {
              select: {
                id: true,
                catalogProductId: true,
                productVariantId: true,
                establishmentId: true,
                displayName: true,
                packageLabel: true,
                priceAmount: true,
                observedAt: true,
                catalogProduct: {
                  select: {
                    name: true,
                  },
                },
                productVariant: {
                  select: {
                    displayName: true,
                    brandName: true,
                  },
                },
                establishment: {
                  select: {
                    unitName: true,
                    neighborhood: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const generatedOffers = receipts.flatMap((receipt) =>
      receipt.lineItems.flatMap((item) => item.productOffers),
    );
    const comparisonCandidates =
      generatedOffers.length > 0
        ? await this.prisma.productOffer.findMany({
            where: {
              isActive: true,
              availabilityStatus: 'available',
              receiptRecordId: {
                notIn: receipts.map((receipt) => receipt.id),
              },
              OR: generatedOffers.map((offer) => ({
                productVariantId: offer.productVariantId,
                establishmentId: offer.establishmentId,
              })),
            },
            orderBy: [{ observedAt: 'desc' }],
            select: {
              productVariantId: true,
              establishmentId: true,
              priceAmount: true,
              observedAt: true,
            },
          })
        : [];
    const latestComparisonByVariantAndStore = new Map<
      string,
      (typeof comparisonCandidates)[number]
    >();

    for (const offer of comparisonCandidates) {
      const key = `${offer.productVariantId}:${offer.establishmentId}`;
      if (!latestComparisonByVariantAndStore.has(key)) {
        latestComparisonByVariantAndStore.set(key, offer);
      }
    }

    const projectedReceipts = receipts.map((receipt) => {
      const confidences = receipt.lineItems.map((item) =>
        Number(item.matchConfidence),
      );
      const lineItemCount = confidences.length;
      const highConfidenceLineItemCount = confidences.filter(
        (confidence) => confidence >= 0.75,
      ).length;
      const averageMatchConfidence =
        lineItemCount === 0
          ? 0
          : Number(
              (
                confidences.reduce((sum, confidence) => sum + confidence, 0) /
                lineItemCount
              ).toFixed(2),
            );
      const totalLineAmount = Number(
        receipt.lineItems
          .reduce((sum, item) => sum + Number(item.lineTotal), 0)
          .toFixed(2),
      );

      return {
        id: receipt.id,
        storeName: receipt.storeName,
        storeCnpj: receipt.storeCnpj,
        parseStatus: receipt.parseStatus,
        trustLevel: receipt.trustLevel,
        moderationStatus: receipt.moderationStatus,
        rewardEligibilityStatus: receipt.rewardEligibilityStatus,
        reviewReason: receipt.reviewReason,
        purchaseDate: receipt.purchaseDate?.toISOString(),
        createdAt: receipt.createdAt.toISOString(),
        updatedAt: receipt.updatedAt.toISOString(),
        owner: receipt.user,
        processingJob: receipt.processingJob
          ? {
              id: receipt.processingJob.id,
              status: receipt.processingJob.status,
              attemptCount: receipt.processingJob.attemptCount,
              failureReason: receipt.processingJob.failureReason,
              updatedAt: receipt.processingJob.updatedAt.toISOString(),
            }
          : null,
        quality: {
          lineItemCount,
          highConfidenceLineItemCount,
          averageMatchConfidence,
          usefulDataRatio:
            lineItemCount === 0
              ? 0
              : Number(
                  (highConfidenceLineItemCount / lineItemCount).toFixed(2),
                ),
        },
        reward: this.receiptRewardProjection(receipt.rewardEligibilityStatus),
        extractedPayload: {
          accessKey: receipt.accessKey,
          sefazUrl: receipt.sefazUrl,
          rawReference: receipt.rawReference,
          purchaseDate: receipt.purchaseDate?.toISOString() ?? null,
          lineItemCount,
          totalLineAmount,
        },
        lineItems: receipt.lineItems.map((item) => ({
          id: item.id,
          rawProductName: item.rawProductName,
          normalizedName: item.normalizedName,
          ean: item.ean,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
          originalUnitPrice:
            item.originalUnitPrice === null
              ? null
              : Number(item.originalUnitPrice),
          promotionalUnitPrice:
            item.promotionalUnitPrice === null
              ? null
              : Number(item.promotionalUnitPrice),
          matchConfidence: Number(item.matchConfidence),
          matcherStatus:
            item.productOffers.length > 0
              ? 'matched_offer'
              : Number(item.matchConfidence) >= 0.75
                ? 'matched_name_only'
                : 'needs_product_review',
          makerAction:
            item.productOffers.length > 0
              ? 'offer_created'
              : Number(item.matchConfidence) >= 0.75
                ? 'link_existing_product'
                : 'create_or_match_product',
          offers: item.productOffers.map((offer) => {
            const comparison =
              latestComparisonByVariantAndStore.get(
                `${offer.productVariantId}:${offer.establishmentId}`,
              ) ?? null;
            const newPriceAmount = Number(offer.priceAmount);
            const previousPriceAmount = comparison
              ? Number(comparison.priceAmount)
              : null;
            const deltaAmount =
              previousPriceAmount === null
                ? null
                : Number((newPriceAmount - previousPriceAmount).toFixed(2));

            return {
              id: offer.id,
              catalogProductName: offer.catalogProduct.name,
              variantName: offer.productVariant.displayName,
              brandName: offer.productVariant.brandName,
              establishmentName: offer.establishment.unitName,
              neighborhood: offer.establishment.neighborhood,
              displayName: offer.displayName,
              packageLabel: offer.packageLabel,
              priceAmount: newPriceAmount,
              observedAt: offer.observedAt.toISOString(),
              comparison: {
                previousPriceAmount,
                newPriceAmount,
                deltaAmount,
                direction:
                  deltaAmount === null
                    ? 'new'
                    : deltaAmount > 0
                      ? 'up'
                      : deltaAmount < 0
                        ? 'down'
                        : 'same',
                previousObservedAt:
                  comparison?.observedAt.toISOString() ?? null,
              },
            };
          }),
        })),
      };
    });

    this.logger.log(
      `Admin receipt processing requested: ${projectedReceipts.length} records returned`,
    );

    return projectedReceipts;
  }

  async getReceiptProcessingReview(id: string) {
    const receipts = await this.prisma.receiptRecord.findMany({
      where: { id },
      take: 1,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        processingJob: true,
        lineItems: {
          select: {
            id: true,
            rawProductName: true,
            normalizedName: true,
            ean: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            originalUnitPrice: true,
            promotionalUnitPrice: true,
            matchConfidence: true,
            productOffers: {
              select: {
                id: true,
                catalogProductId: true,
                productVariantId: true,
                establishmentId: true,
                displayName: true,
                packageLabel: true,
                priceAmount: true,
                observedAt: true,
                catalogProduct: {
                  select: {
                    name: true,
                  },
                },
                productVariant: {
                  select: {
                    displayName: true,
                    brandName: true,
                  },
                },
                establishment: {
                  select: {
                    unitName: true,
                    neighborhood: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (receipts.length === 0) {
      throw new NotFoundException(`Receipt ${id} was not found`);
    }

    const generatedOffers = receipts.flatMap((receipt) =>
      receipt.lineItems.flatMap((item) => item.productOffers),
    );
    const comparisonCandidates =
      generatedOffers.length > 0
        ? await this.prisma.productOffer.findMany({
            where: {
              isActive: true,
              availabilityStatus: 'available',
              receiptRecordId: {
                notIn: receipts.map((receipt) => receipt.id),
              },
              OR: generatedOffers.map((offer) => ({
                productVariantId: offer.productVariantId,
                establishmentId: offer.establishmentId,
              })),
            },
            orderBy: [{ observedAt: 'desc' }],
            select: {
              productVariantId: true,
              establishmentId: true,
              priceAmount: true,
              observedAt: true,
            },
          })
        : [];
    const latestComparisonByVariantAndStore = new Map<
      string,
      (typeof comparisonCandidates)[number]
    >();

    for (const offer of comparisonCandidates) {
      const key = `${offer.productVariantId}:${offer.establishmentId}`;
      if (!latestComparisonByVariantAndStore.has(key)) {
        latestComparisonByVariantAndStore.set(key, offer);
      }
    }

    const receipt = receipts[0];
    const confidences = receipt.lineItems.map((item) =>
      Number(item.matchConfidence),
    );
    const lineItemCount = confidences.length;
    const highConfidenceLineItemCount = confidences.filter(
      (confidence) => confidence >= 0.75,
    ).length;
    const averageMatchConfidence =
      lineItemCount === 0
        ? 0
        : Number(
            (
              confidences.reduce((sum, confidence) => sum + confidence, 0) /
              lineItemCount
            ).toFixed(2),
          );
    const totalLineAmount = Number(
      receipt.lineItems
        .reduce((sum, item) => sum + Number(item.lineTotal), 0)
        .toFixed(2),
    );

    return {
      id: receipt.id,
      storeName: receipt.storeName,
      storeCnpj: receipt.storeCnpj,
      parseStatus: receipt.parseStatus,
      trustLevel: receipt.trustLevel,
      moderationStatus: receipt.moderationStatus,
      rewardEligibilityStatus: receipt.rewardEligibilityStatus,
      reviewReason: receipt.reviewReason,
      purchaseDate: receipt.purchaseDate?.toISOString(),
      createdAt: receipt.createdAt.toISOString(),
      updatedAt: receipt.updatedAt.toISOString(),
      owner: receipt.user,
      processingJob: receipt.processingJob
        ? {
            id: receipt.processingJob.id,
            status: receipt.processingJob.status,
            attemptCount: receipt.processingJob.attemptCount,
            failureReason: receipt.processingJob.failureReason,
            updatedAt: receipt.processingJob.updatedAt.toISOString(),
          }
        : null,
      quality: {
        lineItemCount,
        highConfidenceLineItemCount,
        averageMatchConfidence,
        usefulDataRatio:
          lineItemCount === 0
            ? 0
            : Number((highConfidenceLineItemCount / lineItemCount).toFixed(2)),
      },
      reward: this.receiptRewardProjection(receipt.rewardEligibilityStatus),
      extractedPayload: {
        accessKey: receipt.accessKey,
        sefazUrl: receipt.sefazUrl,
        rawReference: receipt.rawReference,
        purchaseDate: receipt.purchaseDate?.toISOString() ?? null,
        lineItemCount,
        totalLineAmount,
      },
      lineItems: receipt.lineItems.map((item) => ({
        id: item.id,
        rawProductName: item.rawProductName,
        normalizedName: item.normalizedName,
        ean: item.ean,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        originalUnitPrice:
          item.originalUnitPrice === null
            ? null
            : Number(item.originalUnitPrice),
        promotionalUnitPrice:
          item.promotionalUnitPrice === null
            ? null
            : Number(item.promotionalUnitPrice),
        matchConfidence: Number(item.matchConfidence),
        matcherStatus:
          item.productOffers.length > 0
            ? 'matched_offer'
            : Number(item.matchConfidence) >= 0.75
              ? 'matched_name_only'
              : 'needs_product_review',
        makerAction:
          item.productOffers.length > 0
            ? 'offer_created'
            : Number(item.matchConfidence) >= 0.75
              ? 'link_existing_product'
              : 'create_or_match_product',
        offers: item.productOffers.map((offer) => {
          const comparison =
            latestComparisonByVariantAndStore.get(
              `${offer.productVariantId}:${offer.establishmentId}`,
            ) ?? null;
          const newPriceAmount = Number(offer.priceAmount);
          const previousPriceAmount = comparison
            ? Number(comparison.priceAmount)
            : null;
          const deltaAmount =
            previousPriceAmount === null
              ? null
              : Number((newPriceAmount - previousPriceAmount).toFixed(2));

          return {
            id: offer.id,
            catalogProductName: offer.catalogProduct.name,
            variantName: offer.productVariant.displayName,
            brandName: offer.productVariant.brandName,
            establishmentName: offer.establishment.unitName,
            neighborhood: offer.establishment.neighborhood,
            displayName: offer.displayName,
            packageLabel: offer.packageLabel,
            priceAmount: newPriceAmount,
            observedAt: offer.observedAt.toISOString(),
            comparison: {
              previousPriceAmount,
              newPriceAmount,
              deltaAmount,
              direction:
                deltaAmount === null
                  ? 'new'
                  : deltaAmount > 0
                    ? 'up'
                    : deltaAmount < 0
                      ? 'down'
                      : 'same',
              previousObservedAt: comparison?.observedAt.toISOString() ?? null,
            },
          };
        }),
      })),
    };
  }

  async releaseReceiptForProcessing(receiptRecordId: string) {
    const receipt =
      await this.receiptIngestionService.releaseForProcessing(receiptRecordId);

    this.logger.log(
      `Receipt ${receiptRecordId} released for manual processing queue`,
    );

    return receipt;
  }

  async reprocessReceipt(receiptRecordId: string) {
    const receipt =
      await this.receiptIngestionService.reprocess(receiptRecordId);

    this.logger.log(`Receipt ${receiptRecordId} requeued for processing`);

    return receipt;
  }

  async rejectReceipt(receiptRecordId: string, reason?: string) {
    const receipt = await this.receiptIngestionService.rejectManually(
      receiptRecordId,
      reason,
    );

    this.logger.log(`Receipt ${receiptRecordId} rejected manually`);

    return receipt;
  }

  private receiptRewardProjection(status: string) {
    if (status === 'granted') {
      return {
        points: 100,
        optimizationTokens: 1,
        label: '100 pontos + 1 credito concedido',
      };
    }
    if (status === 'eligible_pending') {
      return {
        points: 100,
        optimizationTokens: 1,
        label: '100 pontos + 1 credito pendente',
      };
    }

    return {
      points: 0,
      optimizationTokens: 0,
      label: 'Sem reward',
    };
  }

  async getQueueHealth() {
    const jobs = await this.prisma.processingJob.findMany({
      select: {
        queueName: true,
        status: true,
        failureReason: true,
      },
    });

    const jobsByStatus = jobs.reduce<Record<string, number>>((current, job) => {
      current[job.status] = (current[job.status] ?? 0) + 1;
      return current;
    }, {});

    const queueNames = [...new Set(jobs.map((job) => job.queueName))];
    const recentFailures = jobs
      .filter((job) => Boolean(job.failureReason))
      .slice(0, 10)
      .map((job) => ({
        queueName: job.queueName,
        status: job.status,
        failureReason: job.failureReason,
      }));

    const summary = {
      queuedJobs: (jobsByStatus.queued ?? 0) + (jobsByStatus.retrying ?? 0),
      runningJobs: jobsByStatus.running ?? 0,
      failedJobs: jobsByStatus.failed ?? 0,
      completedJobs: jobsByStatus.completed ?? 0,
      jobsByStatus,
      queues: queueNames,
      recentFailures,
    };

    this.logger.log(
      `Admin queue health generated: queues=${summary.queues.length}, failed=${summary.failedJobs}, running=${summary.runningJobs}`,
    );

    return summary;
  }

  async listShoppingListAudits() {
    const lists = await this.prisma.shoppingList.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        preferredRegion: {
          select: {
            name: true,
            stateCode: true,
          },
        },
        shoppingListItems: {
          select: {
            id: true,
          },
        },
        optimizationRuns: {
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
        },
      },
    });

    const projected = lists.map((list) => {
      const latest = list.optimizationRuns[0];
      return {
        id: list.id,
        name: list.name,
        status: list.status,
        updatedAt: list.updatedAt.toISOString(),
        itemCount: list.shoppingListItems.length,
        owner: list.user,
        city: list.preferredRegion
          ? `${list.preferredRegion.name} - ${list.preferredRegion.stateCode}`
          : undefined,
        latestOptimization: latest
          ? {
              id: latest.id,
              jobId: latest.jobId,
              mode: latest.mode,
              status: latest.status,
              estimatedSavings: Number(latest.estimatedSavings ?? 0),
              totalEstimatedCost: Number(latest.totalEstimatedCost ?? 0),
              coverageStatus: latest.coverageStatus,
              createdAt: latest.createdAt.toISOString(),
              completedAt: latest.completedAt?.toISOString(),
            }
          : null,
      };
    });

    this.logger.log(
      `Admin shopping list audit requested: ${projected.length} lists returned`,
    );

    return projected;
  }

  async listUsers(userIds?: string[]) {
    const users = await this.prisma.userAccount.findMany({
      where: userIds?.length
        ? {
            id: {
              in: userIds,
            },
          }
        : undefined,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        preferredRegion: {
          select: {
            id: true,
            slug: true,
            name: true,
            stateCode: true,
          },
        },
        entitlements: {
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
        },
        optimizationRuns: {
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
          select: {
            id: true,
            mode: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        },
        _count: {
          select: {
            shoppingLists: true,
            optimizationRuns: true,
            receiptRecords: true,
            priceMismatchReports: true,
          },
        },
      },
    });

    const tokenBalances =
      await this.prisma.optimizationTokenLedgerEntry.groupBy({
        by: ['userId'],
        where: {
          userId: {
            in: users.map((user) => user.id),
          },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        _sum: {
          amount: true,
        },
      });
    const tokenBalanceByUser = new Map(
      tokenBalances.map((entry) => [
        entry.userId,
        Number(entry._sum.amount ?? 0),
      ]),
    );

    return users.map((user) => {
      const latestEntitlement = user.entitlements[0];
      const hasActivePremium =
        latestEntitlement?.plan === 'premium' &&
        ['active', 'trialing'].includes(latestEntitlement.status) &&
        (!latestEntitlement.endsAt || latestEntitlement.endsAt > new Date());
      const latestOptimization = user.optimizationRuns[0];

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        preferredRegion: user.preferredRegion,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        counts: {
          shoppingLists: user._count.shoppingLists,
          optimizationRuns: user._count.optimizationRuns,
          receiptRecords: user._count.receiptRecords,
          priceMismatchReports: user._count.priceMismatchReports,
        },
        entitlement: {
          plan: hasActivePremium ? 'premium' : 'free',
          status: latestEntitlement?.status ?? 'active',
          source: latestEntitlement?.source ?? 'monthly_free_refill',
          availableOptimizationTokens: hasActivePremium
            ? null
            : (tokenBalanceByUser.get(user.id) ?? 0),
          monthlyFreeOptimizationTokens:
            this.entitlementsService.monthlyFreeTokenCount(),
          billingEnabled: false,
          checkoutEnabled: false,
          lastPaymentAt: null,
          lastPaymentStatus: 'billing_disabled',
        },
        latestOptimization: latestOptimization
          ? {
              id: latestOptimization.id,
              mode: latestOptimization.mode,
              status: latestOptimization.status,
              createdAt: latestOptimization.createdAt.toISOString(),
              completedAt: latestOptimization.completedAt?.toISOString(),
            }
          : null,
      };
    });
  }

  async setUserPremium(
    userId: string,
    input: { enabled: boolean },
    adminUserId: string,
  ) {
    await this.entitlementsService.setManualPremium({
      userId,
      enabled: input.enabled,
      adminUserId,
    });

    this.logger.log(
      `Admin ${adminUserId} ${input.enabled ? 'enabled' : 'disabled'} premium for user ${userId}`,
    );

    return this.getUserOrThrow(userId);
  }

  async grantUserOptimizationTokens(
    userId: string,
    input: { amount: number; reason?: string },
    adminUserId: string,
  ) {
    await this.entitlementsService.grantAdminOptimizationTokens({
      userId,
      amount: input.amount,
      reason: input.reason,
      adminUserId,
    });

    this.logger.log(
      `Admin ${adminUserId} granted ${input.amount} optimization tokens to user ${userId}`,
    );

    return this.getUserOrThrow(userId);
  }

  private async getUserOrThrow(userId: string) {
    const [found] = await this.listUsers([userId]);
    if (!found) {
      throw new NotFoundException(`User ${userId} was not found`);
    }

    return found;
  }

  async listRegions() {
    return this.regionsAdminService.list();
  }

  async createRegion(input: {
    slug: string;
    name: string;
    stateCode: string;
    implantationStatus: 'active' | 'activating' | 'inactive';
    publicSortOrder?: number;
  }) {
    const created = await this.regionsAdminService.create(input);

    this.logger.log(`Admin created region ${created.slug} (${created.id})`);

    return created;
  }

  async updateRegion(
    id: string,
    input: Partial<{
      slug: string;
      name: string;
      stateCode: string;
      implantationStatus: 'active' | 'activating' | 'inactive';
      publicSortOrder: number;
    }>,
  ) {
    const updated = await this.regionsAdminService.update(id, input);

    this.logger.log(`Admin updated region ${id}`);

    return updated;
  }

  async listEstablishments() {
    return this.establishmentsService.list();
  }

  async createEstablishment(input: {
    brandName: string;
    unitName: string;
    cnpj: string;
    cityName?: string;
    neighborhood: string;
    regionId: string;
    isActive?: boolean;
  }) {
    const created = await this.establishmentsService.create(input);

    this.logger.log(
      `Admin created establishment ${created.id} for region ${input.regionId}`,
    );

    return created;
  }

  async updateEstablishment(
    id: string,
    input: Partial<{
      brandName: string;
      unitName: string;
      cnpj: string;
      cityName: string;
      neighborhood: string;
      regionId: string;
      isActive: boolean;
    }>,
  ) {
    const updated = await this.establishmentsService.update(id, input);

    this.logger.log(`Admin updated establishment ${id}`);

    return updated;
  }

  async listProducts() {
    return this.catalogProductsService.listProducts();
  }

  async createProduct(input: {
    slug: string;
    name: string;
    category: string;
    defaultUnit?: string;
    imageUrl?: string;
    alias?: string;
  }) {
    const created = await this.catalogProductsService.createProduct(input);

    this.logger.log(
      `Admin created catalog product ${created.id} (${created.slug})`,
    );

    return created;
  }

  async updateProduct(
    id: string,
    input: Partial<{
      slug: string;
      name: string;
      category: string;
      defaultUnit: string;
      imageUrl: string;
      isActive: boolean;
    }>,
  ) {
    const updated = await this.catalogProductsService.updateProduct(id, input);

    this.logger.log(`Admin updated catalog product ${id}`);

    return updated;
  }

  async deleteProduct(id: string) {
    const deleted = await this.catalogProductsService.deleteProduct(id);

    this.logger.log(`Admin deactivated catalog product ${id}`);

    return deleted;
  }

  async uploadCatalogProductImage(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const updated = await this.catalogMediaService.uploadCatalogProductImage(
      id,
      file,
    );
    this.logger.log(`Admin uploaded image for catalog product ${id}`);
    return updated;
  }

  async listProductVariants() {
    return this.prisma.productVariant.findMany({
      include: {
        catalogProduct: true,
      },
      orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
    });
  }

  async createProductVariant(input: {
    catalogProductId: string;
    slug: string;
    displayName: string;
    brandName?: string;
    variantLabel?: string;
    packageLabel?: string;
    imageUrl?: string;
    isActive?: boolean;
  }) {
    const created = await this.catalogProductsService.createVariant(input);

    this.logger.log(
      `Admin created product variant ${created.id} for catalog product ${input.catalogProductId}`,
    );

    return created;
  }

  async updateProductVariant(
    id: string,
    input: Partial<{
      catalogProductId: string;
      slug: string;
      displayName: string;
      brandName: string;
      variantLabel: string;
      packageLabel: string;
      imageUrl: string;
      isActive: boolean;
    }>,
  ) {
    const updated = await this.catalogProductsService.updateVariant(id, input);

    this.logger.log(`Admin updated product variant ${id}`);

    return updated;
  }

  async deleteProductVariant(id: string) {
    const deleted = await this.catalogProductsService.deleteVariant(id);

    this.logger.log(`Admin deactivated product variant ${id}`);

    return deleted;
  }

  async uploadProductVariantImage(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const updated = await this.catalogMediaService.uploadProductVariantImage(
      id,
      file,
    );
    this.logger.log(`Admin uploaded image for product variant ${id}`);
    return updated;
  }

  async listOffers() {
    return this.offerManagementService.list();
  }

  async createOffer(input: {
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
    const created = await this.offerManagementService.create(input);

    this.logger.log(
      `Admin created product offer ${created.id} for variant ${input.productVariantId}`,
    );

    return created;
  }

  async updateOffer(
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
    const updated = await this.offerManagementService.update(id, input);

    this.logger.log(`Admin updated product offer ${id}`);

    return updated;
  }
}
