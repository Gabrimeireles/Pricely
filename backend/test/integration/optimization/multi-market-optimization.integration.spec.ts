import request from 'supertest';

import { createUs1TestApp } from '../../support/us1-app.factory';

describe('Multi-market optimization integration', () => {
  it('creates a list, ingests receipts, and returns the cheapest valid plan', async () => {
    const { app, queues } = await createUs1TestApp();

    try {
      const listResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .send({
          name: 'Weekly groceries',
          mode: 'multi_market',
        })
        .expect(201);

      const shoppingListId = listResponse.body.id as string;

      await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/items`)
        .send({
          items: [
            { requestedName: 'Arroz Branco tp1 5kg', quantity: 1 },
            { requestedName: 'Leite Integral 1L', quantity: 2 },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/receipts')
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
        .send({
          mode: 'multi_market',
        })
        .expect(201);

      expect(optimizationResponse.body.coverageStatus).toBe('complete');
      expect(optimizationResponse.body.totalEstimatedCost).toBe(40.88);
      expect(optimizationResponse.body.selections).toHaveLength(2);
      expect(queues.optimizationQueue.add).toHaveBeenCalledTimes(1);

      const latestResponse = await request(app.getHttpServer())
        .get(`/shopping-lists/${shoppingListId}/optimizations/latest`)
        .expect(200);

      expect(latestResponse.body.id).toBe(optimizationResponse.body.id);
      expect(latestResponse.body.explanationSummary).toEqual(expect.any(String));
    } finally {
      await app.close();
    }
  });
});
