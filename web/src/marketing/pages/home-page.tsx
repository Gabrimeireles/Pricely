import { Button } from '../../components/ui/button';
import { SiteHeader } from '../components/site-header';
import { ValuePillars } from '../components/value-pillars';
import { WorkflowPreview } from '../components/workflow-preview';

export function HomePage() {
  return (
    <main className="marketing-shell">
      <div className="marketing-backdrop marketing-backdrop--one" />
      <div className="marketing-backdrop marketing-backdrop--two" />

      <div className="marketing-container">
        <SiteHeader />

        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">First build da economia orientada por recibos</span>
            <h1>
              Sua lista mais barata, dividida entre mercados, com clareza de total e de
              economia.
            </h1>
            <p>
              O Pricely transforma lista de compras e historico de recibos em um plano
              acionavel: qual item comprar em cada loja, quanto voce paga no total e
              onde vale a pena dividir a rota.
            </p>

            <div className="hero-actions">
              <Button className="button button--primary">Quero testar o app</Button>
              <Button className="button button--ghost">Ver fluxo da otimização</Button>
            </div>

            <div className="hero-proof">
              <div>
                <strong>3 passos</strong>
                <span>lista, recibo e resultado</span>
              </div>
              <div>
                <strong>multi-mercado</strong>
                <span>seleciona a oferta valida mais barata</span>
              </div>
              <div>
                <strong>rastreamento claro</strong>
                <span>subtotal por loja e itens sem oferta</span>
              </div>
            </div>
          </div>

          <aside className="hero-aside">
            <div className="hero-aside__card hero-aside__card--top">
              <span className="eyebrow">Semana em andamento</span>
              <strong>Lista da semana</strong>
              <p>Arroz, feijao, banana, tomate, cafe e itens da feira.</p>
            </div>

            <div className="hero-aside__card hero-aside__card--bottom">
              <span className="eyebrow">Leitura do resultado</span>
              <div className="stat-row">
                <span>Total otimizado</span>
                <strong>R$ 54,70</strong>
              </div>
              <div className="stat-row">
                <span>Economia estimada</span>
                <strong>R$ 8,50</strong>
              </div>
              <div className="stat-row">
                <span>Lojas sugeridas</span>
                <strong>2</strong>
              </div>
            </div>
          </aside>
        </section>

        <ValuePillars />
        <WorkflowPreview />

        <section className="section-card cta-band">
          <div>
            <span className="eyebrow">Pronto para homolog</span>
            <h2>US1 entregue com backend, mobile e uma landing clara para apresentar o produto.</h2>
          </div>

          <Button className="button button--primary">Abrir demo do Pricely</Button>
        </section>
      </div>
    </main>
  );
}
