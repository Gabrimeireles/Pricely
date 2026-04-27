import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const [
      activeUsers,
      shoppingListsCount,
      optimizationRunsCount,
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
    }));

    this.logger.log(`Admin processing jobs requested: ${projectedJobs.length} records returned`);

    return projectedJobs;
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

  async listRegions() {
    const regions = await this.prisma.region.findMany({
      orderBy: [{ publicSortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            establishments: true,
          },
        },
      },
    });

    return regions.map((region) => ({
      id: region.id,
      slug: region.slug,
      name: region.name,
      stateCode: region.stateCode,
      implantationStatus: region.implantationStatus,
      publicSortOrder: region.publicSortOrder,
      establishmentsCount: region._count.establishments,
    }));
  }

  async createRegion(input: {
    slug: string;
    name: string;
    stateCode: string;
    implantationStatus: 'active' | 'activating' | 'inactive';
    publicSortOrder?: number;
  }) {
    const created = await this.prisma.region.create({
      data: {
        slug: input.slug,
        name: input.name,
        stateCode: input.stateCode,
        implantationStatus: input.implantationStatus,
        publicSortOrder: input.publicSortOrder ?? 0,
      },
    });

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
    const updated = await this.prisma.region.update({
      where: { id },
      data: input,
    });

    this.logger.log(`Admin updated region ${id}`);

    return updated;
  }

  async listEstablishments() {
    return this.prisma.establishment.findMany({
      include: {
        region: true,
      },
      orderBy: [{ cityName: 'asc' }, { unitName: 'asc' }],
    });
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
    const created = await this.prisma.establishment.create({
      data: {
        ...input,
        isActive: input.isActive ?? true,
      },
    });

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
    const updated = await this.prisma.establishment.update({
      where: { id },
      data: input,
    });

    this.logger.log(`Admin updated establishment ${id}`);

    return updated;
  }

  async listProducts() {
    return this.prisma.catalogProduct.findMany({
      include: {
        aliases: true,
        productVariants: {
          where: { isActive: true },
          orderBy: [{ brandName: 'asc' }, { displayName: 'asc' }],
        },
        _count: {
          select: {
            productOffers: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createProduct(input: {
    slug: string;
    name: string;
    category: string;
    defaultUnit?: string;
    imageUrl?: string;
    alias?: string;
  }) {
    const created = await this.prisma.catalogProduct.create({
      data: {
        slug: input.slug,
        name: input.name,
        category: input.category,
        defaultUnit: input.defaultUnit,
        imageUrl: input.imageUrl,
        isActive: true,
        aliases: input.alias
          ? {
              create: {
                alias: input.alias,
                sourceType: 'admin',
                confidenceScore: 1,
              },
            }
          : undefined,
      },
      include: {
        aliases: true,
      },
    });

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
    const updated = await this.prisma.catalogProduct.update({
      where: { id },
      data: input,
      include: {
        aliases: true,
      },
    });

    this.logger.log(`Admin updated catalog product ${id}`);

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
    const created = await this.prisma.productVariant.create({
      data: {
        ...input,
        isActive: input.isActive ?? true,
      },
    });

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
    const updated = await this.prisma.productVariant.update({
      where: { id },
      data: input,
    });

    this.logger.log(`Admin updated product variant ${id}`);

    return updated;
  }

  async listOffers() {
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

  async createOffer(input: {
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
    const created = await this.prisma.productOffer.create({
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
      availabilityStatus: 'available' | 'unavailable' | 'uncertain';
      confidenceLevel: 'high' | 'medium' | 'low';
      sourceType: string;
      sourceReference: string;
      observedAt: string;
      isActive: boolean;
    }>,
  ) {
    const updated = await this.prisma.productOffer.update({
      where: { id },
      data: {
        ...input,
        observedAt: input.observedAt ? new Date(input.observedAt) : undefined,
      },
    });

    this.logger.log(`Admin updated product offer ${id}`);

    return updated;
  }
}
