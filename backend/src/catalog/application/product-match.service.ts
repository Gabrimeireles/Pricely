import { Injectable } from '@nestjs/common';

import { toSlug } from '../../common/utils/slug.util';
import { type ProductMatchEntity } from '../domain/product-match.entity';
import { ProductMatchRepository } from '../infrastructure/product-match.repository';
import { ProductNormalizerService } from './product-normalizer.service';

@Injectable()
export class ProductMatchService {
  constructor(
    private readonly productNormalizerService: ProductNormalizerService,
    private readonly productMatchRepository: ProductMatchRepository,
  ) {}

  async resolve(rawName: string): Promise<ProductMatchEntity> {
    const alias = this.productNormalizerService.normalize(rawName).normalizedText;
    const existingMatch = await this.productMatchRepository.findByAlias(alias);

    if (existingMatch) {
      return {
        ...existingMatch,
        lastSeenAt: new Date().toISOString(),
      };
    }

    const normalized = this.productNormalizerService.normalize(rawName);
    const match: ProductMatchEntity = {
      id: `pm_${toSlug(alias) || crypto.randomUUID()}`,
      alias,
      canonicalName: normalized.canonicalName,
      sizeDescriptor: normalized.sizeDescriptor,
      confidenceScore: normalized.confidenceScore,
      source: 'rule_based_normalization',
      lastSeenAt: new Date().toISOString(),
    };

    await this.productMatchRepository.upsert(match);

    return match;
  }
}
