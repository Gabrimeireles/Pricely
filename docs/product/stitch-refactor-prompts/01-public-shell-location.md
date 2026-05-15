# Stitch Prompt: Web Public Shell and Location Context

Create only this web shell composition for Pricely public/logged-in shopper flows.

Use `00-system-summary.md`, `00-design-system.md`, `WEB-CONTEXT-PROMPT.md` and the approved components from `WEB-COMPONENT-PROMPTS.md`.

Important:
- Do not redesign the global components.
- Reuse `C01 Web Public Header`.
- Reuse `C02 Web City Location Radius Strip`.
- This prompt is for validating how the shell components work together, not for creating a full page.
- Include light and dark mode behavior through tokens.

Screen purpose:
This shell appears around all public shopper screens. It must make city, location precision and radius visible without dominating the app.

Required content:
- Header component.
- Location/radius strip component.
- Empty main content slot with neutral placeholder label: "Conteudo da tela".
- The strip must support five visible states:
  - city-only: "Sao Paulo - cobertura por cidade"
  - precise coordinates: "Distancia ativa - raio 5 km"
  - CEP fallback: "CEP salvo - sem promessa de proximidade"
  - permission denied: "Permissao negada - use CEP ou cidade"
  - unsupported geolocation: "Geolocalizacao indisponivel"
- Explicit note: only precise coordinates enable distance-based local optimization.
- CEP and city-only states must not claim proximity.
- Actions: use location, save CEP, change city.

Layout:
- Desktop: header top, context strip directly below, main content area below.
- Mobile: compact header, nav collapsed or horizontal scroll, context strip as condensed stacked rows.
- No horizontal overflow at mobile sizes.

Visual constraints:
- Operational, compact, no marketing hero.
- Use semantic status badges and icons.
- Avoid nested cards.
