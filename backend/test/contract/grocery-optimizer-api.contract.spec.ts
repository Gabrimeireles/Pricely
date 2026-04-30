import request from 'supertest';

import { PrismaService } from '../../src/persistence/prisma.service';
import { createUs1TestApp } from '../support/us1-app.factory';

describe('Grocery optimizer API contract', () => {
  it('matches the shopping list and optimization endpoint contract surface', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const session = await auth.registerCustomer();

      const shoppingListResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          name: 'Contract list',
          preferredRegionId: 'sao-paulo-sp',
          lastMode: 'global_full',
        })
        .expect(201);

      expect(shoppingListResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Contract list',
          preferredRegionId: 'sao-paulo-sp',
          status: 'draft',
          lastMode: 'global_full',
          items: expect.any(Array),
        }),
      );

      const shoppingListId = shoppingListResponse.body.id as string;

      const addItemsResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/items`)
        .set('Authorization', `Bearer ${session.accessToken}`)
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
            /unresolved|matched|partial|missing/,
          ),
        }),
      );

      const optimizationResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListId}/optimize`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ mode: 'global_full' })
        .expect(201);

      expect(optimizationResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          jobId: expect.any(String),
          shoppingListId,
          mode: 'global_full',
          status: expect.stringMatching(/queued|running|completed|failed/),
          queuedAt: expect.any(String),
        }),
      );

      const latestResponse = await request(app.getHttpServer())
        .get(`/shopping-lists/${shoppingListId}/optimizations/latest`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);

      expect(latestResponse.body).toEqual(
        expect.objectContaining({
          id: optimizationResponse.body.id,
          shoppingListId,
          mode: 'global_full',
          coverageStatus: expect.stringMatching(/complete|partial|none/),
          createdAt: expect.any(String),
          selections: expect.any(Array),
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('matches the public region, offer, and admin processing contract surface', async () => {
    const { app, auth } = await createUs1TestApp();

    try {
      const customer = await auth.registerCustomer();

      const regionsResponse = await request(app.getHttpServer())
        .get('/regions')
        .expect(200);

      expect(regionsResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            slug: expect.any(String),
            name: expect.any(String),
            stateCode: expect.any(String),
            implantationStatus: expect.stringMatching(/active|activating/),
            activeEstablishmentCount: expect.any(Number),
            offerCoverageStatus: expect.stringMatching(/live|collecting_data/),
          }),
        ]),
      );

      const regionSlug = regionsResponse.body[0].slug as string;

      const regionalOffersResponse = await request(app.getHttpServer())
        .get(`/regions/${regionSlug}/offers`)
        .expect(200);

      expect(regionalOffersResponse.body).toEqual(
        expect.objectContaining({
          region: expect.objectContaining({
            slug: regionSlug,
          }),
          activeEstablishmentCount: expect.any(Number),
          offerCoverageStatus: expect.stringMatching(/live|collecting_data/),
          offers: expect.any(Array),
        }),
      );

      if (regionalOffersResponse.body.offers.length > 0) {
        const offerId = regionalOffersResponse.body.offers[0].id as string;
        const offerDetailResponse = await request(app.getHttpServer())
          .get(`/offers/${offerId}`)
          .expect(200);

        expect(offerDetailResponse.body).toEqual(
          expect.objectContaining({
            id: offerId,
            product: expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
            variant: expect.objectContaining({
              id: expect.any(String),
              displayName: expect.any(String),
            }),
            activeOffer: expect.objectContaining({
              storeName: expect.any(String),
            }),
            alternativeOffers: expect.any(Array),
          }),
        );
      }

      const shoppingListResponse = await request(app.getHttpServer())
        .post('/shopping-lists')
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({
          name: 'Processing contract',
        })
        .expect(201);

      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .expect(200);

      expect(meResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          preferredRegionSlug: null,
        }),
      );

      const preferredRegionResponse = await request(app.getHttpServer())
        .patch('/auth/preferred-region')
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({
          regionSlug,
        })
        .expect(200);

      expect(preferredRegionResponse.body).toEqual(
        expect.objectContaining({
          preferredRegionSlug: regionSlug,
        }),
      );

      const optimizationResponse = await request(app.getHttpServer())
        .post(`/shopping-lists/${shoppingListResponse.body.id}/optimize`)
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({ mode: 'global_full' })
        .expect(201);

      const adminRegisterResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `admin-${Date.now()}@pricely.local`,
          password: 'admin-password',
          displayName: 'Admin',
        })
        .expect(201);

      const adminId = adminRegisterResponse.body.user.id as string;
      const prisma = app.get(PrismaService);
      await prisma.userAccount.update({
        where: { id: adminId },
        data: { role: 'admin' },
      });

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminRegisterResponse.body.user.email,
          password: 'admin-password',
        })
        .expect(200);

      const adminToken = adminLoginResponse.body.accessToken as string;

      const metricsResponse = await request(app.getHttpServer())
        .get('/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(metricsResponse.body).toEqual(
        expect.objectContaining({
          activeUsers: expect.any(Number),
          shoppingListsCount: expect.any(Number),
          optimizationRunsCount: expect.any(Number),
          activeRegions: expect.any(Number),
          activeEstablishments: expect.any(Number),
          activeOffers: expect.any(Number),
          productCount: expect.any(Number),
          queuedJobs: expect.any(Number),
        }),
      );

      const createRegionResponse = await request(app.getHttpServer())
        .post('/admin/regions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: `campinas-${Date.now()}`,
          name: 'Campinas',
          stateCode: 'SP',
          implantationStatus: 'activating',
          publicSortOrder: 2,
        })
        .expect(201);

      expect(createRegionResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          slug: expect.stringContaining('campinas-'),
          name: 'Campinas',
          stateCode: 'SP',
          implantationStatus: 'activating',
        }),
      );

      const updateRegionResponse = await request(app.getHttpServer())
        .patch(`/admin/regions/${createRegionResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          implantationStatus: 'active',
        })
        .expect(200);

      expect(updateRegionResponse.body).toEqual(
        expect.objectContaining({
          id: createRegionResponse.body.id,
          implantationStatus: 'active',
        }),
      );

      const createEstablishmentResponse = await request(app.getHttpServer())
        .post('/admin/establishments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          brandName: 'Mercado Centro',
          unitName: 'Unidade Centro',
          cnpj: '00.000.000/0001-00',
          cityName: 'Campinas',
          neighborhood: 'Centro',
          regionId: createRegionResponse.body.id,
        })
        .expect(201);

      expect(createEstablishmentResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          brandName: 'Mercado Centro',
          unitName: 'Unidade Centro',
        }),
      );

      const createProductResponse = await request(app.getHttpServer())
        .post('/admin/catalog-products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: `cafe-torrado-${Date.now()}`,
          name: 'Cafe torrado',
          category: 'mercearia',
          defaultUnit: 'un',
        })
        .expect(201);

      expect(createProductResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Cafe torrado',
        }),
      );

      const createVariantResponse = await request(app.getHttpServer())
        .post('/admin/product-variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          catalogProductId: createProductResponse.body.id,
          slug: `cafe-pilao-${Date.now()}`,
          displayName: 'Cafe Pilao 500g',
          brandName: 'Pilao',
          packageLabel: '500 g',
        })
        .expect(201);

      expect(createVariantResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          catalogProductId: createProductResponse.body.id,
        }),
      );

      const uploadCatalogImageResponse = await request(app.getHttpServer())
        .post(`/admin/catalog-products/${createProductResponse.body.id}/image`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('catalog-image'), {
          filename: 'catalog.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(uploadCatalogImageResponse.body).toEqual(
        expect.objectContaining({
          id: createProductResponse.body.id,
          imageUrl: expect.stringContaining('/media/catalog-products/'),
        }),
      );

      const createOfferResponse = await request(app.getHttpServer())
        .post('/admin/offers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          catalogProductId: createProductResponse.body.id,
          productVariantId: createVariantResponse.body.id,
          establishmentId: createEstablishmentResponse.body.id,
          displayName: 'Cafe Pilao 500g',
          packageLabel: '500 g',
          priceAmount: 15.9,
          availabilityStatus: 'available',
          confidenceLevel: 'high',
        })
        .expect(201);

      expect(createOfferResponse.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          displayName: 'Cafe Pilao 500g',
        }),
      );

      const updateOfferResponse = await request(app.getHttpServer())
        .patch(`/admin/offers/${createOfferResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      expect(updateOfferResponse.body).toEqual(
        expect.objectContaining({
          id: createOfferResponse.body.id,
          isActive: false,
        }),
      );

      const jobsResponse = await request(app.getHttpServer())
        .get('/admin/processing-jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(jobsResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: optimizationResponse.body.jobId,
            queueName: expect.any(String),
            jobType: expect.any(String),
            status: expect.stringMatching(/queued|running|retrying|completed|failed/),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        ]),
      );

      const queueHealthResponse = await request(app.getHttpServer())
        .get('/admin/queue-health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(queueHealthResponse.body).toEqual(
        expect.objectContaining({
          queuedJobs: expect.any(Number),
          runningJobs: expect.any(Number),
          failedJobs: expect.any(Number),
          completedJobs: expect.any(Number),
          jobsByStatus: expect.any(Object),
          queues: expect.any(Array),
          recentFailures: expect.any(Array),
        }),
      );
    } finally {
      await app.close();
    }
  });
});
