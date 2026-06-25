import { Injectable, Logger } from '@nestjs/common';

export type IncidentNotification = {
  event: string;
  severity: 'warning' | 'critical' | 'resolved';
  summary: string;
  details: Record<string, string | number | boolean | null>;
};

@Injectable()
export class IncidentNotifierService {
  private readonly logger = new Logger(IncidentNotifierService.name);
  private readonly webhookUrl = process.env.INCIDENT_WEBHOOK_URL?.trim();
  private readonly environment =
    process.env.APP_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';
  private readonly release = process.env.APP_RELEASE ?? 'unversioned';
  private readonly timeoutMs = this.readPositiveInteger(
    process.env.INCIDENT_WEBHOOK_TIMEOUT_MS,
    5_000,
  );

  async notify(notification: IncidentNotification) {
    if (!this.webhookUrl) {
      return { delivered: false, reason: 'webhook_disabled' as const };
    }

    const text = `[${notification.severity.toUpperCase()}] ${notification.summary}`;
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text,
        content: text,
        event: notification.event,
        severity: notification.severity,
        environment: this.environment,
        release: this.release,
        details: notification.details,
        occurredAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Incident webhook returned HTTP ${response.status}.`);
    }

    this.logger.log({
      event: 'incident_notification_delivered',
      incidentEvent: notification.event,
      severity: notification.severity,
    });
    return { delivered: true as const };
  }

  private readPositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
