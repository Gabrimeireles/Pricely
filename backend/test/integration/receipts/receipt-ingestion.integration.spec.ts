import request from 'supertest';

import { createUs1TestApp } from '../../support/us1-app.factory';

describe('Receipt ingestion integration', () => {
  let previousProcessingMode: string | undefined;

  beforeEach(() => {
    previousProcessingMode = process.env.RECEIPT_PROCESSING_MODE;
    delete process.env.RECEIPT_PROCESSING_MODE;
  });

  afterEach(() => {
    if (previousProcessingMode === undefined) {
      delete process.env.RECEIPT_PROCESSING_MODE;
    } else {
      process.env.RECEIPT_PROCESSING_MODE = previousProcessingMode;
    }
  });

  it('keeps a trusted receipt waiting for manual release by default', async () => {
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

  it('allows an admin to release a manually queued receipt for processing', async () => {
    const { app, queues, auth } = await createUs1TestApp();

    try {
      const customer = await auth.registerCustomer(
        'manual-release-receipt@pricely.local',
      );
      const admin = await auth.registerAdmin('receipt-admin@pricely.local');

      const receipt = await request(app.getHttpServer())
        .post('/receipts')
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({
          storeName: 'Mercado Manual',
          sourceType: 'manual_entry',
          items: [
            {
              rawProductName: 'Leite Integral 1L',
              ean: '7891000100103',
              quantity: 2,
              unitPrice: 5.49,
            },
          ],
        })
        .expect(202);

      expect(receipt.body.processingStatus).toBe('waiting_manual_release');
      expect(receipt.body.jobId).toBeUndefined();
      expect(queues.receiptQueue.add).not.toHaveBeenCalled();

      const released = await request(app.getHttpServer())
        .post(`/admin/receipt-processing/${receipt.body.id}/release`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(201);

      expect(released.body).toMatchObject({
        id: receipt.body.id,
        processingStatus: 'queued',
        jobId: expect.any(String),
        rewardEligibilityStatus: 'granted',
        rewardPoints: 100,
        rewardOptimizationTokens: 1,
        rewardMessage:
          'Nota validada: voce ganhou 100 pontos e 1 credito de otimizacao.',
        reviewReason: 'receipt_reward_granted',
      });
      expect(queues.receiptQueue.add).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it('queues receipt processing immediately when automatic mode is enabled', async () => {
    process.env.RECEIPT_PROCESSING_MODE = 'automatic';
    const { app, queues, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer(
        'automatic-receipt@pricely.local',
      );

      const response = await request(app.getHttpServer())
        .post('/receipts')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          storeName: 'Mercado Automatico',
          sourceType: 'manual_entry',
          items: [
            {
              rawProductName: 'Arroz Branco tp1 5kg',
              ean: '7891234567895',
              quantity: 1,
              unitPrice: 28.9,
            },
          ],
        })
        .expect(202);

      expect(response.body).toMatchObject({
        parseStatus: 'parsed',
        processingStatus: 'queued',
        jobId: expect.any(String),
      });
      expect(queues.receiptQueue.add).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });
});
