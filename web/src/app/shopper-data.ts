// Demo data + types for the shopper product. Swap for `@/app/api` calls when
// wiring to the backend. Currency/labels are PT-BR.

export type TrustLevel = 'high' | 'medium' | 'low' | 'unknown';
export type CityStatus = 'active' | 'activating' | 'collecting_data' | 'hidden';

export type City = {
  id: string;
  name: string;
  status: CityStatus;
  stores: number;
  district: string;
};

export type Offer = {
  id: string;
  title: string;
  pack: string;
  image: string;
  store: string;
  distance: string;
  price: string;
  save: string;
  trust: TrustLevel;
  score: number;
  category?: string;
};

export type ListItem = {
  id: string;
  name: string;
  pack: string;
  image: string;
  qty: number;
  rule: 'any' | 'brand' | 'exact';
};

export const RADII = [3, 5, 10, 15, 30] as const;

export const CITIES: City[] = [
  { id: 'sp', name: 'São Paulo, SP', status: 'active', stores: 8, district: 'Centro' },
  { id: 'gru', name: 'Guarulhos, SP', status: 'active', stores: 5, district: 'Centro' },
  { id: 'cps', name: 'Campinas, SP', status: 'activating', stores: 0, district: '—' },
  { id: 'rj', name: 'Rio de Janeiro, RJ', status: 'collecting_data', stores: 3, district: 'Tijuca' },
];

const p = (image: string) => `/assets/products/${image}`;

export const OFFERS: Offer[] = [
  { id: 'arroz', title: 'Arroz Branco', pack: 'Camil tipo 1 · 5kg', image: p('arroz.png'), store: 'Atacadão Mooca', distance: '2,1 km', price: 'R$ 24,89', save: 'R$ 3,20', trust: 'high', score: 98 },
  { id: 'leite', title: 'Leite Integral', pack: 'Italac · 1L', image: p('leite.png'), store: 'Carrefour V. Mariana', distance: '1,8 km', price: 'R$ 4,59', save: 'R$ 1,10', trust: 'high', score: 92 },
  { id: 'ovos', title: 'Ovos Brancos', pack: 'Dúzia · 12 un', image: p('ovos.png'), store: 'Assaí Ipiranga', distance: '2,4 km', price: 'R$ 8,79', save: 'R$ 1,30', trust: 'medium', score: 78 },
  { id: 'cafe', title: 'Café Torrado', pack: 'Melitta · 500g', image: p('cafe.png'), store: 'Mercado Centro', distance: '1,2 km', price: 'R$ 16,80', save: 'R$ 2,10', trust: 'medium', score: 75 },
  { id: 'feijao', title: 'Feijão Carioca', pack: 'Camil · 1kg', image: p('feijao.png'), store: 'Atacadão Mooca', distance: '3,1 km', price: 'R$ 6,39', save: 'R$ 0,90', trust: 'high', score: 84 },
  { id: 'acucar', title: 'Açúcar Refinado', pack: 'União · 1kg', image: p('acucar.png'), store: 'Mercado Centro', distance: '1,2 km', price: 'R$ 4,79', save: 'R$ 0,60', trust: 'high', score: 90 },
  { id: 'oleo', title: 'Óleo de Soja', pack: 'Liza · 900ml', image: p('oleo.png'), store: 'Extra Paulista', distance: '2,7 km', price: 'R$ 7,49', save: 'R$ 1,40', trust: 'medium', score: 72 },
  { id: 'macarrao', title: 'Macarrão Espaguete', pack: 'Renata · 500g', image: p('macarrao.png'), store: 'Assaí Ipiranga', distance: '2,4 km', price: 'R$ 3,29', save: 'R$ 0,50', trust: 'high', score: 86 },
];

export const LIST_SEED: ListItem[] = [
  { id: '1', name: 'Arroz tipo 1', pack: '1kg', image: p('arroz.png'), qty: 2, rule: 'any' },
  { id: '2', name: 'Leite integral', pack: '1L', image: p('leite.png'), qty: 6, rule: 'exact' },
  { id: '3', name: 'Café torrado', pack: '500g', image: p('cafe.png'), qty: 1, rule: 'brand' },
  { id: '4', name: 'Feijão carioca', pack: '1kg', image: p('feijao.png'), qty: 1, rule: 'any' },
  { id: '5', name: 'Açúcar refinado', pack: '1kg', image: p('acucar.png'), qty: 1, rule: 'any' },
  { id: '6', name: 'Óleo de soja', pack: '900ml', image: p('oleo.png'), qty: 1, rule: 'any' },
];

export const BRAND_RULES: { value: ListItem['rule']; label: string; tone: string }[] = [
  { value: 'any', label: 'Qualquer variante', tone: 'primary' },
  { value: 'brand', label: 'Marcas preferidas', tone: 'warning' },
  { value: 'exact', label: 'Variante exata', tone: 'location' },
];
