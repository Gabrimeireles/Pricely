import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AdminModule } from '../../../src/admin/admin.module';
import { AuthModule } from '../../../src/auth/auth.module';
import { HttpExceptionFilter } from '../../../src/common/errors/http-exception.filter';
import { AppValidationPipe } from '../../../src/common/validation/validation.pipe';
import { PrismaService } from '../../../src/persistence/prisma.service';

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  preferredRegionId?: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

class AdminPrismaMock {
  private readonly users = new Map<string, StoredUser>();
  private readonly regions = [
    {
      id: 'region-1',
      slug: 'sao-paulo-sp',
      name: 'Sao Paulo',
      stateCode: 'SP',
      implantationStatus: 'active',
      publicSortOrder: 1,
      _count: { establishments: 1 },
    },
  ];

  readonly userAccount = {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) {
        return this.users.get(where.id) ?? null;
      }
      return [...this.users.values()].find((user) => user.email === where.email) ?? null;
    },
    create: async ({ data }: { data: Pick<StoredUser, 'email' | 'passwordHash' | 'displayName' | 'role' | 'status'> }) => {
      const now = new Date();
      const user: StoredUser = {
        id: crypto.randomUUID(),
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        role: data.role,
        status: data.status,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      };
      this.users.set(user.id, user);
      return user;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<StoredUser> }) => {
      const existing = this.users.get(where.id)!;
      const updated = { ...existing, ...data, updatedAt: new Date() };
      this.users.set(updated.id, updated);
      return updated;
    },
    count: async () => 2,
  };

  readonly shoppingList = {
    count: async () => 4,
    findMany: async () => [
      {
        id: 'list-1',
        name: 'Compra mensal',
        status: 'ready',
        updatedAt: new Date('2026-04-27T10:05:00Z'),
        user: {
          id: 'user-1',
          displayName: 'Cliente 1',
          email: 'cliente1@pricely.local',
        },
        preferredRegion: {
          name: 'Sao Paulo',
          stateCode: 'SP',
        },
        shoppingListItems: [{ id: 'item-1' }, { id: 'item-2' }],
        optimizationRuns: [
          {
            id: 'run-1',
            mode: 'global_full',
            status: 'completed',
            estimatedSavings: 18.5,
            totalEstimatedCost: 82.4,
            coverageStatus: 'complete',
            createdAt: new Date('2026-04-27T10:04:00Z'),
            completedAt: new Date('2026-04-27T10:05:00Z'),
          },
        ],
      },
    ],
  };
  readonly optimizationRun = {
    count: async () => 7,
    aggregate: async () => ({ _sum: { estimatedSavings: 88.4 } }),
  };
  readonly receiptRecord = { count: async () => 0 };
  readonly processingJob = { count: async () => 3 };
  readonly region = {
    count: async () => 1,
    findMany: async () => this.regions,
    create: async ({ data }: { data: any }) => {
      const region = { id: crypto.randomUUID(), _count: { establishments: 0 }, ...data };
      this.regions.push(region);
      return region;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const region = this.regions.find((entry) => entry.id === where.id)!;
      Object.assign(region, data);
      return region;
    },
  };
  readonly establishment = {
    count: async () => 5,
    findMany: async () => [],
    create: async ({ data }: { data: any }) => ({ id: crypto.randomUUID(), region: { id: data.regionId, name: 'Sao Paulo', slug: 'sao-paulo-sp', stateCode: 'SP' }, ...data }),
    update: async ({ where, data }: { where: { id: string }; data: any }) => ({ id: where.id, ...data }),
  };
  readonly catalogProduct = {
    count: async () => 9,
    findMany: async () => [],
    create: async ({ data }: { data: any }) => ({
      id: crypto.randomUUID(),
      aliases: [],
      productVariants: [],
      _count: { productOffers: 0 },
      ...data,
    }),
    update: async ({ where, data }: { where: { id: string }; data: any }) => ({
      id: where.id,
      aliases: [],
      productVariants: [],
      ...data,
    }),
  };
  readonly productVariant = {
    findMany: async () => [],
    create: async ({ data }: { data: any }) => ({ id: crypto.randomUUID(), ...data }),
    update: async ({ where, data }: { where: { id: string }; data: any }) => ({ id: where.id, ...data }),
  };
  readonly productOffer = {
    count: async () => 12,
    findMany: async () => [],
    create: async ({ data }: { data: any }) => ({ id: crypto.randomUUID(), ...data }),
    update: async ({ where, data }: { where: { id: string }; data: any }) => ({ id: where.id, ...data }),
  };
}

describe('Admin dashboard integration', () => {
  let app: INestApplication;
  let prismaMock: AdminPrismaMock;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    prismaMock = new AdminPrismaMock();

    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, AdminModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows an admin session to read metrics and create/update core admin records', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@pricely.local',
        password: 'admin-password',
        displayName: 'Admin Pricely',
      })
      .expect(201);

    const adminUserId = register.body.user.id as string;
    await prismaMock.userAccount.update({
      where: { id: adminUserId },
      data: { role: 'admin' },
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@pricely.local',
        password: 'admin-password',
      })
      .expect(200);

    const token = login.body.accessToken as string;

    const metrics = await request(app.getHttpServer())
      .get('/admin/metrics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(metrics.body).toEqual(
      expect.objectContaining({
        activeUsers: 2,
        activeRegions: 1,
        activeOffers: 12,
        globalEstimatedSavings: 88.4,
      }),
    );

    const adminShoppingLists = await request(app.getHttpServer())
      .get('/admin/shopping-lists')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(adminShoppingLists.body).toEqual(expect.any(Array));

    const createRegion = await request(app.getHttpServer())
      .post('/admin/regions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'campinas-sp',
        name: 'Campinas',
        stateCode: 'SP',
        implantationStatus: 'activating',
        publicSortOrder: 2,
      })
      .expect(201);

    expect(createRegion.body).toEqual(
      expect.objectContaining({
        slug: 'campinas-sp',
        name: 'Campinas',
      }),
    );

    const createProduct = await request(app.getHttpServer())
      .post('/admin/catalog-products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'cafe-torrado-500g',
        name: 'Cafe torrado 500g',
        category: 'mercearia',
        defaultUnit: 'un',
      })
      .expect(201);

    expect(createProduct.body).toEqual(
      expect.objectContaining({
        slug: 'cafe-torrado-500g',
        name: 'Cafe torrado 500g',
      }),
    );

    const updateRegion = await request(app.getHttpServer())
      .patch(`/admin/regions/${createRegion.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        implantationStatus: 'active',
      })
      .expect(200);

    expect(updateRegion.body).toEqual(
      expect.objectContaining({
        id: createRegion.body.id,
        implantationStatus: 'active',
      }),
    );

    const createEstablishment = await request(app.getHttpServer())
      .post('/admin/establishments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        brandName: 'Mercado Centro',
        unitName: 'Unidade Centro',
        cnpj: '00.000.000/0001-00',
        cityName: 'Campinas',
        neighborhood: 'Centro',
        regionId: createRegion.body.id,
      })
      .expect(201);

    expect(createEstablishment.body).toEqual(
      expect.objectContaining({
        brandName: 'Mercado Centro',
        unitName: 'Unidade Centro',
      }),
    );

    const updateEstablishment = await request(app.getHttpServer())
      .patch(`/admin/establishments/${createEstablishment.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isActive: false,
      })
      .expect(200);

    expect(updateEstablishment.body).toEqual(
      expect.objectContaining({
        id: createEstablishment.body.id,
        isActive: false,
      }),
    );

    const createVariant = await request(app.getHttpServer())
      .post('/admin/product-variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        catalogProductId: createProduct.body.id,
        slug: 'cafe-pilao-500g',
        displayName: 'Cafe Pilao 500g',
        brandName: 'Pilao',
        packageLabel: '500 g',
      })
      .expect(201);

    expect(createVariant.body).toEqual(
      expect.objectContaining({
        catalogProductId: createProduct.body.id,
        displayName: 'Cafe Pilao 500g',
      }),
    );

    const updateVariant = await request(app.getHttpServer())
      .patch(`/admin/product-variants/${createVariant.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isActive: false,
      })
      .expect(200);

    expect(updateVariant.body).toEqual(
      expect.objectContaining({
        id: createVariant.body.id,
        isActive: false,
      }),
    );

    const createOffer = await request(app.getHttpServer())
      .post('/admin/offers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        catalogProductId: createProduct.body.id,
        productVariantId: createVariant.body.id,
        establishmentId: createEstablishment.body.id,
        displayName: 'Cafe Pilao 500g',
        packageLabel: '500 g',
        priceAmount: 15.9,
        availabilityStatus: 'available',
        confidenceLevel: 'high',
      })
      .expect(201);

    expect(createOffer.body).toEqual(
      expect.objectContaining({
        displayName: 'Cafe Pilao 500g',
      }),
    );

    const updateOffer = await request(app.getHttpServer())
      .patch(`/admin/offers/${createOffer.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isActive: false,
      })
      .expect(200);

    expect(updateOffer.body).toEqual(
      expect.objectContaining({
        id: createOffer.body.id,
        isActive: false,
      }),
    );
  });
});
