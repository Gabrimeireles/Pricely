import request from 'supertest';

import { PrismaService } from '../../../src/persistence/prisma.service';
import { createUs1TestApp } from '../../support/us1-app.factory';

describe('Processing jobs integration', () => {
  it('persists queued and completed optimization jobs for admin diagnostics', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const customer = await auth.registerCustomer();

      const createListResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({ name: 'Queue test' })
        .expect(201);

      const optimizeResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${createListResponse.body.id}/optimize`)
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({ mode: 'global_full' })
        .expect(201);

      const adminRegisterResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `admin-queue-${Date.now()}@pricely.local`,
          password: 'admin-password',
          displayName: 'Admin Queue',
        })
        .expect(201);

      const prisma = app.get(PrismaService);
      await prisma.userAccount.update({
        where: { id: adminRegisterResponse.body.user.id },
        data: { role: 'admin' },
      });

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminRegisterResponse.body.user.email,
          password: 'admin-password',
        })
        .expect(200);

      const token = adminLoginResponse.body.accessToken as string;

      const jobsResponse = await request(app.getHttpServer())
        .get('/admin/processing-jobs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(jobsResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: optimizeResponse.body.jobId,
            queueName: 'optimization',
            resourceType: 'shopping_list',
            resourceId: createListResponse.body.id,
          }),
        ]),
      );

      const queueHealthResponse = await request(app.getHttpServer())
        .get('/admin/queue-health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(queueHealthResponse.body.queues).toContain('optimization');
      expect(queueHealthResponse.body.jobsByStatus).toEqual(expect.any(Object));
    } finally {
      await app.close();
    }
  });
});
