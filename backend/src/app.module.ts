import { Module } from '@nestjs/common';

import { MongoModule } from './persistence/mongo.module';

@Module({
  imports: [MongoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
