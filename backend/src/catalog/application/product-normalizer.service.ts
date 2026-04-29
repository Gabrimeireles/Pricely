import { Injectable } from '@nestjs/common';

export interface NormalizedProduct {
  canonicalName: string;
  normalizedText: string;
  sizeDescriptor?: string;
  confidenceScore: number;
  aliasApplied: boolean;
  tokens: string[];
}

const TOKEN_ALIASES: Record<string, string> = {
  cx: 'caixa',
  int: 'integral',
  lt: 'l',
  lts: 'l',
  pct: 'pacote',
  tp1: 'tipo 1',
  und: 'unidade',
};

@Injectable()
export class ProductNormalizerService {
  normalize(rawName: string): NormalizedProduct {
    const sanitized = this.sanitize(rawName);
    const { sizeDescriptor, textWithoutSize } = this.extractSizeDescriptor(sanitized);
    const { normalizedText, aliasApplied } = this.expandAliases(textWithoutSize);
    const tokens = normalizedText.split(' ').filter(Boolean);

    return {
      canonicalName: tokens.join(' '),
      normalizedText,
      sizeDescriptor,
      confidenceScore: this.scoreNormalization(tokens, aliasApplied, sizeDescriptor),
      aliasApplied,
      tokens,
    };
  }

  private sanitize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractSizeDescriptor(value: string): {
    sizeDescriptor?: string;
    textWithoutSize: string;
  } {
    const match = value.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|mg|ml|l|un)\b/);

    if (!match) {
      return {
        textWithoutSize: value,
      };
    }

    const numericValue = match[1].replace(',', '.');
    const unit = match[2];
    const textWithoutSize = value
      .replace(match[0], ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      sizeDescriptor: `${numericValue} ${unit}`,
      textWithoutSize,
    };
  }

  private expandAliases(value: string): {
    normalizedText: string;
    aliasApplied: boolean;
  } {
    let aliasApplied = false;

    const expandedTokens = value
      .split(' ')
      .filter(Boolean)
      .flatMap((token) => {
        const expanded = TOKEN_ALIASES[token];

        if (!expanded) {
          return [token];
        }

        aliasApplied = true;
        return expanded.split(' ');
      });

    return {
      normalizedText: expandedTokens.join(' '),
      aliasApplied,
    };
  }

  private scoreNormalization(
    tokens: string[],
    aliasApplied: boolean,
    sizeDescriptor?: string,
  ): number {
    if (tokens.length === 0) {
      return 0;
    }

    const baseScore = 0.6;
    const aliasBonus = aliasApplied ? 0.15 : 0;
    const sizeBonus = sizeDescriptor ? 0.15 : 0;
    const tokenBonus = Math.min(tokens.length * 0.05, 0.1);

    return Math.min(1, Number((baseScore + aliasBonus + sizeBonus + tokenBonus).toFixed(2)));
  }
}
