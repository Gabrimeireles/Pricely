export interface ProductMatchEntity {
  id: string;
  canonicalName: string;
  alias: string;
  brand?: string;
  sizeDescriptor?: string;
  confidenceScore: number;
  source: 'historical_inference' | 'user_confirmation' | 'rule_based_normalization';
  lastSeenAt: string;
}
