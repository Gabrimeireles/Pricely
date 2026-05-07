import { Injectable } from '@nestjs/common';

export interface ParsedQrCode {
  accessKey?: string;
  sefazUrl?: string;
}

@Injectable()
export class QrCodeParserService {
  parse(value?: string): ParsedQrCode {
    if (!value) {
      return {};
    }

    const text = value.trim();
    const url = this.extractUrl(text);
    const accessKey = this.extractAccessKey(text);

    return {
      accessKey,
      sefazUrl: url,
    };
  }

  private extractUrl(value: string): string | undefined {
    try {
      const url = new URL(value);

      return url.toString();
    } catch {
      return undefined;
    }
  }

  private extractAccessKey(value: string): string | undefined {
    const directMatch = value.match(/\b\d{44}\b/);

    if (directMatch) {
      return directMatch[0];
    }

    try {
      const url = new URL(value);
      const candidates = [
        url.searchParams.get('chNFe'),
        url.searchParams.get('chave'),
        url.searchParams.get('key'),
        url.searchParams.get('p'),
      ].filter((candidate): candidate is string => Boolean(candidate));

      for (const candidate of candidates) {
        const match = candidate.match(/\d{44}/);

        if (match) {
          return match[0];
        }
      }
    } catch {
      return undefined;
    }

    return undefined;
  }
}
