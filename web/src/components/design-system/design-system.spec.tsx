// @vitest-environment jsdom

import type React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MonetaryPrivacyProvider } from '@/app/monetary-privacy-context';
import { TooltipProvider } from '@/components/ui/tooltip';

import {
  ActionPlaceholder,
  AdminActionQueueItem,
  EvidenceModule,
  InfoTooltip,
  MaskedMoney,
  NextActionStrip,
  PriceRow,
  StatusBadge,
  StickyActionBar,
  TechnicalDisclosure,
} from './index';

afterEach(() => {
  window.localStorage.clear();
  cleanup();
});

function renderDesignSystem(ui: React.ReactNode) {
  return render(
    <TooltipProvider>
      <MonetaryPrivacyProvider>{ui}</MonetaryPrivacyProvider>
    </TooltipProvider>,
  );
}

describe('design-system component foundation', () => {
  it('renders semantic status badges with accessible text', () => {
    renderDesignSystem(<StatusBadge family="trust" status="high" />);

    expect(screen.getByText('Confiança alta')).toBeTruthy();
  });

  it('renders an evidence module with trust score and receipt evidence', () => {
    renderDesignSystem(
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
    renderDesignSystem(
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
    renderDesignSystem(
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

  it('renders action placeholders, info tooltip triggers, and masked money', () => {
    window.localStorage.setItem('pricely-money-visible-v1', 'hidden');

    renderDesignSystem(
      <>
        <ActionPlaceholder
          title="Envie sua primeira nota fiscal"
          description="Acompanhe a validação depois do envio."
        />
        <InfoTooltip label="Valores podem ser ocultados." />
        <MaskedMoney value="R$ 42,90" />
      </>,
    );

    expect(screen.getByText('Envie sua primeira nota fiscal')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /saiba como funciona/i }),
    ).toBeTruthy();
    expect(screen.getByText('R$ •••')).toBeTruthy();
    expect(screen.queryByText('R$ 42,90')).toBeNull();
  });
});
