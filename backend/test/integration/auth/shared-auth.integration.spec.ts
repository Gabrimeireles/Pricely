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
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaUserAccountMock {
  private readonly users = new Map<string, StoredUser>();

  seed(user: StoredUser): void {
    this.users.set(user.id, structuredClone(user));
  }

  async findUnique(args: {
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

  async create(args: {
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
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);
    return this.clone(user) as StoredUser;
  }

  async update(args: {
    where: { id: string };
    data: Partial<Pick<StoredUser, 'lastLoginAt' | 'displayName' | 'status'>>;
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

  readonly shoppingList = {
    count: async () => 0,
  };

  readonly optimizationRun = {
    count: async () => 0,
    aggregate: async () => ({
      _sum: {
        estimatedSavings: 0,
      },
    }),
  };

  readonly receiptRecord = {
    count: async () => 0,
  };
}

describe('Shared auth integration', () => {
  let app: INestApplication;
  let userAccountMock: PrismaUserAccountMock;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    userAccountMock = new PrismaUserAccountMock();

    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, AdminModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        userAccount: userAccountMock,
        shoppingList: userAccountMock.shoppingList,
        optimizationRun: userAccountMock.optimizationRun,
        receiptRecord: userAccountMock.receiptRecord,
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a customer account and returns a shared session payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'cliente@pricely.local',
        password: 'strong-password',
        displayName: 'Cliente Pricely',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          email: 'cliente@pricely.local',
          role: 'customer',
          profileStats: expect.objectContaining({
            totalEstimatedSavings: 0,
            shoppingListsCount: 0,
            completedOptimizationRuns: 0,
            contributionsCount: 0,
            receiptSubmissionsCount: 0,
            offerReportsCount: 0,
          }),
        }),
      }),
    );
  });

  it('authenticates an existing account and exposes /auth/me with the same identity', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@pricely.local',
        password: 'admin-password',
        displayName: 'Admin Pricely',
      })
      .expect(201);

    const createdUserId = registerResponse.body.user.id as string;
    await userAccountMock.update({
      where: { id: createdUserId },
      data: {},
    });

    const storedUser = await userAccountMock.findUnique({
      where: { id: createdUserId },
    });

    userAccountMock.seed({
      ...(storedUser as StoredUser),
      role: 'admin',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@pricely.local',
        password: 'admin-password',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meResponse.body).toEqual(
      expect.objectContaining({
        email: 'admin@pricely.local',
        role: 'admin',
        profileStats: expect.any(Object),
      }),
    );
  });

  it('enforces admin-only access on protected dashboard endpoints', async () => {
    const customerRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'customer-role@pricely.local',
        password: 'customer-password',
        displayName: 'Customer Role',
      })
      .expect(201);

    const customerToken = customerRegister.body.accessToken as string;

    await request(app.getHttpServer())
      .get('/admin/access-check')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const adminRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'dashboard-admin@pricely.local',
        password: 'dashboard-password',
        displayName: 'Dashboard Admin',
      })
      .expect(201);

    const adminUserId = adminRegister.body.user.id as string;
    const adminUser = await userAccountMock.findUnique({
      where: { id: adminUserId },
    });

    userAccountMock.seed({
      ...(adminUser as StoredUser),
      role: 'admin',
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'dashboard-admin@pricely.local',
        password: 'dashboard-password',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/admin/access-check')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken as string}`)
      .expect(200)
      .expect({
        status: 'ok',
      });
  });
});
