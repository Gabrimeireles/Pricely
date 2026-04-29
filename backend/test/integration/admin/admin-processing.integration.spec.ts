import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import request from 'supertest';

import { AdminModule } from '../../../src/admin/admin.module';
import { AuthModule } from '../../../src/auth/auth.module';
import { HttpExceptionFilter } from '../../../src/common/errors/http-exception.filter';
import { AppValidationPipe } from '../../../src/common/validation/validation.pipe';
import { PrismaService } from '../../../src/persistence/prisma.service';

class AdminProcessingPrismaMock {
  private readonly adminUser = {
    id: 'admin-1',
    email: 'admin@pricely.local',
    passwordHash: hashSync('admin-password', 10),
    displayName: 'Admin',
    role: 'admin',
    status: 'active',
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  readonly userAccount = {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.email === 'admin@pricely.local') {
        return this.adminUser;
      }
      if (where.id === 'admin-1') {
        return this.adminUser;
      }
      return null;
    },
    create: async () => ({
      id: 'admin-1',
      email: 'admin@pricely.local',
      passwordHash: '$2b$10$zwG4Q/3hD4q0wV0WJQ6FmOpIHrjMTY1l8A8N2R9n4nD4UO7xN3Vmy',
      displayName: 'Admin',
      role: 'customer',
      status: 'active',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async () => ({
      id: 'admin-1',
      email: 'admin@pricely.local',
      passwordHash: '$2b$10$zwG4Q/3hD4q0wV0WJQ6FmOpIHrjMTY1l8A8N2R9n4nD4UO7xN3Vmy',
      displayName: 'Admin',
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    count: async () => 1,
  };

  readonly shoppingList = { count: async () => 2 };
  readonly optimizationRun = { count: async () => 3 };
  readonly receiptRecord = { count: async () => 0 };
  readonly region = { count: async () => 1 };
  readonly establishment = { count: async () => 1 };
  readonly catalogProduct = { count: async () => 1 };
  readonly productOffer = { count: async () => 2 };
  readonly processingJob = {
    count: async ({ where }: any) =>
      where?.status?.in ? 2 : 4,
    findMany: async () => [
      {
        id: 'job-queued',
        queueName: 'optimization',
        jobType: 'optimization',
        resourceType: 'shopping_list',
        resourceId: 'list-1',
        status: 'queued',
        attemptCount: 0,
        failureReason: null,
        createdAt: new Date('2026-04-27T10:00:00Z'),
        updatedAt: new Date('2026-04-27T10:00:00Z'),
        finishedAt: null,
      },
      {
        id: 'job-retrying',
        queueName: 'optimization',
        jobType: 'optimization',
        resourceType: 'shopping_list',
        resourceId: 'list-2',
        status: 'retrying',
        attemptCount: 2,
        failureReason: 'temporary upstream failure',
        createdAt: new Date('2026-04-27T10:10:00Z'),
        updatedAt: new Date('2026-04-27T10:15:00Z'),
        finishedAt: null,
      },
    ],
  };
}

describe('Admin processing diagnostics integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, AdminModule],
    })
      .overrideProvider(PrismaService)
      .useValue(new AdminProcessingPrismaMock())
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes processing job diagnostics and queue health to admins', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@pricely.local',
        password: 'admin-password',
      })
      .expect(200);

    const token = login.body.accessToken as string;

    const jobs = await request(app.getHttpServer())
      .get('/admin/processing-jobs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(jobs.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'job-retrying',
          status: 'retrying',
          failureReason: 'temporary upstream failure',
        }),
        expect.objectContaining({
          id: 'job-queued',
          status: 'queued',
        }),
      ]),
    );

    const health = await request(app.getHttpServer())
      .get('/admin/queue-health')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(health.body).toEqual(
      expect.objectContaining({
        queuedJobs: 2,
        jobsByStatus: expect.objectContaining({
          queued: 1,
          retrying: 1,
        }),
      }),
    );
  });
});
