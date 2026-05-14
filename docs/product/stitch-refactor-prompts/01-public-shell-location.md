# Stitch Prompt: Public App Shell and Location Context

Create a responsive web app shell for Pricely public/logged-in shopper flows.

Use `00-system-summary.md` and `00-design-system.md`.

Screen purpose:
This shell appears around all public shopper screens. It must make city, location precision and radius visible without dominating the app.

Required content:
- Header with Pricely icon, primary nav: Ofertas, Cidades, Minhas listas, Notas fiscais.
- Auth/profile area with account action.
- Compact city selector.
- Persistent location/radius context strip.
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

Visual constraints:
- Operational, compact, no marketing hero.
- Use semantic status badges and icons.
- Avoid nested cards.

