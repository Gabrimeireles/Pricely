const pillars = [
  {
    title: 'Monte uma lista real',
    description:
      'Comece pela compra da semana, da feira ou do churrasco. O fluxo foi pensado para listas curtas e longas.',
  },
  {
    title: 'Alimente os precos com recibos',
    description:
      'Cada recibo melhora o mapa de ofertas por item e por loja, sem depender de panfleto manual.',
  },
  {
    title: 'Receba o plano mais barato',
    description:
      'O resultado mostra total otimizado, economia estimada e a divisao por mercado com rastreabilidade.',
  },
];

export function ValuePillars() {
  return (
    <section className="section-card" id="vantagens">
      <div className="section-heading">
        <span className="eyebrow">Valor em tres movimentos</span>
        <h2>Um fluxo simples para transformar recibos soltos em decisao de compra.</h2>
      </div>

      <div className="pillars-grid">
        {pillars.map((pillar, index) => (
          <article className="pillar-card" key={pillar.title}>
            <span className="pillar-card__index">0{index + 1}</span>
            <h3>{pillar.title}</h3>
            <p>{pillar.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
