import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Prisma demo seed coverage', () => {
  const seedSource = readFileSync(
    join(__dirname, '../../prisma/seed.js'),
    'utf8',
  );

  it('keeps city, establishment, variant, and offer demo coverage broad enough for homolog QA', () => {
    expect(seedSource).toContain('rio-de-janeiro-rj');
    expect(seedSource).toContain('curitiba-pr');
    expect(seedSource).toContain('Unidade Santo Amaro');
    expect(seedSource).toContain('Unidade Santana');
    expect(seedSource).toContain('Unidade Tatuape');
    expect(seedSource).toContain('Atacado Guanabara');
    expect(seedSource).toContain('feijao-carioca-camil-1kg');
    expect(seedSource).toContain('coca-cola-sem-acucar-200ml');
    expect(seedSource).toContain('biscoito-piraque-80g');
    expect(seedSource).toContain('Seed baixa confianca');
    expect(seedSource).toContain('Seed Rio comparativo');
  });

  it('keeps base catalog names separate from package labels used by variants', () => {
    for (const duplicatedBaseName of [
      "name: 'Arroz tipo 1 5kg'",
      "name: 'Feijao carioca 1kg'",
      "name: 'Acucar refinado 1kg'",
      "name: 'Oleo de soja 900ml'",
      "name: 'Papel higienico 12 rolos'",
    ]) {
      expect(seedSource).not.toContain(duplicatedBaseName);
    }
  });

  it('keeps receipt and processing-job states for admin queue and trust-evidence QA', () => {
    for (const expected of [
      "status: 'queued'",
      "status: 'retrying'",
      "status: 'completed'",
      "status: 'failed'",
      "parseStatus: 'queued'",
      "parseStatus: 'partial'",
      "parseStatus: 'parsed'",
      "parseStatus: 'failed'",
      "moderationStatus: 'accepted'",
      "moderationStatus: 'pending'",
      "moderationStatus: 'quarantined'",
      "moderationStatus: 'duplicate'",
      "moderationStatus: 'rejected'",
      "reviewReason: 'receipt_reward_granted'",
      "reviewReason: 'duplicate_receipt'",
      "reviewReason: 'invalid_receipt_payload'",
      "sourceType: 'receipt'",
      'receiptLineItemId',
    ]) {
      expect(seedSource).toContain(expected);
    }
  });
});
