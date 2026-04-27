import { afterEach, describe, expect, it, vi } from 'vitest';

import { runOptimization } from './api';

describe('runOptimization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('polls until the backend returns a completed optimization result', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'run-1',
            jobId: 'job-1',
            shoppingListId: 'list-1',
            mode: 'global_full',
            status: 'queued',
            queuedAt: '2026-04-27T10:00:00.000Z',
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'run-1',
            shoppingListId: 'list-1',
            mode: 'global_full',
            status: 'running',
            coverageStatus: 'none',
            createdAt: '2026-04-27T10:00:00.000Z',
            selections: [],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'run-1',
            shoppingListId: 'list-1',
            mode: 'global_full',
            status: 'completed',
            coverageStatus: 'complete',
            totalEstimatedCost: 22.9,
            estimatedSavings: 4.1,
            createdAt: '2026-04-27T10:00:00.000Z',
            completedAt: '2026-04-27T10:00:02.000Z',
            selections: [],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((((fn: TimerHandler) => {
      if (typeof fn === 'function') {
        fn();
      }
      return 0 as never;
    }) as unknown) as typeof globalThis.setTimeout);

    const result = await runOptimization('token', 'list-1', 'global_full');

    expect(result.status).toBe('completed');
    expect(result.totalEstimatedCost).toBe(22.9);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
