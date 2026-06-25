import { NotFoundException } from '@nestjs/common';

import { ReceiptsController } from '../../../src/receipts/api/receipts.controller';

describe('ReceiptsController', () => {
  it('returns only the authenticated user receipt projection', async () => {
    const service = {
      findForUser: jest.fn().mockResolvedValue({
        id: 'receipt-1',
        processingStatus: 'running',
        rewardEligibilityStatus: 'eligible_pending',
      }),
    };
    const controller = new ReceiptsController(service as never);

    await expect(
      controller.detail(
        {
          sub: 'user-1',
          email: 'user@pricely.app',
          role: 'customer',
        },
        'receipt-1',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'receipt-1',
        processingStatus: 'running',
      }),
    );
    expect(service.findForUser).toHaveBeenCalledWith('user-1', 'receipt-1');
  });

  it('does not expose receipts owned by another account', async () => {
    const service = {
      findForUser: jest.fn().mockRejectedValue(new NotFoundException()),
    };
    const controller = new ReceiptsController(service as never);

    await expect(
      controller.detail(
        {
          sub: 'user-2',
          email: 'other@pricely.app',
          role: 'customer',
        },
        'receipt-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
