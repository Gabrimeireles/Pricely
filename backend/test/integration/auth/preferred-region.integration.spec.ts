import request from 'supertest';

import { createUs1TestApp } from '../../support/us1-app.factory';

describe('preferred region integration', () => {
  it('persists the preferred region selection on the authenticated user profile', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer();

      expect(session.user.preferredRegionSlug).toBeNull();

      const updateResponse = await request(app.getHttpServer())
        .patch('/auth/preferred-region')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          regionSlug: 'sao-paulo-sp',
        })
        .expect(200);

      expect(updateResponse.body).toEqual(
        expect.objectContaining({
          preferredRegionSlug: 'sao-paulo-sp',
        }),
      );

      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);

      expect(meResponse.body).toEqual(
        expect.objectContaining({
          preferredRegionSlug: 'sao-paulo-sp',
        }),
      );
    } finally {
      await app.close();
    }
  });
});
