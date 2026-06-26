import { IncidentNotifierService } from '../../../src/common/logging/incident-notifier.service';

describe('IncidentNotifierService', () => {
  const originalEnv = {
    INCIDENT_WEBHOOK_URL: process.env.INCIDENT_WEBHOOK_URL,
    INCIDENT_WEBHOOK_TIMEOUT_MS: process.env.INCIDENT_WEBHOOK_TIMEOUT_MS,
    APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
    APP_RELEASE: process.env.APP_RELEASE,
  };
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('does nothing when the webhook is disabled', async () => {
    delete process.env.INCIDENT_WEBHOOK_URL;
    const service = new IncidentNotifierService();

    await expect(
      service.notify({
        event: 'test',
        severity: 'warning',
        summary: 'Test incident',
        details: {},
      }),
    ).resolves.toEqual({
      delivered: false,
      reason: 'webhook_disabled',
    });
  });

  it('delivers a redacted provider-neutral payload', async () => {
    process.env.INCIDENT_WEBHOOK_URL = 'https://incidents.example.test/hook';
    process.env.APP_ENVIRONMENT = 'homolog';
    process.env.APP_RELEASE = 'sha-123';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    }) as jest.Mock;
    const service = new IncidentNotifierService();

    await service.notify({
      event: 'public_search_slo_alert',
      severity: 'critical',
      summary: 'Search latency exceeded the SLO.',
      details: {
        observedP95Ms: 900,
        targetP95Ms: 750,
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://incidents.example.test/hook',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: expect.any(String),
      }),
    );
    const request = (global.fetch as jest.Mock).mock.calls[0][1] as {
      body: string;
    };
    const payload = JSON.parse(request.body);
    expect(payload).toEqual(
      expect.objectContaining({
        event: 'public_search_slo_alert',
        severity: 'critical',
        environment: 'homolog',
        release: 'sha-123',
      }),
    );
    expect(request.body).not.toContain('password');
    expect(request.body).not.toContain('token');
    expect(request.body).not.toContain('query');
  });

  it('rejects non-success webhook responses', async () => {
    process.env.INCIDENT_WEBHOOK_URL = 'https://incidents.example.test/hook';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as jest.Mock;
    const service = new IncidentNotifierService();

    await expect(
      service.notify({
        event: 'test',
        severity: 'critical',
        summary: 'Unavailable',
        details: {},
      }),
    ).rejects.toThrow('HTTP 503');
  });
});
