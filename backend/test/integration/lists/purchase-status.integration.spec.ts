import request from 'supertest';

import { createUs1TestApp } from '../../support/us1-app.factory';

describe('Shopping-list purchase status integration', () => {
  it('persists purchased and pending item states through the dedicated checklist endpoint', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer();

      const shoppingListResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          name: 'Checklist',
          preferredRegionId: 'sao-paulo-sp',
        })
        .expect(201);

      const withItemsResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListResponse.body.id}/items`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          items: [{ requestedName: 'Arroz tipo 1 1kg', quantity: 1 }],
        })
        .expect(201);

      const itemId = withItemsResponse.body.items[0].id as string;

      const purchasedResponse = await request(app.getHttpServer())
        .patch(
          `/shopping-lists/${shoppingListResponse.body.id}/items/${itemId}/purchase-status`,
        )
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ purchaseStatus: 'purchased' })
        .expect(200);

      expect(purchasedResponse.body.items[0]).toEqual(
        expect.objectContaining({
          id: itemId,
          purchaseStatus: 'purchased',
        }),
      );

      const pendingResponse = await request(app.getHttpServer())
        .patch(
          `/shopping-lists/${shoppingListResponse.body.id}/items/${itemId}/purchase-status`,
        )
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ purchaseStatus: 'pending' })
        .expect(200);

      expect(pendingResponse.body.items[0]).toEqual(
        expect.objectContaining({
          id: itemId,
          purchaseStatus: 'pending',
        }),
      );
    } finally {
      await app.close();
    }
  });
});
