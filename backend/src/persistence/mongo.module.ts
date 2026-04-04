import {
  Global,
  Inject,
  Injectable,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

import {
  createMongoConfig,
  MONGO_CLIENT,
  MONGO_CONFIG,
  MONGO_DB,
  type MongoConfig,
} from './mongo.config';

@Injectable()
class MongoLifecycleService implements OnApplicationShutdown {
  constructor(
    @Inject(MONGO_CLIENT)
    private readonly client: MongoClient,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: MONGO_CONFIG,
      useFactory: (): MongoConfig => createMongoConfig(),
    },
    {
      provide: MONGO_CLIENT,
      useFactory: async (config: MongoConfig): Promise<MongoClient> => {
        const client = new MongoClient(config.uri);

        await client.connect();

        return client;
      },
      inject: [MONGO_CONFIG],
    },
    {
      provide: MONGO_DB,
      useFactory: (client: MongoClient, config: MongoConfig): Db =>
        client.db(config.dbName),
      inject: [MONGO_CLIENT, MONGO_CONFIG],
    },
    MongoLifecycleService,
  ],
  exports: [MONGO_CONFIG, MONGO_CLIENT, MONGO_DB],
})
export class MongoModule {}
