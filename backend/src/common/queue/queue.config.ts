export const QUEUE_CONFIG = 'QUEUE_CONFIG';
export const QUEUE_CONNECTION = 'QUEUE_CONNECTION';

export interface QueueConfig {
  host: string;
  port: number;
  db: number;
}

export function createQueueConfig(
  env: NodeJS.ProcessEnv = process.env,
): QueueConfig {
  return {
    host: env.REDIS_HOST?.trim() || '127.0.0.1',
    port: Number(env.REDIS_PORT || 6379),
    db: Number(env.REDIS_DB || 0),
  };
}
