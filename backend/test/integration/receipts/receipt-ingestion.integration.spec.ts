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
        trustLevel: 'trusted',
        moderationStatus: 'accepted',
        rewardEligibilityStatus: 'eligible_pending',
        rewardPoints: 100,
        rewardOptimizationTokens: 1,
        rewardMessage:
          'Nota recebida: reward em processamento ate a liberacao e validacao.',
        reviewReason: 'receipt_reward_ready',
        processingStatus: 'waiting_manual_release',
        dataNotice:
          'Prices and receipt data are based on receipts provided by users.',
      });
      expect(response.body.id).toEqual(expect.stringContaining('rr_'));
      expect(response.body.jobId).toBeUndefined();
      expect(response.body.confidenceScore).toBeGreaterThan(0.8);
      expect(queues.receiptQueue.add).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
