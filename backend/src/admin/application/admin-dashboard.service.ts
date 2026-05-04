import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CatalogProductsService } from '../../catalog/application/catalog-products.service';
import { CatalogMediaService } from '../../catalog/application/catalog-media.service';
import { EstablishmentsService } from '../../establishments/application/establishments.service';
import { PrismaService } from '../../persistence/prisma.service';
import { OfferManagementService } from '../../pricing/application/offer-management.service';
import { RegionsAdminService } from '../../regions/application/regions-admin.service';

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
      globalEstimatedSavings: Number(aggregatedSavings._sum.estimatedSavings ?? 0),
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
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString(),
      owner: job.optimizationRun?.user,
      shoppingList: job.optimizationRun?.shoppingList,
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

    this.logger.log(`Admin processing jobs requested: ${projectedJobs.length} records returned`);

    return projectedJobs;
  }

  async getProcessingJobDetail(id: string) {
    const job = await this.prisma.processingJob.findUnique({
      where: { id },
      include: {
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

    return {
      id: job.id,
      queueName: job.queueName,
      jobType: job.jobType,
      resourceType: job.resourceType,
      resourceId: job.resourceId,
      status: job.status,
      attemptCount: job.attemptCount,
      failureReason: job.failureReason,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString(),
      owner: optimizationRun?.user ?? null,
      shoppingList: optimizationRun?.shoppingList ?? null,
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
            selections: optimizationRun.optimizationSelections.map((selection) => ({
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
                    variantName: selection.productOffer.productVariant.displayName,
                    establishmentName: selection.productOffer.establishment.unitName,
                    neighborhood: selection.productOffer.establishment.neighborhood,
                    priceAmount: Number(selection.productOffer.priceAmount),
                    sourceLabel:
                      selection.productOffer.sourceReference ?? selection.productOffer.sourceType,
                    observedAt: selection.productOffer.observedAt.toISOString(),
                  }
                : null,
            })),
          }
        : null,
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

    this.logger.log(`Admin shopping list audit requested: ${projected.length} lists returned`);

    return projected;
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
    cityName: string;
    neighborhood: string;
    regionId: string;
    isActive?: boolean;
  }) {
    const created = await this.establishmentsService.create(input);

    this.logger.log(`Admin created establishment ${created.id} for region ${input.regionId}`);

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

    this.logger.log(`Admin created catalog product ${created.id} (${created.slug})`);

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

  async uploadCatalogProductImage(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const updated = await this.catalogMediaService.uploadCatalogProductImage(id, file);
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

    this.logger.log(`Admin created product variant ${created.id} for catalog product ${input.catalogProductId}`);

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

  async uploadProductVariantImage(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const updated = await this.catalogMediaService.uploadProductVariantImage(id, file);
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

    this.logger.log(`Admin created product offer ${created.id} for variant ${input.productVariantId}`);

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
