import request from 'supertest';

import { createUs1TestApp } from '../support/us1-app.factory';

describe('API security hardening', () => {
  it('rejects unauthenticated admin access and customer role escalation', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      await request(app.getHttpServer()).get('/admin/metrics').expect(401);
      await request(app.getHttpServer())
        .get('/admin/metrics/public-search')
        .expect(401);

      const session = await auth.registerCustomer(
        'security-user@pricely.local',
      );

      await request(app.getHttpServer())
        .get('/admin/metrics')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(403);
    } finally {
      await app.close();
    }
  });

  it('handles malformed identifiers and SQL injection-shaped route input safely', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer('malformed-id@pricely.local');

      await request(app.getHttpServer())
        .get('/shopping-lists/not-a-valid-id')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect((response) => {
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.status).toBeLessThan(500);
        });

      await request(app.getHttpServer())
        .get("/regions/' OR 1=1 --/offers")
        .expect((response) => {
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.status).toBeLessThan(500);
        });
    } finally {
      await app.close();
    }
  });

  it('keeps billing webhook routes unavailable while Phase 19 is locked', async () => {
    const { app } = await createUs1TestApp();

    try {
      await request(app.getHttpServer())
        .post('/billing/webhooks/stripe')
        .set('Stripe-Signature', 'replayed-signature')
        .send({ id: 'evt_replay' })
        .expect(404);
    } finally {
      await app.close();
    }
  });
});
