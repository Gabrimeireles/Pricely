import { ProductNormalizerService } from '../../../src/catalog/application/product-normalizer.service';

describe('ProductNormalizerService', () => {
  const service = new ProductNormalizerService();

  it('normalizes accents, casing, and spacing into a canonical product name', () => {
    const result = service.normalize('  Café   Torrado  e   Moído  ');

    expect(result.canonicalName).toBe('cafe torrado e moido');
    expect(result.normalizedText).toBe('cafe torrado e moido');
    expect(result.sizeDescriptor).toBeUndefined();
    expect(result.confidenceScore).toBeGreaterThan(0.6);
  });

  it('expands known aliases and extracts the size descriptor separately', () => {
    const result = service.normalize('Arroz Tio João tp1 5kg');

    expect(result.canonicalName).toBe('arroz tio joao tipo 1');
    expect(result.sizeDescriptor).toBe('5 kg');
    expect(result.aliasApplied).toBe(true);
    expect(result.tokens).toEqual(['arroz', 'tio', 'joao', 'tipo', '1']);
  });

  it('returns zero confidence when the raw name has no meaningful tokens', () => {
    const result = service.normalize('!!!');

    expect(result.canonicalName).toBe('');
    expect(result.confidenceScore).toBe(0);
    expect(result.tokens).toEqual([]);
  });
});
