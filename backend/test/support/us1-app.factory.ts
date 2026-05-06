import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Queue } from 'bullmq';
import request from 'supertest';

import { HttpExceptionFilter } from '../../src/common/errors/http-exception.filter';
import { AppValidationPipe } from '../../src/common/validation/validation.pipe';
import { AuthModule } from '../../src/auth/auth.module';
import { AdminModule } from '../../src/admin/admin.module';
import {
  OPTIMIZATION_QUEUE,
  RECEIPT_PROCESSING_QUEUE,
} from '../../src/common/queue/queue.tokens';
import { QueueModule } from '../../src/common/queue/queue.module';
import { CatalogModule } from '../../src/catalog/catalog.module';
import { ProductMatchRepository } from '../../src/catalog/infrastructure/product-match.repository';
import { JobsModule } from '../../src/jobs/jobs.module';
import { OptimizationRunProcessor } from '../../src/jobs/optimization-run.processor';
import { ListsModule } from '../../src/lists/lists.module';
import { OptimizationModule } from '../../src/optimization/optimization.module';
import { PricingModule } from '../../src/pricing/pricing.module';
import { ReceiptsModule } from '../../src/receipts/receipts.module';
import { ReceiptIngestionProcessor } from '../../src/jobs/receipt-ingestion.processor';
import { ReceiptRecordRepository } from '../../src/receipts/infrastructure/receipt-record.repository';
import { RegionsModule } from '../../src/regions/regions.module';
import { StoresModule } from '../../src/stores/stores.module';
import { ShoppingListRepository } from '../../src/lists/infrastructure/shopping-list.repository';
import { StoreOfferRepository } from '../../src/stores/infrastructure/store-offer.repository';
import { PrismaService } from '../../src/persistence/prisma.service';

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  preferredRegionId: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type QueueStub = Pick<Queue, 'add'>;

class InMemoryShoppingListRepository {
  private readonly lists = new Map<string, any>();

  private normalizePreferredRegion(regionId?: string) {
    return regionId === 'region-test-1' ? 'sao-paulo-sp' : regionId;
  }

  async create(input: any) {
    const now = new Date().toISOString();
    const list = {
      id: `sl_${crypto.randomUUID()}`,
      userId: input.userId,
      name: input.name,
      preferredRegionId: this.normalizePreferredRegion(input.preferredRegionId),
      status: 'draft',
      lastMode: input.lastMode ?? 'global_full',
      latestEstimatedSavings: 0,
      latestOptimizationStatus: undefined,
      latestOptimizedAt: undefined,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    this.lists.set(list.id, structuredClone(list));
    return structuredClone(list);
  }

  async listByUser(userId: string) {
    return Array.from(this.lists.values())
      .filter((entry) => entry.userId === userId)
      .map((entry) => structuredClone(entry));
  }

  async findByIdForUser(id: string, userId: string) {
    const value = this.lists.get(id);
    if (!value || value.userId != userId) {
      return null;
    }
    return value ? structuredClone(value) : null;
  }

  async appendItems(id: string, userId: string, items: any[], status: string) {
    const existing = this.lists.get(id);
    if (!existing || existing.userId !== userId) {
      return null;
    }

    existing.items.push(...structuredClone(items));
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    this.lists.set(id, existing);
    return structuredClone(existing);
  }

  async updateStatus(id: string, userId: string, status: string) {
    const existing = this.lists.get(id);
    if (!existing || existing.userId !== userId) {
      return;
    }

    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    this.lists.set(id, existing);
  }

  async listAll() {
    return Array.from(this.lists.values())
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )
      .map((entry) => structuredClone(entry));
  }

  setOptimizationSummary(
    shoppingListId: string,
    summary: {
      latestEstimatedSavings?: number | null;
      latestOptimizationStatus?: string;
      latestOptimizedAt?: string;
    },
  ) {
    const existing = this.lists.get(shoppingListId);
    if (!existing) {
      return;
    }

    if (summary.latestEstimatedSavings !== undefined) {
      existing.latestEstimatedSavings = Number(summary.latestEstimatedSavings ?? 0);
    }
    if (summary.latestOptimizationStatus !== undefined) {
      existing.latestOptimizationStatus = summary.latestOptimizationStatus;
    }
    if (summary.latestOptimizedAt !== undefined) {
      existing.latestOptimizedAt = summary.latestOptimizedAt;
    }
    existing.updatedAt = new Date().toISOString();
    this.lists.set(shoppingListId, existing);
  }

  async updateItemPurchaseStatus(
    shoppingListId: string,
    userId: string,
    itemId: string,
    purchaseStatus: 'pending' | 'purchased',
  ) {
    const existing = this.lists.get(shoppingListId);
    if (!existing || existing.userId !== userId) {
      return null;
    }

    existing.items = existing.items.map((item: any) =>
      item.id === itemId
        ? {
            ...item,
            purchaseStatus,
            purchasedAt:
              purchaseStatus === 'purchased' ? new Date().toISOString() : undefined,
          }
        : item,
    );
    existing.updatedAt = new Date().toISOString();
    this.lists.set(shoppingListId, existing);
    return structuredClone(existing);
  }

  findItemById(itemId: string) {
    for (const list of this.lists.values()) {
      const item = list.items.find((entry: any) => entry.id === itemId);
      if (item) {
        return structuredClone(item);
      }
    }

    return null;
  }
}

class InMemoryReceiptRecordRepository {
  private readonly records = new Map<string, any>();

  async create(record: any) {
    this.records.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  async attachProcessingJob(receiptRecordId: string, processingJobId: string) {
    const existing = this.records.get(receiptRecordId);
    if (!existing) {
      return;
    }

    this.records.set(receiptRecordId, {
      ...existing,
      processingJobId,
      processingStatus: 'queued',
    });
  }

  async markExtractionFailed(receiptRecordId: string, reason: string) {
    const existing = this.records.get(receiptRecordId);
    if (!existing) {
      return;
    }

    this.records.set(receiptRecordId, {
      ...existing,
      parseStatus: 'failed',
      processingLogs: [
        ...(existing.processingLogs ?? []),
        `extraction_failed:${reason}`,
      ],
    });
  }

  async findById(id: string) {
    const value = this.records.get(id);
    return value ? structuredClone(value) : null;
  }
}

class InMemoryProductMatchRepository {
  private readonly matches = new Map<string, any>();

  async findByAlias(alias: string) {
    const value = this.matches.get(alias);
    return value ? structuredClone(value) : null;
  }

  async upsert(match: any) {
    this.matches.set(match.alias, structuredClone(match));
    return structuredClone(match);
  }
}

class InMemoryStoreOfferRepository {
  private readonly offers = new Map<string, any>();

  constructor(seedOffers: any[] = []) {
    for (const offer of seedOffers) {
      this.offers.set(offer.id, structuredClone(offer));
    }
  }

  async upsert(offer: any) {
    this.offers.set(offer.id, structuredClone(offer));
    return structuredClone(offer);
  }

  async findByCanonicalNames(canonicalNames: string[]) {
    return Array.from(this.offers.values())
      .filter((offer) => canonicalNames.includes(offer.canonicalName))
      .map((offer) => structuredClone(offer));
  }

  async findByListItems(items: Array<{ catalogProductId?: string; normalizedName?: string }>) {
    const catalogProductIds = new Set(items.map((item) => item.catalogProductId).filter(Boolean));
    const canonicalNames = new Set(items.map((item) => item.normalizedName).filter(Boolean));

    return Array.from(this.offers.values())
      .filter(
        (offer) =>
          (offer.catalogProductId && catalogProductIds.has(offer.catalogProductId)) ||
          canonicalNames.has(offer.canonicalName),
      )
      .map((offer) => structuredClone(offer));
  }

  findById(id: string) {
    const offer = this.offers.get(id);
    return offer ? structuredClone(offer) : null;
  }
}

class PrismaUserAccountMock {
  private readonly users = new Map<string, StoredUser>();
  private readonly processingJobs = new Map<string, any>();
  private readonly optimizationRuns = new Map<string, any>();
  private readonly optimizationSelections: any[] = [];
  private readonly regions = [
    {
      id: 'region-test-1',
      slug: 'sao-paulo-sp',
      name: 'Sao Paulo',
      stateCode: 'SP',
      implantationStatus: 'active',
      publicSortOrder: 0,
    },
  ];
  private readonly establishments = [
    {
      id: 'est-test-1',
      brandName: 'Mercado Pratico',
      unitName: 'Unidade Pinheiros',
      cnpj: '00.000.000/0001-00',
      cityName: 'Sao Paulo',
      neighborhood: 'Pinheiros',
      regionId: 'region-test-1',
      isActive: true,
    },
  ];
  private readonly catalogProducts = [
    {
      id: 'product-test-arroz',
      slug: 'arroz-tipo-1-5kg',
      name: 'Arroz tipo 1 5kg',
      category: 'mercearia',
      defaultUnit: '5 kg',
      imageUrl: null,
      isActive: true,
    },
    {
      id: 'product-test-1',
      slug: 'cafe-torrado-500g',
      name: 'Cafe torrado',
      category: 'mercearia',
      defaultUnit: 'un',
      imageUrl: 'https://example.com/cafe.png',
      isActive: true,
    },
  ];
  private readonly productVariants = [
    {
      id: 'variant-test-arroz',
      catalogProductId: 'product-test-arroz',
      slug: 'arroz-tipo-1-5kg-seed-5kg',
      displayName: 'Arroz tipo 1 5kg',
      brandName: null,
      variantLabel: null,
      packageLabel: '5 kg',
      imageUrl: null,
      isActive: true,
    },
    {
      id: 'variant-test-1',
      catalogProductId: 'product-test-1',
      slug: 'cafe-pilao-500g',
      displayName: 'Cafe Pilao 500g',
      brandName: 'Pilao',
      variantLabel: 'Tradicional',
      packageLabel: '500 g',
      imageUrl: 'https://example.com/cafe.png',
      isActive: true,
    },
  ];
  private readonly productOffers = [
    {
      id: 'offer-test-arroz',
      catalogProductId: 'product-test-arroz',
      productVariantId: 'variant-test-arroz',
      establishmentId: 'est-test-1',
      displayName: 'Arroz tipo 1 5kg',
      packageLabel: '5 kg',
      priceAmount: 22.9,
      currencyCode: 'BRL',
      availabilityStatus: 'available',
      confidenceLevel: 'high',
      sourceType: 'seed',
      sourceReference: 'Seed local',
      observedAt: new Date('2026-04-26T10:00:00Z'),
      isActive: true,
    },
    {
      id: 'offer-test-1',
      catalogProductId: 'product-test-1',
      productVariantId: 'variant-test-1',
      establishmentId: 'est-test-1',
      displayName: 'Cafe Pilao 500g',
      packageLabel: '500 g',
      priceAmount: 15.9,
      currencyCode: 'BRL',
      availabilityStatus: 'available',
      confidenceLevel: 'high',
      sourceType: 'admin',
      sourceReference: 'Painel admin',
      observedAt: new Date('2026-04-26T10:00:00Z'),
      isActive: true,
    },
  ];

  constructor(
    private readonly shoppingListRepository: InMemoryShoppingListRepository,
    private readonly storeOfferRepository: InMemoryStoreOfferRepository,
  ) {}

  readonly userAccount = {
    findUnique: async (args: { where: { id?: string; email?: string } }) =>
      this.findUnique(args),
    create: async (args: {
      data: Pick<
        StoredUser,
        'email' | 'passwordHash' | 'displayName' | 'role' | 'status'
      >;
    }) => this.create(args),
    update: async (args: {
      where: { id: string };
      data: Partial<Pick<StoredUser, 'lastLoginAt' | 'preferredRegionId'>>;
    }) => this.update(args),
    count: async ({ where }: { where?: { status?: string } }) =>
      [...this.users.values()].filter(
        (user) => !where?.status || user.status === where.status,
      ).length,
  };

  private async findUnique(args: {
    where: { id?: string; email?: string };
  }): Promise<StoredUser | null> {
    if (args.where.id) {
      return this.clone(this.users.get(args.where.id) ?? null);
    }

    if (args.where.email) {
      const user =
        [...this.users.values()].find((entry) => entry.email === args.where.email) ??
        null;
      return this.clone(user);
    }

    return null;
  }

  private async create(args: {
    data: Pick<StoredUser, 'email' | 'passwordHash' | 'displayName' | 'role' | 'status'>;
  }): Promise<StoredUser> {
    const id = crypto.randomUUID();
    const now = new Date();
    const user: StoredUser = {
      id,
      email: args.data.email,
      passwordHash: args.data.passwordHash,
      displayName: args.data.displayName,
      role: args.data.role,
      status: args.data.status,
      preferredRegionId: null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);
    return this.clone(user) as StoredUser;
  }

  private async update(args: {
    where: { id: string };
    data: Partial<Pick<StoredUser, 'lastLoginAt' | 'preferredRegionId'>>;
  }): Promise<StoredUser> {
    const existing = this.users.get(args.where.id);

    if (!existing) {
      throw new Error(`User ${args.where.id} not found`);
    }

    const updated: StoredUser = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };

    this.users.set(updated.id, updated);
    return this.clone(updated) as StoredUser;
  }

  private clone(user: StoredUser | null): StoredUser | null {
    return user ? structuredClone(user) : null;
  }

  readonly region = {
    findUnique: async ({
      where,
      select,
    }: {
      where: { id?: string; slug?: string };
      select?: { id?: boolean; slug?: boolean };
    }) => {
      const region =
        this.regions.find((entry) => entry.id === where.id || entry.slug === where.slug) ??
        null;
      if (!region) {
        return null;
      }
      if (select) {
        return {
          ...(select.id ? { id: region.id } : {}),
          ...(select.slug ? { slug: region.slug } : {}),
        };
      }
      return structuredClone(region);
    },
    findFirst: async () => structuredClone(this.regions[0]),
    count: async ({ where }: { where?: { implantationStatus?: string } }) =>
      this.regions.filter(
        (region) =>
          !where?.implantationStatus ||
          region.implantationStatus === where.implantationStatus,
      ).length,
    findMany: async () =>
      this.regions.map((region) => ({
        ...structuredClone(region),
        _count: {
          establishments: this.establishments.filter(
            (establishment) => establishment.regionId === region.id,
          ).length,
        },
        establishments: this.establishments
          .filter(
            (establishment) =>
              establishment.regionId === region.id && establishment.isActive,
          )
          .map((establishment) => ({
            ...structuredClone(establishment),
            productOffers: this.productOffers.filter(
              (offer) =>
                offer.establishmentId === establishment.id &&
                offer.isActive &&
                offer.availabilityStatus === 'available',
            ),
          })),
      })),
    create: async ({ data }: { data: any }) => {
      const region = {
        id: crypto.randomUUID(),
        publicSortOrder: 0,
        ...data,
      };
      this.regions.push(region);
      return structuredClone(region);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const region = this.regions.find((entry) => entry.id === where.id);
      if (!region) {
        throw new Error(`Region ${where.id} not found`);
      }
      Object.assign(region, data);
      return structuredClone(region);
    },
  };

  readonly establishment = {
    count: async ({ where }: { where?: { regionId?: string; isActive?: boolean } }) =>
      this.establishments.filter(
        (entry) =>
          (!where?.regionId || entry.regionId === where.regionId) &&
          (where?.isActive === undefined || entry.isActive === where.isActive),
      ).length,
    findMany: async () =>
      this.establishments.map((entry) => ({
        ...structuredClone(entry),
        region: structuredClone(
          this.regions.find((region) => region.id === entry.regionId),
        ),
      })),
    create: async ({ data }: { data: any }) => {
      const establishment = {
        id: crypto.randomUUID(),
        isActive: true,
        ...data,
      };
      this.establishments.push(establishment);
      return structuredClone(establishment);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const establishment = this.establishments.find((entry) => entry.id === where.id);
      if (!establishment) {
        throw new Error(`Establishment ${where.id} not found`);
      }
      Object.assign(establishment, data);
      return structuredClone(establishment);
    },
  };

  readonly catalogProduct = {
    count: async ({ where }: { where?: { isActive?: boolean } }) =>
      this.catalogProducts.filter(
        (entry) => where?.isActive === undefined || entry.isActive === where.isActive,
      ).length,
    findMany: async () =>
      this.catalogProducts.map((entry) => ({
        ...structuredClone(entry),
        aliases: [],
        productVariants: this.productVariants.filter(
          (variant) => variant.catalogProductId === entry.id,
        ),
        _count: {
          productOffers: this.productOffers.filter(
            (offer) => offer.catalogProductId === entry.id,
          ).length,
        },
      })),
    findUnique: async ({ where }: { where: { id: string } }) => {
      const product = this.catalogProducts.find((entry) => entry.id === where.id);
      if (!product) {
        return null;
      }

      return structuredClone(product);
    },
    create: async ({ data }: { data: any }) => {
      const product = { id: crypto.randomUUID(), isActive: true, ...data };
      this.catalogProducts.push(product);
      return structuredClone({ ...product, aliases: [] });
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const product = this.catalogProducts.find((entry) => entry.id === where.id);
      if (!product) {
        throw new Error(`Product ${where.id} not found`);
      }
      Object.assign(product, data);
      return structuredClone({ ...product, aliases: [] });
    },
  };

  readonly productVariant = {
    findMany: async () =>
      this.productVariants.map((entry) => ({
        ...structuredClone(entry),
        catalogProduct: structuredClone(
          this.catalogProducts.find((product) => product.id === entry.catalogProductId),
        ),
      })),
    findUnique: async ({ where }: { where: { id: string } }) => {
      const variant = this.productVariants.find((entry) => entry.id === where.id);
      return variant ? structuredClone(variant) : null;
    },
    create: async ({ data }: { data: any }) => {
      const variant = { id: crypto.randomUUID(), isActive: true, ...data };
      this.productVariants.push(variant);
      return structuredClone(variant);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const variant = this.productVariants.find((entry) => entry.id === where.id);
      if (!variant) {
        throw new Error(`Variant ${where.id} not found`);
      }
      Object.assign(variant, data);
      return structuredClone(variant);
    },
  };

  readonly productOffer = {
    count: async ({
      where,
    }: {
      where?: { isActive?: boolean; availabilityStatus?: string };
    }) =>
      this.productOffers.filter(
        (entry) =>
          (where?.isActive === undefined || entry.isActive === where.isActive) &&
          (!where?.availabilityStatus ||
            entry.availabilityStatus === where.availabilityStatus),
      ).length,
    findMany: async ({ where }: { where?: any }) => {
      let offers = [...this.productOffers];

      if (where?.catalogProductId) {
        offers = offers.filter((entry) => entry.catalogProductId === where.catalogProductId);
      }

      if (where?.establishment?.regionId) {
        const regionId = where.establishment.regionId;
        offers = offers.filter((entry) =>
          this.establishments.some(
            (establishment) =>
              establishment.id === entry.establishmentId &&
              establishment.regionId === regionId,
          ),
        );
      }

      return offers.map((entry) => {
        const catalogProduct = this.catalogProducts.find(
          (product) => product.id === entry.catalogProductId,
        )!;
        const productVariant = this.productVariants.find(
          (variant) => variant.id === entry.productVariantId,
        )!;
        const establishment = this.establishments.find(
          (candidate) => candidate.id === entry.establishmentId,
        )!;

        return {
          ...structuredClone(entry),
          catalogProduct: structuredClone(catalogProduct),
          productVariant: structuredClone(productVariant),
          establishment: {
            ...structuredClone(establishment),
            region: structuredClone(
              this.regions.find((region) => region.id === establishment.regionId),
            ),
          },
        };
      });
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const entry = this.productOffers.find((offer) => offer.id === where.id);
      if (!entry) {
        return null;
      }
      const catalogProduct = this.catalogProducts.find(
        (product) => product.id === entry.catalogProductId,
      )!;
      const productVariant = this.productVariants.find(
        (variant) => variant.id === entry.productVariantId,
      )!;
      const establishment = this.establishments.find(
        (candidate) => candidate.id === entry.establishmentId,
      )!;

      return {
        ...structuredClone(entry),
        catalogProduct: structuredClone(catalogProduct),
        productVariant: structuredClone(productVariant),
        establishment: {
          ...structuredClone(establishment),
          region: structuredClone(
            this.regions.find((region) => region.id === establishment.regionId),
          ),
        },
      };
    },
    create: async ({ data }: { data: any }) => {
      const offer = {
        id: crypto.randomUUID(),
        currencyCode: 'BRL',
        observedAt: new Date(),
        isActive: true,
        ...data,
      };
      this.productOffers.push(offer);
      return structuredClone(offer);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const offer = this.productOffers.find((entry) => entry.id === where.id);
      if (!offer) {
        throw new Error(`Offer ${where.id} not found`);
      }
      Object.assign(offer, data);
      return structuredClone(offer);
    },
  };

  readonly processingJob = {
    create: async ({ data }: { data: any }) => {
      const record = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };

      this.processingJobs.set(record.id, record);
      return structuredClone(record);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const existing = this.processingJobs.get(where.id);
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      this.processingJobs.set(where.id, updated);
      return structuredClone(updated);
    },
    count: async ({ where }: { where?: { status?: { in?: string[] } } }) =>
      [...this.processingJobs.values()].filter(
        (entry) =>
          !where?.status?.in || where.status.in.includes(entry.status),
      ).length,
    findMany: async () =>
      [...this.processingJobs.values()].map((entry) => structuredClone(entry)),
  };

  readonly optimizationRun = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const run = this.optimizationRuns.get(where.id);
      return run ? structuredClone(run) : null;
    },
    create: async ({ data }: { data: any }) => {
      const record = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        completedAt: null,
        totalEstimatedCost: null,
        estimatedSavings: null,
        summary: null,
        ...data,
      };

      this.optimizationRuns.set(record.id, record);
      return structuredClone(record);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const existing = this.optimizationRuns.get(where.id);
      const updated = {
        ...existing,
        ...data,
      };

      this.shoppingListRepository.setOptimizationSummary(updated.shoppingListId, {
        latestEstimatedSavings: updated.estimatedSavings,
        latestOptimizationStatus: updated.status,
        latestOptimizedAt: updated.completedAt
          ? new Date(updated.completedAt).toISOString()
          : undefined,
      });

      this.optimizationRuns.set(where.id, updated);
      return structuredClone(updated);
    },
    findFirst: async ({ where }: { where: { shoppingListId: string; userId: string } }) => {
      const latest = [...this.optimizationRuns.values()]
        .filter(
          (run) =>
            run.shoppingListId === where.shoppingListId && run.userId === where.userId,
        )
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )[0];

      if (!latest) {
        return null;
      }

      const selections = this.optimizationSelections
        .filter((selection) => selection.optimizationRunId === latest.id)
        .map((selection) => {
          const item = this.shoppingListRepository.findItemById(
            selection.shoppingListItemId,
          );
          const offer = selection.productOfferId
            ? this.storeOfferRepository.findById(selection.productOfferId)
            : null;

          return {
            ...selection,
            shoppingListItem: {
              requestedName: item?.requestedName ?? 'Item',
            },
            productOffer: offer
              ? {
                  priceAmount: offer.price,
                  sourceReference: offer.sourceReceiptLineItemId,
                  observedAt: new Date(offer.observedAt),
                  establishment: {
                    unitName: offer.storeName,
                    neighborhood: offer.neighborhood ?? '',
                  },
                }
              : null,
          };
        });

      return {
        ...structuredClone(latest),
        optimizationSelections: selections,
      };
    },
    count: async ({ where }: { where: { userId: string; status?: string } }) =>
      [...this.optimizationRuns.values()].filter(
        (run) =>
          run.userId === where.userId &&
          (!where.status || run.status === where.status),
      ).length,
    aggregate: async ({ where }: { where: { userId: string; status?: string } }) => {
      const total = [...this.optimizationRuns.values()]
        .filter(
          (run) =>
            run.userId === where.userId &&
            (!where.status || run.status === where.status),
        )
        .reduce(
          (current, run) => current + Number(run.estimatedSavings ?? 0),
          0,
        );

      return {
        _sum: {
          estimatedSavings: total,
        },
      };
    },
  };

  async $queryRaw() {
    const latestCompletedByList = new Map<string, any>();

    for (const run of this.optimizationRuns.values()) {
      if (run.status !== 'completed' || run.estimatedSavings === null) {
        continue;
      }

      const existing = latestCompletedByList.get(run.shoppingListId);
      if (
        !existing ||
        new Date(run.createdAt).getTime() > new Date(existing.createdAt).getTime()
      ) {
        latestCompletedByList.set(run.shoppingListId, run);
      }
    }

    const totalEstimatedSavings = [...latestCompletedByList.values()].reduce(
      (total, run) => total + Number(run.estimatedSavings ?? 0),
      0,
    );

    return [{ totalEstimatedSavings }];
  }

  readonly optimizationSelection = {
    deleteMany: async ({ where }: { where: { optimizationRunId: string } }) => {
      const retained = this.optimizationSelections.filter(
        (entry) => entry.optimizationRunId !== where.optimizationRunId,
      );
      this.optimizationSelections.length = 0;
      this.optimizationSelections.push(...retained);
      return { count: 0 };
    },
    createMany: async ({ data }: { data: any[] }) => {
      this.optimizationSelections.push(
        ...data.map((entry) => ({
          ...entry,
          estimatedCost:
            entry.estimatedCost !== null && entry.estimatedCost !== undefined
              ? Number(entry.estimatedCost)
              : null,
        })),
      );
      return { count: data.length };
    },
  };

  readonly shoppingList = {
    update: async ({ where, data }: { where: { id: string }; data: any }) => ({
      id: where.id,
      ...data,
    }),
    findMany: async () => {
      const lists = await this.shoppingListRepository.listAll();
      return lists.map((list) => {
        const user = this.users.get(list.userId) ?? null;
        const preferredRegion = list.preferredRegionId
          ? this.regions.find(
              (region) =>
                region.id === list.preferredRegionId || region.slug === list.preferredRegionId,
            ) ?? null
          : null;
        const latestOptimization = [...this.optimizationRuns.values()]
          .filter((run) => run.shoppingListId === list.id)
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          )[0];

        return {
          id: list.id,
          name: list.name,
          status: list.status,
          updatedAt: new Date(list.updatedAt),
          user: user
            ? {
                id: user.id,
                displayName: user.displayName,
                email: user.email,
              }
            : null,
          preferredRegion: preferredRegion
            ? {
                name: preferredRegion.name,
                stateCode: preferredRegion.stateCode,
              }
            : null,
          shoppingListItems: list.items.map((item: any) => ({ id: item.id })),
          optimizationRuns: latestOptimization ? [structuredClone(latestOptimization)] : [],
        };
      });
    },
    count: async ({ where }: { where?: { userId?: string } } = {}) =>
      where?.userId
        ? (await this.shoppingListRepository.listByUser(where.userId)).length
        : (await Promise.all(
            [...this.users.values()].map((user) =>
              this.shoppingListRepository.listByUser(user.id),
            ),
          )).flat().length,
  };

  readonly receiptRecord = {
    count: async () => 0,
  };

  async $transaction<T>(operations: Promise<T>[]) {
    return Promise.all(operations);
  }
}

export async function createUs1TestApp(): Promise<{
  app: INestApplication;
  queues: {
    receiptQueue: QueueStub;
    optimizationQueue: QueueStub;
  };
  auth: {
    registerCustomer: (
      email?: string,
    ) => Promise<{ accessToken: string; user: Record<string, unknown> }>;
  };
}> {
  process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
  const receiptQueue: QueueStub = {
    add: jest.fn(),
  };
  const optimizationQueue: QueueStub = {
    add: jest.fn(),
  };
  const shoppingListRepository = new InMemoryShoppingListRepository();
  const productMatchRepository = new InMemoryProductMatchRepository();
  const storeOfferRepository = new InMemoryStoreOfferRepository([
    {
      id: 'offer-test-arroz',
      catalogProductId: 'product-test-arroz',
      productVariantId: 'variant-test-arroz',
      canonicalName: 'arroz tipo 1 5kg',
      displayName: 'Arroz tipo 1 5kg',
      price: 22.9,
      quantityContext: '5 kg',
      availabilityStatus: 'available',
      confidenceScore: 0.95,
      sourceReceiptLineItemId: 'Seed local',
      observedAt: new Date('2026-04-26T10:00:00Z').toISOString(),
      storeId: 'est-test-1',
      storeName: 'Unidade Pinheiros',
      neighborhood: 'Pinheiros',
    },
    {
      id: 'offer-test-1',
      catalogProductId: 'product-test-1',
      productVariantId: 'variant-test-1',
      canonicalName: 'cafe torrado',
      displayName: 'Cafe Pilao 500g',
      price: 15.9,
      quantityContext: '500 g',
      availabilityStatus: 'available',
      confidenceScore: 0.95,
      sourceReceiptLineItemId: 'Painel admin',
      observedAt: new Date('2026-04-26T10:00:00Z').toISOString(),
      storeId: 'est-test-1',
      storeName: 'Unidade Pinheiros',
      neighborhood: 'Pinheiros',
    },
  ]);
  const userAccountMock = new PrismaUserAccountMock(
    shoppingListRepository,
    storeOfferRepository,
  );

  const moduleRef = await Test.createTestingModule({
    imports: [
      AuthModule,
      AdminModule,
      QueueModule,
      CatalogModule,
      ListsModule,
      PricingModule,
      RegionsModule,
      StoresModule,
      ReceiptsModule,
      OptimizationModule,
      JobsModule,
    ],
  })
    .overrideProvider(RECEIPT_PROCESSING_QUEUE)
    .useValue(receiptQueue)
    .overrideProvider(OPTIMIZATION_QUEUE)
    .useValue(optimizationQueue)
    .overrideProvider(ShoppingListRepository)
    .useValue(shoppingListRepository)
    .overrideProvider(ReceiptRecordRepository)
    .useValue(new InMemoryReceiptRecordRepository())
    .overrideProvider(ProductMatchRepository)
    .useValue(productMatchRepository)
    .overrideProvider(StoreOfferRepository)
    .useValue(storeOfferRepository)
    .overrideProvider(PrismaService)
    .useValue(userAccountMock)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  const receiptProcessor = moduleRef.get(ReceiptIngestionProcessor);
  const optimizationRunProcessor = moduleRef.get(OptimizationRunProcessor);

  receiptQueue.add = jest.fn().mockImplementation(async (_name, data: any) => {
    await receiptProcessor.process(data.receiptRecordId);
    return undefined;
  });

  optimizationQueue.add = jest.fn().mockImplementation(async (_name, data: any) => {
    await optimizationRunProcessor.process(data.optimizationRunId);
    return undefined;
  });

  return {
    app,
    queues: {
      receiptQueue,
      optimizationQueue,
    },
    auth: {
      registerCustomer: async (email = `user-${Date.now()}@pricely.local`) => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email,
            password: 'strong-password',
            displayName: 'Usuário de teste',
          })
          .expect(201);

        return {
          accessToken: response.body.accessToken as string,
          user: response.body.user as Record<string, unknown>,
        };
      },
    },
  };
}
