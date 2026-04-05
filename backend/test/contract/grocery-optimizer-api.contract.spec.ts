import request from 'supertest';

import { createUs1TestApp } from '../support/us1-app.factory';

describe('Grocery optimizer API contract', () => {
  it('matches the shopping list and optimization endpoint contract surface', async () => {
    const { app } = await createUs1TestApp();

    try {
      const shoppingListResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .send({
          name: 'Contract list',
          mode: 'multi_market',
        })
        .expect(201);

      expect(shoppingListResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Contract list',
          mode: 'multi_market',
          status: 'draft',
          items: expect.any(Array),
        }),
      );

      const shoppingListId = shoppingListResponse.body.id as string;

      const addItemsResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/items`)
        .send({
          items: [{ requestedName: 'Cafe Torrado', quantity: 1 }],
        })
        .expect(201);

      expect(addItemsResponse.body.items[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          requestedName: 'Cafe Torrado',
          normalizedName: expect.any(String),
          resolutionStatus: expect.stringMatching(
            /unresolved|matched|partially_matched|unavailable/,
          ),
        }),
      );

      const optimizationResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/optimize`)
        .send({ mode: 'multi_market' })
        .expect(201);

      expect(optimizationResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          shoppingListId,
          mode: 'multi_market',
          totalEstimatedCost: expect.any(Number),
          coverageStatus: expect.stringMatching(/complete|partial/),
          generatedAt: expect.any(String),
          selections: expect.any(Array),
        }),
      );
    } finally {
      await app.close();
    }
  });
});
