import request from 'supertest';

import { createUs1TestApp } from '../../support/us1-app.factory';

describe('PostgreSQL relation regression integration', () => {
  it('preserves catalog product, variant, and offer links across public reads and exact optimization', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer();

      const offersResponse = await request(app.getHttpServer())
        .get('/regions/sao-paulo-sp/offers')
        .expect(200);

      expect(offersResponse.body.offers[0]).toEqual(
        expect.objectContaining({
          id: 'offer-test-1',
          catalogProductId: 'product-test-1',
          productVariantId: 'variant-test-1',
        }),
      );

      const detailResponse = await request(app.getHttpServer())
        .get('/offers/offer-test-1')
        .expect(200);

      expect(detailResponse.body).toEqual(
        expect.objectContaining({
          product: expect.objectContaining({
            id: 'product-test-1',
            name: 'Cafe torrado',
          }),
          variant: expect.objectContaining({
            id: 'variant-test-1',
            displayName: 'Cafe Pilao 500g',
          }),
        }),
      );

      const listResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          name: 'Cafe da semana',
          preferredRegionId: 'sao-paulo-sp',
          lastMode: 'global_full',
        })
        .expect(201);

      const shoppingListId = listResponse.body.id as string;

      await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/items`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          items: [
            {
              requestedName: 'Cafe torrado 500g',
              catalogProductId: 'product-test-1',
              lockedProductVariantId: 'variant-test-1',
              brandPreferenceMode: 'exact',
              quantity: 1,
              unitLabel: 'un',
            },
          ],
        })
        .expect(201);

      const listsResponse = await request(app.getHttpServer())
        .get('/shopping-lists')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);

      expect(listsResponse.body[0]).toEqual(
        expect.objectContaining({
          id: shoppingListId,
          preferredRegionId: 'sao-paulo-sp',
          items: [
            expect.objectContaining({
              requestedName: 'Cafe torrado 500g',
              catalogProductId: 'product-test-1',
              lockedProductVariantId: 'variant-test-1',
              brandPreferenceMode: 'exact',
            }),
          ],
        }),
      );

    } finally {
      await app.close();
    }
  });
});
