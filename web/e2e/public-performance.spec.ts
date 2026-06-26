import { expect, test } from '@playwright/test';

const publicUrl = process.env.PRICELY_PUBLIC_PERF_URL;

test.skip(
  !publicUrl,
  'Set PRICELY_PUBLIC_PERF_URL to run public deployment performance checks.',
);

test('public deployment is served as a production build', async ({ page }) => {
  const developmentAssets: string[] = [];
  const criticalApiDurations: Array<{ url: string; duration: number }> = [];

  page.on('requestfinished', (request) => {
    const url = request.url();

    if (
      url.includes('/@vite/client') ||
      url.includes('/@react-refresh') ||
      url.includes('/node_modules/.vite/') ||
      url.includes('/src/')
    ) {
      developmentAssets.push(url);
    }

    if (url.includes('apipricely.grmeireles.dev')) {
      const timing = request.timing();
      criticalApiDurations.push({
        url,
        duration: timing.responseEnd - timing.startTime,
      });
    }
  });

  await page.goto(publicUrl!, { waitUntil: 'networkidle' });

  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming;
    const firstContentfulPaint =
      performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;

    return {
      domContentLoaded: entry.domContentLoadedEventEnd,
      load: entry.loadEventEnd,
      firstContentfulPaint,
    };
  });

  expect(developmentAssets, 'public deploy must not serve Vite dev assets').toEqual(
    [],
  );
  expect(
    navigation.firstContentfulPaint,
    `FCP ${Math.round(navigation.firstContentfulPaint)}ms`,
  ).toBeLessThan(3_000);
  expect(
    Math.max(0, ...criticalApiDurations.map((entry) => entry.duration)),
    'critical API calls should stay responsive',
  ).toBeLessThan(1_500);
});
