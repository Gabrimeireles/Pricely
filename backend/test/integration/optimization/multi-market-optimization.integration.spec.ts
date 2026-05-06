import request from 'supertest';

import { createUs1TestApp } from '../../support/us1-app.factory';

describe('Multi-market optimization integration', () => {
  it('creates a list, ingests receipts, and returns the cheapest valid plan', async () => {
    const { app, queues, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer();

      const listResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          name: 'Weekly groceries',
          lastMode: 'global_full',
        })
        .expect(201);

      const shoppingListId = listResponse.body.id as string;

      await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/items`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          items: [
            { requestedName: 'Arroz Branco tp1 5kg', quantity: 1 },
            { requestedName: 'Leite Integral 1L', quantity: 2 },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/receipts')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          storeName: 'Store A',
          items: [
            { rawProductName: 'Arroz Branco tp1 5kg', unitPrice: 31.9 },
            { rawProductName: 'Leite Integral 1L', unitPrice: 5.99 },
          ],
        })
        .expect(202);

      await request(app.getHttpServer())
        .post('/receipts')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          storeName: 'Store B',
          items: [
            { rawProductName: 'Arroz Branco tp1 5kg', unitPrice: 29.9 },
            { rawProductName: 'Leite Integral 1L', unitPrice: 5.49 },
          ],
        })
        .expect(202);

      const optimizationResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/optimize`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          mode: 'global_full',
        })
        .expect(201);

      expect(optimizationResponse.body.status).toBe('queued');
      expect(optimizationResponse.body.jobId).toEqual(expect.any(String));
      expect(queues.optimizationQueue.add).toHaveBeenCalledTimes(1);

      const latestResponse = await request(app.getHttpServer())
        .get(`/shopping-lists/${shoppingListId}/optimizations/latest`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);

      expect(latestResponse.body.id).toBe(optimizationResponse.body.id);
      expect(latestResponse.body.coverageStatus).toBe('complete');
      expect(latestResponse.body.totalEstimatedCost).toBe(40.88);
      expect(latestResponse.body.selections).toHaveLength(2);
      expect(latestResponse.body.explanationSummary).toEqual(expect.any(String));
    } finally {
      await app.close();
    }
  });

  it('returns a complete optimization result for a catalog-backed item selected from a live public offer', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer('catalog-backed@pricely.local');

      const offersResponse = await request(app.getHttpServer())
        .get('/regions/sao-paulo-sp/offers')
        .expect(200);

      const arrozOffer = offersResponse.body.offers.find(
        (offer: { productName: string }) => offer.productName === 'Arroz tipo 1 5kg',
      );

      expect(arrozOffer).toBeDefined();

      const listResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          name: 'Catalog-backed groceries',
          lastMode: 'global_full',
          regionSlug: 'sao-paulo-sp',
        })
        .expect(201);

      const shoppingListId = listResponse.body.id as string;

      await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/items`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          items: [
            {
              requestedName: 'Arroz',
              quantity: 1,
              catalogProductId: arrozOffer.catalogProductId,
              brandPreferenceMode: 'any',
            },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/optimize`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          mode: 'global_full',
        })
        .expect(201);

      const latestResponse = await request(app.getHttpServer())
        .get(`/shopping-lists/${shoppingListId}/optimizations/latest`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);

      expect(latestResponse.body.coverageStatus).toBe('complete');
      expect(latestResponse.body.totalEstimatedCost).toBe(22.9);
      expect(latestResponse.body.selections).toHaveLength(1);
      expect(latestResponse.body.selections[0]).toEqual(
        expect.objectContaining({
          shoppingListItemName: 'Arroz',
          selectionStatus: 'selected',
          establishmentName: 'Unidade Pinheiros',
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('rejects optimization when a non-premium user has no available tokens', async () => {
    const previousGrant = process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH;
    process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH = '0';
    const { app, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer('no-tokens@pricely.local');
      const listResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          name: 'Limited groceries',
          lastMode: 'global_full',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/shopping-lists/${listResponse.body.id}/optimize`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          mode: 'global_full',
        })
        .expect(402);
    } finally {
      if (previousGrant === undefined) {
        delete process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH;
      } else {
        process.env.FREE_OPTIMIZATION_TOKENS_PER_MONTH = previousGrant;
      }
      await app.close();
    }
  });
});
