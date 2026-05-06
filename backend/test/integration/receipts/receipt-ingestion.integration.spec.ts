import request from 'supertest';

import { createUs1TestApp } from '../../support/us1-app.factory';

describe('Receipt ingestion integration', () => {
  it('accepts a receipt payload and returns a structured receipt record', async () => {
    const { app, queues, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer('receipt-user@pricely.local');

      const response = await request(app.getHttpServer())
        .post('/receipts')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          storeName: 'Atacadao',
          sourceType: 'manual_entry',
          items: [
            {
              rawProductName: 'Arroz Branco tp1 5kg',
              ean: '7891234567895',
              quantity: 1,
              unitPrice: 29.9,
            },
          ],
        })
        .expect(202);

      expect(response.body).toMatchObject({
        storeId: 'store_atacadao',
        parseStatus: 'parsed',
        dataNotice: 'Prices and receipt data are based on receipts provided by users.',
      });
      expect(response.body.id).toEqual(expect.stringContaining('rr_'));
      expect(response.body.jobId).toEqual(expect.any(String));
      expect(response.body.confidenceScore).toBeGreaterThan(0.8);
      expect(queues.receiptQueue.add).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });
});
