// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  AdminActionQueueItem,
  EvidenceModule,
  NextActionStrip,
  PriceRow,
  StatusBadge,
  StickyActionBar,
  TechnicalDisclosure,
} from './index';

afterEach(cleanup);

describe('design-system component foundation', () => {
  it('renders semantic status badges with accessible text', () => {
    render(<StatusBadge family="trust" status="high" />);

    expect(screen.getByText('Confiança alta')).toBeTruthy();
  });

  it('renders an evidence module with trust score and receipt evidence', () => {
    render(
      <EvidenceModule
        selectedVariant="Camil Arroz tipo 1 1kg"
        requestedRule="Qualquer variante"
        store="Mercado Centro"
        price="R$ 7,90"
        sourceLabel="Recibo de usuário"
        trustScore={82}
        trustLevel="high"
        evidenceCount={4}
        freshnessLabel="Validado há 3d"
        confidenceNotice="Preco observado em recibo recente."
      />,
    );

    expect(screen.getByText('Confiança da oferta')).toBeTruthy();
    expect(screen.getByText('82/100')).toBeTruthy();
    expect(screen.getByText('4 notas fiscais aceitas')).toBeTruthy();
    expect(screen.getByText('Camil Arroz tipo 1 1kg')).toBeTruthy();
  });

  it('renders a reusable price row', () => {
    render(
      <PriceRow
        title="Arroz tipo 1"
        subtitle="Mercado Centro"
        price="R$ 7,90"
        comparison="R$ 1,50 abaixo da proxima alternativa"
      />,
    );

    expect(screen.getByText('Arroz tipo 1')).toBeTruthy();
    expect(screen.getByText('R$ 7,90')).toBeTruthy();
  });

  it('renders workflow and admin primitives', () => {
    render(
      <>
        <NextActionStrip
          eyebrow="Próximo passo"
          title="Otimize sua lista"
          description="Compare lojas antes de sair para comprar."
        />
        <StickyActionBar>Ação fixa</StickyActionBar>
        <AdminActionQueueItem
          title="Nota aguardando liberacao"
          severity="warning"
          context="Mercado Centro"
        />
        <TechnicalDisclosure>
          <code>receipt-1</code>
        </TechnicalDisclosure>
      </>,
    );

    expect(screen.getByText('Otimize sua lista')).toBeTruthy();
    expect(screen.getByText('Ação fixa')).toBeTruthy();
    expect(screen.getByText('Nota aguardando liberacao')).toBeTruthy();
    expect(screen.getByText('receipt-1')).toBeTruthy();
  });
});
