import request from 'supertest';

import { PrismaService } from '../../../src/persistence/prisma.service';
import { createUs1TestApp } from '../../support/us1-app.factory';

describe('product media upload integration', () => {
  it('stores catalog product imagery through the admin API', async () => {
    const { app } = await createUs1TestApp();

    try {
      const prisma = app.get(PrismaService);
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `admin-media-${Date.now()}@pricely.local`,
          password: 'admin-password',
          displayName: 'Admin Media',
        })
        .expect(201);

      await prisma.userAccount.update({
        where: { id: registerResponse.body.user.id as string },
        data: { role: 'admin' },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerResponse.body.user.email,
          password: 'admin-password',
        })
        .expect(200);

      const uploadResponse = await request(app.getHttpServer())
        .post('/admin/catalog-products/product-test-1/image')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`)
        .attach('file', Buffer.from('fake-png-data'), {
          filename: 'produto.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(uploadResponse.body).toEqual(
        expect.objectContaining({
          id: 'product-test-1',
          imageUrl: expect.stringContaining('/media/catalog-products/'),
        }),
      );
    } finally {
      await app.close();
    }
  });
});
