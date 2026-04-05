export const MONGO_CONFIG = 'MONGO_CONFIG';
export const MONGO_CLIENT = 'MONGO_CLIENT';
export const MONGO_DB = 'MONGO_DB';

export interface MongoConfig {
  uri: string;
  dbName: string;
}

export function createMongoConfig(
  env: NodeJS.ProcessEnv = process.env,
): MongoConfig {
  const uri = env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error('MONGODB_URI must be defined to bootstrap MongoDB');
  }

  const dbName = env.MONGODB_DB_NAME?.trim() || inferDatabaseName(uri);

  return {
    uri,
    dbName,
  };
}

function inferDatabaseName(uri: string): string {
  const parsedUrl = new URL(uri);
  const pathname = parsedUrl.pathname.replace(/^\/+/, '');

  return pathname || 'pricely';
}
