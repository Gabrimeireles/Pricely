import { Logger } from '@nestjs/common';

import { AdminDashboardService } from '../../../src/admin/application/admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('aggregates metrics, queue health, and processing job projections', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      userAccount: {
        count: jest.fn().mockResolvedValue(12),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'cliente1@pricely.local',
            displayName: 'Cliente 1',
            role: 'customer',
            status: 'active',
            lastLoginAt: new Date('2026-04-27T08:00:00Z'),
            createdAt: new Date('2026-04-20T08:00:00Z'),
            updatedAt: new Date('2026-04-27T08:00:00Z'),
            preferredRegion: {
              id: 'region-1',
              slug: 'sao-paulo-sp',
              name: 'Sao Paulo',
              stateCode: 'SP',
            },
            entitlements: [
              {
                plan: 'free',
                status: 'active',
                source: 'monthly_free_refill',
                endsAt: null,
              },
            ],
            optimizationRuns: [
              {
                id: 'run-1',
                mode: 'global_full',
                status: 'completed',
                createdAt: new Date('2026-04-27T10:00:00Z'),
                completedAt: new Date('2026-04-27T10:05:00Z'),
              },
            ],
            _count: {
              shoppingLists: 3,
              optimizationRuns: 2,
              receiptRecords: 1,
              priceMismatchReports: 4,
            },
          },
        ]),
      },
      shoppingList: { count: jest.fn().mockResolvedValue(24) },
      optimizationRun: {
        count: jest.fn().mockResolvedValue(18),
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            estimatedSavings: 321.45,
          },
        }),
      },
      region: { count: jest.fn().mockResolvedValue(3) },
      establishment: { count: jest.fn().mockResolvedValue(17) },
      productOffer: { count: jest.fn().mockResolvedValue(42) },
      catalogProduct: { count: jest.fn().mockResolvedValue(11) },
      processingJob: {
        count: jest.fn().mockResolvedValue(5),
        findUnique: jest.fn().mockResolvedValue({
          id: 'job-1',
          queueName: 'optimization',
          jobType: 'optimization',
          resourceType: 'shopping_list',
          resourceId: 'list-1',
          status: 'completed',
          attemptCount: 1,
          failureReason: null,
          createdAt: new Date('2026-04-27T10:00:00Z'),
          updatedAt: new Date('2026-04-27T10:05:00Z'),
          finishedAt: new Date('2026-04-27T10:05:00Z'),
          optimizationRun: {
            id: 'run-1',
            mode: 'global_full',
            status: 'completed',
            totalEstimatedCost: { toString: () => '82.40' },
            estimatedSavings: { toString: () => '18.50' },
            coverageStatus: 'complete',
            summary: 'Selected cheapest comparable offers.',
            createdAt: new Date('2026-04-27T10:00:00Z'),
            completedAt: new Date('2026-04-27T10:05:00Z'),
            user: {
              id: 'user-1',
              displayName: 'Cliente 1',
              email: 'cliente1@pricely.local',
            },
            shoppingList: {
              id: 'list-1',
              name: 'Compra mensal',
            },
            optimizationSelections: [
              {
                id: 'selection-1',
                shoppingListItemId: 'item-1',
                status: 'selected',
                estimatedCost: { toString: () => '19.99' },
                confidenceNotice: null,
                shoppingListItem: {
                  requestedName: 'Arroz',
                },
                productOffer: {
                  id: 'offer-1',
                  displayName: 'Arroz Camil',
                  priceAmount: { toString: () => '19.99' },
                  sourceReference: 'NFCe 1',
                  sourceType: 'receipt',
                  observedAt: new Date('2026-04-27T09:00:00Z'),
                  productVariant: {
                    displayName: 'Arroz Camil 5kg',
                  },
                  establishment: {
                    unitName: 'Mercado Centro',
                    neighborhood: 'Centro',
                  },
                },
              },
            ],
          },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'job-1',
            queueName: 'optimization',
            jobType: 'optimization',
            resourceType: 'shopping_list',
            resourceId: 'list-1',
            status: 'queued',
            attemptCount: 1,
            failureReason: null,
            createdAt: new Date('2026-04-27T10:00:00Z'),
            updatedAt: new Date('2026-04-27T10:01:00Z'),
            finishedAt: null,
            optimizationRun: {
              id: 'run-1',
              mode: 'global_full',
              status: 'queued',
              createdAt: new Date('2026-04-27T10:00:00Z'),
              completedAt: null,
              user: {
                id: 'user-1',
                displayName: 'Cliente 1',
                email: 'cliente1@pricely.local',
              },
              shoppingList: {
                id: 'list-1',
                name: 'Compra mensal',
              },
            },
          },
          {
            id: 'job-2',
            queueName: 'optimization',
            jobType: 'optimization',
            resourceType: 'shopping_list',
            resourceId: 'list-2',
            status: 'failed',
            attemptCount: 3,
            failureReason: 'boom',
            createdAt: new Date('2026-04-27T09:00:00Z'),
            updatedAt: new Date('2026-04-27T09:01:00Z'),
            finishedAt: new Date('2026-04-27T09:01:00Z'),
            optimizationRun: null,
          },
          {
            id: 'job-3',
            queueName: 'receipt-processing',
            jobType: 'receipt_processing',
            resourceType: 'receipt',
            resourceId: 'receipt-1',
            status: 'retrying',
            attemptCount: 2,
            failureReason: 'timeout',
            createdAt: new Date('2026-04-27T08:00:00Z'),
            updatedAt: new Date('2026-04-27T08:01:00Z'),
            finishedAt: null,
            optimizationRun: null,
          },
        ]),
      },
      optimizationTokenLedgerEntry: {
        groupBy: jest.fn().mockResolvedValue([
          {
            userId: 'user-1',
            _sum: {
              amount: 5,
            },
          },
        ]),
      },
      shoppingList: {
        count: jest.fn().mockResolvedValue(24),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'list-1',
            name: 'Compra mensal',
            status: 'ready',
            updatedAt: new Date('2026-04-27T10:05:00Z'),
            user: {
              id: 'user-1',
              displayName: 'Cliente 1',
              email: 'cliente1@pricely.local',
            },
            preferredRegion: {
              id: 'region-1',
              name: 'Sao Paulo',
              stateCode: 'SP',
            },
            shoppingListItems: [{ id: 'item-1' }, { id: 'item-2' }],
            optimizationRuns: [
              {
                id: 'run-1',
                mode: 'global_full',
                status: 'completed',
                estimatedSavings: { toString: () => '18.50' },
                totalEstimatedCost: { toString: () => '82.40' },
                coverageStatus: 'complete',
                createdAt: new Date('2026-04-27T10:04:00Z'),
                completedAt: new Date('2026-04-27T10:05:00Z'),
              },
            ],
          },
        ]),
      },
    };

    const service = new AdminDashboardService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        monthlyFreeTokenCount: jest.fn().mockReturnValue(2),
        setManualPremium: jest.fn(),
        grantAdminOptimizationTokens: jest.fn(),
      } as never,
      {} as never,
    );

    await expect(service.getMetrics()).resolves.toEqual({
      activeUsers: 12,
      shoppingListsCount: 24,
      optimizationRunsCount: 18,
      activeRegions: 3,
      activeEstablishments: 17,
      activeOffers: 42,
      productCount: 11,
      queuedJobs: 5,
      globalEstimatedSavings: 321.45,
    });

    await expect(service.listProcessingJobs()).resolves.toEqual([
      expect.objectContaining({
        id: 'job-1',
        queueName: 'optimization',
        status: 'queued',
        createdAt: '2026-04-27T10:00:00.000Z',
        owner: expect.objectContaining({
          id: 'user-1',
        }),
        shoppingList: expect.objectContaining({
          id: 'list-1',
        }),
        optimizationRun: expect.objectContaining({
          id: 'run-1',
          mode: 'global_full',
        }),
      }),
      expect.objectContaining({
        id: 'job-2',
        status: 'failed',
        finishedAt: '2026-04-27T09:01:00.000Z',
      }),
      expect.objectContaining({
        id: 'job-3',
        status: 'retrying',
        failureReason: 'timeout',
      }),
    ]);

    await expect(service.getProcessingJobDetail('job-1')).resolves.toEqual(
      expect.objectContaining({
        id: 'job-1',
        owner: expect.objectContaining({
          id: 'user-1',
        }),
        shoppingList: expect.objectContaining({
          id: 'list-1',
        }),
        optimizationRun: expect.objectContaining({
          id: 'run-1',
          mode: 'global_full',
          totalEstimatedCost: 82.4,
          estimatedSavings: 18.5,
          selections: [
            expect.objectContaining({
              shoppingListItemName: 'Arroz',
              offer: expect.objectContaining({
                establishmentName: 'Mercado Centro',
                priceAmount: 19.99,
              }),
            }),
          ],
        }),
      }),
    );

    await expect(service.getQueueHealth()).resolves.toEqual({
      queuedJobs: 2,
      runningJobs: 0,
      failedJobs: 1,
      completedJobs: 0,
      jobsByStatus: {
        queued: 1,
        failed: 1,
        retrying: 1,
      },
      queues: ['optimization', 'receipt-processing'],
      recentFailures: [
        {
          queueName: 'optimization',
          status: 'failed',
          failureReason: 'boom',
        },
        {
          queueName: 'receipt-processing',
          status: 'retrying',
          failureReason: 'timeout',
        },
      ],
    });

    await expect(service.listShoppingListAudits()).resolves.toEqual([
      expect.objectContaining({
        id: 'list-1',
        name: 'Compra mensal',
        itemCount: 2,
        owner: expect.objectContaining({
          id: 'user-1',
          displayName: 'Cliente 1',
        }),
        city: 'Sao Paulo - SP',
        latestOptimization: expect.objectContaining({
          id: 'run-1',
          mode: 'global_full',
          status: 'completed',
          estimatedSavings: 18.5,
          totalEstimatedCost: 82.4,
          coverageStatus: 'complete',
        }),
      }),
    ]);

    await expect(service.listUsers()).resolves.toEqual([
      expect.objectContaining({
        id: 'user-1',
        email: 'cliente1@pricely.local',
        counts: {
          shoppingLists: 3,
          optimizationRuns: 2,
          receiptRecords: 1,
          priceMismatchReports: 4,
        },
        entitlement: expect.objectContaining({
          plan: 'free',
          availableOptimizationTokens: 5,
          billingEnabled: false,
          lastPaymentStatus: 'billing_disabled',
        }),
        latestOptimization: expect.objectContaining({
          id: 'run-1',
          mode: 'global_full',
        }),
      }),
    ]);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin metrics generated'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin processing jobs requested'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin queue health generated'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin shopping list audit requested'),
    );
  });

  it('persists region activation changes through the admin mutation surface', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {};
    const regionsAdminService = {
      create: jest.fn().mockResolvedValue({
        id: 'region-1',
        slug: 'campinas-sp',
      }),
      update: jest.fn().mockResolvedValue({
        id: 'region-1',
        implantationStatus: 'active',
      }),
    };

    const service = new AdminDashboardService(
      prisma as never,
      regionsAdminService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.createRegion({
      slug: 'campinas-sp',
      name: 'Campinas',
      stateCode: 'SP',
      implantationStatus: 'activating',
    });
    await service.updateRegion('region-1', {
      implantationStatus: 'active',
    });

    expect(regionsAdminService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'campinas-sp',
        implantationStatus: 'activating',
      }),
    );
    expect(regionsAdminService.update).toHaveBeenCalledWith('region-1', {
      implantationStatus: 'active',
    });
    expect(logSpy).toHaveBeenCalledWith('Admin created region campinas-sp (region-1)');
    expect(logSpy).toHaveBeenCalledWith('Admin updated region region-1');
  });

  it('projects notification delivery diagnostics with redacted provider data and delegates admin actions', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const deliveryAttempt = {
      id: 'attempt-1',
      notificationId: 'notification-1',
      userId: 'user-1',
      channel: 'email',
      status: 'failed',
      attemptCount: 1,
      maxAttempts: 3,
      providerMessageId: 'provider-message-secret-1234567890',
      lastFailureReason:
        'provider rejected cliente@pricely.local token abcdefghijklmnopqrstuvwxyz url https://provider.example/error',
      terminalFailureReason: null,
      nextAttemptAt: null,
      lastAttemptAt: new Date('2026-06-26T10:00:00Z'),
      deliveredAt: null,
      createdAt: new Date('2026-06-26T09:00:00Z'),
      updatedAt: new Date('2026-06-26T10:01:00Z'),
      user: {
        id: 'user-1',
        displayName: 'Cliente 1',
        email: 'cliente@pricely.local',
      },
      notification: {
        id: 'notification-1',
        type: 'price_drop',
        title: 'Preco menor',
        resourceType: 'product_offer',
        resourceId: 'offer-1',
        createdAt: new Date('2026-06-26T08:59:00Z'),
      },
      emailDestination: {
        id: 'destination-1',
        email: 'cliente@pricely.local',
        status: 'verified',
      },
      pushDevice: null,
    };
    const prisma = {
      userNotificationDeliveryAttempt: {
        findMany: jest.fn().mockResolvedValue([deliveryAttempt]),
      },
    };
    const notificationsService = {
      retryDeliveryAttempt: jest.fn().mockResolvedValue(null),
      cancelDeliveryAttempt: jest.fn().mockResolvedValue(null),
    };
    const service = new AdminDashboardService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      notificationsService as never,
    );

    await expect(service.listNotificationDeliveries()).resolves.toEqual([
      expect.objectContaining({
        id: 'attempt-1',
        status: 'failed',
        providerMessage: 'redacted:567890',
        lastFailureReason:
          'provider rejected [email] token [token] url [url]',
        canRetry: true,
        canCancel: false,
        owner: {
          id: 'user-1',
          displayName: 'Cliente 1',
          email: 'cl***@pricely.local',
        },
        destination: {
          kind: 'email',
          id: 'destination-1',
          label: 'cl***@pricely.local',
          status: 'verified',
        },
      }),
    ]);

    await service.retryNotificationDelivery('attempt-1');
    await service.cancelNotificationDelivery('attempt-1', 'admin cancel');

    expect(notificationsService.retryDeliveryAttempt).toHaveBeenCalledWith(
      'attempt-1',
    );
    expect(notificationsService.cancelDeliveryAttempt).toHaveBeenCalledWith(
      'attempt-1',
      'admin cancel',
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin notification delivery diagnostics'),
    );
  });

  it('projects receipt line extraction, maker action, and price comparison for admin review', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      receiptRecord: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'receipt-1',
            storeName: 'Mercado Centro',
            storeCnpj: '00.000.000/0001-00',
            parseStatus: 'parsed',
            trustLevel: 'trusted',
            moderationStatus: 'accepted',
            rewardEligibilityStatus: 'eligible_pending',
            reviewReason: null,
            purchaseDate: new Date('2026-05-09T10:00:00Z'),
            createdAt: new Date('2026-05-09T10:05:00Z'),
            updatedAt: new Date('2026-05-09T10:06:00Z'),
            user: {
              id: 'user-1',
              displayName: 'Cliente 1',
              email: 'cliente1@pricely.local',
            },
            processingJob: null,
            lineItems: [
              {
                id: 'line-1',
                rawProductName: 'CAFE PILAO 500G',
                normalizedName: 'Cafe Pilao 500g',
                ean: '7891000000000',
                quantity: { toString: () => '1' },
                unitPrice: { toString: () => '15.90' },
                originalUnitPrice: { toString: () => '18.90' },
                promotionalUnitPrice: { toString: () => '15.90' },
                matchConfidence: { toString: () => '0.91' },
                productOffers: [
                  {
                    id: 'offer-1',
                    catalogProductId: 'product-1',
                    productVariantId: 'variant-1',
                    establishmentId: 'store-1',
                    displayName: 'Cafe Pilao 500g',
                    packageLabel: '500 g',
                    priceAmount: { toString: () => '15.90' },
                    observedAt: new Date('2026-05-09T10:06:00Z'),
                    catalogProduct: { name: 'Cafe torrado' },
                    productVariant: {
                      displayName: 'Cafe Pilao 500g',
                      brandName: 'Pilao',
                    },
                    establishment: {
                      unitName: 'Mercado Centro',
                      neighborhood: 'Centro',
                    },
                  },
                ],
              },
            ],
          },
        ]),
      },
      productOffer: {
        findMany: jest.fn().mockResolvedValue([
          {
            productVariantId: 'variant-1',
            establishmentId: 'store-1',
            priceAmount: { toString: () => '16.90' },
            observedAt: new Date('2026-05-01T10:06:00Z'),
          },
        ]),
      },
    };

    const service = new AdminDashboardService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.listReceiptProcessingReviews()).resolves.toEqual([
      expect.objectContaining({
        id: 'receipt-1',
        quality: expect.objectContaining({
          lineItemCount: 1,
          highConfidenceLineItemCount: 1,
        }),
        lineItems: [
          expect.objectContaining({
            rawProductName: 'CAFE PILAO 500G',
            matcherStatus: 'matched_offer',
            makerAction: 'offer_created',
            offers: [
              expect.objectContaining({
                priceAmount: 15.9,
                comparison: {
                  previousPriceAmount: 16.9,
                  newPriceAmount: 15.9,
                  deltaAmount: -1,
                  direction: 'down',
                  previousObservedAt: '2026-05-01T10:06:00.000Z',
                },
              }),
            ],
          }),
        ],
      }),
    ]);
    expect(logSpy).toHaveBeenCalledWith(
      'Admin receipt processing requested: 1 records returned',
    );
  });

  it('delegates premium and token adjustments to entitlement service', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const prisma = {
      userAccount: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'cliente1@pricely.local',
            displayName: 'Cliente 1',
            role: 'customer',
            status: 'active',
            lastLoginAt: null,
            createdAt: new Date('2026-04-20T08:00:00Z'),
            updatedAt: new Date('2026-04-27T08:00:00Z'),
            preferredRegion: null,
            entitlements: [],
            optimizationRuns: [],
            _count: {
              shoppingLists: 0,
              optimizationRuns: 0,
              receiptRecords: 0,
              priceMismatchReports: 0,
            },
          },
        ]),
      },
      optimizationTokenLedgerEntry: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };
    const entitlementsService = {
      monthlyFreeTokenCount: jest.fn().mockReturnValue(2),
      setManualPremium: jest.fn().mockResolvedValue(null),
      grantAdminOptimizationTokens: jest.fn().mockResolvedValue(null),
    };

    const service = new AdminDashboardService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      entitlementsService as never,
      {} as never,
    );

    await service.setUserPremium('user-1', { enabled: true }, 'admin-1');
    await service.grantUserOptimizationTokens(
      'user-1',
      { amount: 3, reason: 'suporte_admin' },
      'admin-1',
    );

    expect(entitlementsService.setManualPremium).toHaveBeenCalledWith({
      userId: 'user-1',
      enabled: true,
      adminUserId: 'admin-1',
    });
    expect(entitlementsService.grantAdminOptimizationTokens).toHaveBeenCalledWith({
      userId: 'user-1',
      amount: 3,
      reason: 'suporte_admin',
      adminUserId: 'admin-1',
    });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('enabled premium'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('granted 3 optimization tokens'),
    );
  });
});
