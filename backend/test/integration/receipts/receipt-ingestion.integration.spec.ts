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
      expect(response.body.id).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
      expect(response.body.jobId).toBeUndefined();
      expect(response.body.confidenceScore).toBeGreaterThan(0.8);
      expect(queues.receiptQueue.add).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('accepts a SEFAZ NFC-e URL and extracts receipt data before manual release', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        `
          <html>
            <body>
              Nota Fiscal de Consumidor Eletr&ocirc;nica (NFC-e) SUPERMERCADO ENTITY LTDA
              CNPJ: 04641376024400 -, Inscri&ccedil;&atilde;o Estadual: 0032546124242
              AV. LEITE DE CASTRO, 261, FABRICAS, 3162500 - SAO JOAO DEL REI, MG
              Data Emiss&#227;o 15/05/2026 20:36:48
              <table>
                <tr><td><h7>REFR C COLA S/AC 200</h7> (C&oacute;digo: 1462210)</td><td>Qtde total de &iacute;tens: 3.000</td><td>UN: FR</td><td>Valor total R$: R$ 5,94</td></tr>
              </table>
            </body>
          </html>
        `,
        {
          status: 200,
          headers: {
            'content-type': 'text/html',
          },
        },
      ),
    );
    const { app, queues, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer(
        'receipt-url-user@pricely.local',
      );

      const response = await request(app.getHttpServer())
        .post('/receipts')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          sourceType: 'qr_code_url',
          qrCodeUrl:
            'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=31260504641376024400650100002111701459668768%7C2%7C1%7C1%7C00F59426796F3226861AC29D212C328ECB6AC66B',
        })
        .expect(202);

      expect(response.body).toMatchObject({
        storeName: 'SUPERMERCADO ENTITY LTDA',
        storeCnpj: '04641376024400',
        storeAddressLine: 'AV. LEITE DE CASTRO, 261',
        storeNeighborhood: 'FABRICAS',
        storePostalCode: '3162500',
        storeCityName: 'SAO JOAO DEL REI',
        storeStateCode: 'MG',
        accessKey: '31260504641376024400650100002111701459668768',
        parseStatus: 'parsed',
        processingStatus: 'waiting_manual_release',
      });
      expect(response.body.jobId).toBeUndefined();
      expect(queues.receiptQueue.add).not.toHaveBeenCalled();

      const admin = await auth.registerAdmin('receipt-url-admin@pricely.local');
      const audit = await request(app.getHttpServer())
        .get(`/admin/receipt-processing/${response.body.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(audit.body).toMatchObject({
        id: response.body.id,
        storeName: 'SUPERMERCADO ENTITY LTDA',
        extractedPayload: expect.objectContaining({
          accessKey: '31260504641376024400650100002111701459668768',
          lineItemCount: 1,
          totalLineAmount: 5.94,
        }),
        lineItems: [
          expect.objectContaining({
            rawProductName: 'REFR C COLA S/AC 200',
            quantity: 3,
            unitPrice: 1.98,
          }),
        ],
      });
    } finally {
      fetchSpy.mockRestore();
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

      const receiptAudit = await request(app.getHttpServer())
        .get(`/admin/receipt-processing/${receipt.body.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(receiptAudit.body).toMatchObject({
        id: receipt.body.id,
        storeName: 'Mercado Manual',
        processingJob: null,
        extractedPayload: expect.objectContaining({
          lineItemCount: 1,
        }),
      });

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

      const reprocessed = await request(app.getHttpServer())
        .post(`/admin/receipt-processing/${receipt.body.id}/reprocess`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(201);

      expect(reprocessed.body).toMatchObject({
        id: receipt.body.id,
        processingStatus: 'queued',
        jobId: released.body.jobId,
      });
      expect(queues.receiptQueue.add).toHaveBeenCalledTimes(2);

      const rejected = await request(app.getHttpServer())
        .post(`/admin/receipt-processing/${receipt.body.id}/reject`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'manual_admin_rejection' })
        .expect(201);

      expect(rejected.body).toMatchObject({
        id: receipt.body.id,
        trustLevel: 'rejected',
        moderationStatus: 'rejected',
        rewardEligibilityStatus: 'ineligible',
        reviewReason: 'manual_admin_rejection',
      });
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
