const storeBreakdown = [
  { store: 'Mercado Azul', amount: 'R$ 34,20', items: 'Arroz, feijao, macarrao' },
  { store: 'Super Verde', amount: 'R$ 20,50', items: 'Banana, tomate, alface' },
];

export function WorkflowPreview() {
  return (
    <section className="section-card workflow" id="como-funciona">
      <div className="section-heading">
        <span className="eyebrow">Leitura rapida do produto</span>
        <h2>O Pricely organiza a compra com foco em economia real, nao em planilha fria.</h2>
      </div>

      <div className="workflow-grid">
        <article className="workflow-panel workflow-panel--soft">
          <span className="workflow-panel__label">Fluxo mobile</span>
          <ul className="check-list">
            <li>Crie a lista da semana em segundos.</li>
            <li>Envie recibos por loja para atualizar os precos.</li>
            <li>Reaproveite rascunhos e resultados em cache.</li>
          </ul>
        </article>

        <article className="workflow-panel workflow-panel--accent">
          <span className="workflow-panel__label">Resultado otimizado</span>
          <div className="price-highlight">
            <strong>R$ 54,70</strong>
            <span>Economia estimada: R$ 8,50</span>
          </div>

          <div className="store-stack">
            {storeBreakdown.map((store) => (
              <div className="store-card" key={store.store}>
                <div>
                  <strong>{store.store}</strong>
                  <p>{store.items}</p>
                </div>
                <span>{store.amount}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
