import type {
  AdminMetric,
  AdminQueueIssue,
  OptimizationModeId,
  OptimizationScenario,
  ProfileSnapshot,
  RegionalOffer,
  ShoppingList,
  SupportedCity,
} from './types';

export const optimizationModes: Array<{
  id: OptimizationModeId;
  label: string;
  description: string;
}> = [
  {
    id: 'local',
    label: 'Local',
    description: 'Compra completa no mercado mais prático para hoje.',
  },
  {
    id: 'global_unique',
    label: 'Global único',
    description: 'Melhor loja única para equilibrar cobertura e preço.',
  },
  {
    id: 'global_full',
    label: 'Global completo',
    description: 'Menor custo total, mesmo dividindo a compra em várias lojas.',
  },
];

export const supportedCities: SupportedCity[] = [
  {
    id: 'sao-paulo-sp',
    name: 'São Paulo',
    stateCode: 'SP',
    regionLabel: 'Capital expandida',
    status: 'supported',
    stores: ['Atacadão Butantã', 'Assaí Jaguaré', 'Carrefour Pinheiros'],
    neighborhoods: ['Butantã', 'Pinheiros', 'Jaguaré'],
  },
  {
    id: 'campinas-sp',
    name: 'Campinas',
    stateCode: 'SP',
    regionLabel: 'Metropolitana',
    status: 'supported',
    stores: ['Pague Menos Centro', 'Savegnago Taquaral'],
    neighborhoods: ['Centro', 'Taquaral'],
  },
  {
    id: 'belo-horizonte-mg',
    name: 'Belo Horizonte',
    stateCode: 'MG',
    regionLabel: 'Piloto assistido',
    status: 'pilot',
    stores: ['Supernosso Savassi', 'EPA Centro'],
    neighborhoods: ['Savassi', 'Centro'],
  },
  {
    id: 'curitiba-pr',
    name: 'Curitiba',
    stateCode: 'PR',
    regionLabel: 'Em preparação',
    status: 'soon',
    stores: ['Lançamento em breve'],
    neighborhoods: ['Água Verde'],
  },
];

export const regionalOffers: RegionalOffer[] = [
  {
    id: 'offer-banana-assai',
    cityId: 'sao-paulo-sp',
    storeName: 'Assaí Jaguaré',
    neighborhood: 'Jaguaré',
    productName: 'Banana nanica 1kg',
    normalizedName: 'banana nanica',
    packageLabel: '1 kg',
    price: 4.99,
    previousPrice: 6.29,
    freshness: 'fresh',
    confidence: 'alta',
    updatedAt: '2026-04-25T09:00:00-03:00',
    highlight: 'Melhor preço confirmado hoje na região oeste.',
    evidence: [
      {
        sourceLabel: 'Nota fiscal enviada por Gabriela M.',
        capturedAt: '2026-04-25T09:00:00-03:00',
        sourceType: 'nota',
      },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'offer-cafe-carrefour',
    cityId: 'sao-paulo-sp',
    storeName: 'Carrefour Pinheiros',
    neighborhood: 'Pinheiros',
    productName: 'Café torrado e moído 500g',
    normalizedName: 'cafe tradicional',
    brand: '3 Corações',
    packageLabel: '500 g',
    price: 15.89,
    previousPrice: 18.49,
    freshness: 'fresh',
    confidence: 'alta',
    updatedAt: '2026-04-25T07:10:00-03:00',
    highlight: 'Desconto confirmado com boa cobertura para cesta básica.',
    evidence: [
      {
        sourceLabel: 'Panfleto digital Carrefour',
        capturedAt: '2026-04-25T07:10:00-03:00',
        sourceType: 'panfleto',
      },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'offer-arroz-atacadao',
    cityId: 'sao-paulo-sp',
    storeName: 'Atacadão Butantã',
    neighborhood: 'Butantã',
    productName: 'Arroz tipo 1 5kg',
    normalizedName: 'arroz tipo 1',
    brand: 'Camil',
    packageLabel: '5 kg',
    price: 21.9,
    previousPrice: 25.4,
    freshness: 'aging',
    confidence: 'media',
    updatedAt: '2026-04-23T18:30:00-03:00',
    highlight: 'Preço ainda competitivo, mas pede confirmação em loja.',
    evidence: [
      {
        sourceLabel: 'Cupom enviado por Lucas P.',
        capturedAt: '2026-04-23T18:30:00-03:00',
        sourceType: 'nota',
      },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'offer-feijao-savegnago',
    cityId: 'campinas-sp',
    storeName: 'Savegnago Taquaral',
    neighborhood: 'Taquaral',
    productName: 'Feijão carioca 1kg',
    normalizedName: 'feijao carioca',
    packageLabel: '1 kg',
    price: 7.39,
    previousPrice: 8.59,
    freshness: 'fresh',
    confidence: 'alta',
    updatedAt: '2026-04-25T08:20:00-03:00',
    highlight: 'Oferta confiável para montar lista semanal.',
    evidence: [
      {
        sourceLabel: 'Site oficial Savegnago',
        capturedAt: '2026-04-25T08:20:00-03:00',
        sourceType: 'site',
      },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'offer-leite-paguemenos',
    cityId: 'campinas-sp',
    storeName: 'Pague Menos Centro',
    neighborhood: 'Centro',
    productName: 'Leite integral 1L',
    normalizedName: 'leite integral',
    packageLabel: '1 L',
    price: 4.69,
    previousPrice: 5.19,
    freshness: 'fresh',
    confidence: 'alta',
    updatedAt: '2026-04-25T10:05:00-03:00',
    highlight: 'Boa base para otimização local e única.',
    evidence: [
      {
        sourceLabel: 'Nota validada pela comunidade',
        capturedAt: '2026-04-25T10:05:00-03:00',
        sourceType: 'nota',
      },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80',
  },
];

export const initialShoppingLists: ShoppingList[] = [
  {
    id: 'lista-semana',
    name: 'Compra da semana',
    cityId: 'sao-paulo-sp',
    lastMode: 'global_full',
    updatedAt: '2026-04-25T08:45:00-03:00',
    expectedSavings: 18.4,
    items: [
      {
        id: 'item-arroz',
        name: 'Arroz tipo 1',
        quantity: 1,
        unitLabel: '5 kg',
        status: 'resolved',
      },
      {
        id: 'item-feijao',
        name: 'Feijão carioca',
        quantity: 2,
        unitLabel: '1 kg',
        status: 'resolved',
      },
      {
        id: 'item-banana',
        name: 'Banana nanica',
        quantity: 2,
        unitLabel: 'kg',
        status: 'resolved',
      },
      {
        id: 'item-cafe',
        name: 'Café tradicional',
        quantity: 1,
        unitLabel: '500 g',
        status: 'partial',
        note: 'Comparar marcas equivalentes',
      },
    ],
  },
  {
    id: 'lista-mensal',
    name: 'Reposição mensal',
    cityId: 'campinas-sp',
    lastMode: 'global_unique',
    updatedAt: '2026-04-24T19:30:00-03:00',
    expectedSavings: 27.9,
    items: [
      {
        id: 'item-leite',
        name: 'Leite integral',
        quantity: 12,
        unitLabel: '1 L',
        status: 'resolved',
      },
      {
        id: 'item-papel',
        name: 'Papel higiênico',
        quantity: 2,
        unitLabel: 'pacote',
        status: 'partial',
      },
      {
        id: 'item-oleo',
        name: 'Óleo de soja',
        quantity: 4,
        unitLabel: '900 ml',
        status: 'missing',
      },
    ],
  },
];

export const optimizationScenariosByList: Record<string, OptimizationScenario[]> = {
  'lista-semana': [
    {
      mode: 'local',
      label: 'Local',
      summary: 'Tudo no Atacadão Butantã, com cobertura boa e ida curta.',
      totalEstimatedCost: 63.8,
      estimatedSavings: 8.2,
      coverageLabel: 'Cobertura 3/4 itens com 1 item em revisão',
      tradeoffLabel: 'Menos deslocamento, custo um pouco maior.',
      recommendedStore: 'Atacadão Butantã',
      decisions: [
        {
          id: 'd1',
          itemName: 'Arroz tipo 1',
          quantityLabel: '1 x 5 kg',
          storeName: 'Atacadão Butantã',
          neighborhood: 'Butantã',
          price: 21.9,
          sourceLabel: 'Cupom enviado por Lucas P.',
          updatedAt: '2026-04-23T18:30:00-03:00',
          confidence: 'media',
          status: 'selected',
          note: 'Preço confirmado, mas já com 2 dias.',
        },
        {
          id: 'd2',
          itemName: 'Feijão carioca',
          quantityLabel: '2 x 1 kg',
          storeName: 'Atacadão Butantã',
          neighborhood: 'Butantã',
          price: 15.4,
          sourceLabel: 'Nota fiscal validada',
          updatedAt: '2026-04-24T14:00:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Cobertura completa no mesmo corredor.',
        },
        {
          id: 'd3',
          itemName: 'Banana nanica',
          quantityLabel: '2 x kg',
          storeName: 'Atacadão Butantã',
          neighborhood: 'Butantã',
          price: 11.98,
          sourceLabel: 'Panfleto semanal',
          updatedAt: '2026-04-24T08:20:00-03:00',
          confidence: 'media',
          status: 'selected',
          note: 'Oferta válida só até amanhã.',
        },
        {
          id: 'd4',
          itemName: 'Café tradicional',
          quantityLabel: '1 x 500 g',
          confidence: 'baixa',
          status: 'review',
          note: 'Marca equivalente ainda exige revisão.',
        },
      ],
    },
    {
      mode: 'global_unique',
      label: 'Global único',
      summary: 'Carrefour Pinheiros entrega o melhor total em loja única.',
      totalEstimatedCost: 59.4,
      estimatedSavings: 12.6,
      coverageLabel: 'Cobertura 4/4 itens com 1 item de confiança média',
      tradeoffLabel: 'Melhor loja única do momento.',
      recommendedStore: 'Carrefour Pinheiros',
      decisions: [
        {
          id: 'd5',
          itemName: 'Arroz tipo 1',
          quantityLabel: '1 x 5 kg',
          storeName: 'Carrefour Pinheiros',
          neighborhood: 'Pinheiros',
          price: 22.7,
          sourceLabel: 'Panfleto digital Carrefour',
          updatedAt: '2026-04-25T07:10:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Oferta regular com bom histórico de confirmação.',
        },
        {
          id: 'd6',
          itemName: 'Feijão carioca',
          quantityLabel: '2 x 1 kg',
          storeName: 'Carrefour Pinheiros',
          neighborhood: 'Pinheiros',
          price: 15.8,
          sourceLabel: 'Nota fiscal enviada hoje',
          updatedAt: '2026-04-25T09:12:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Melhor combinação entre preço e frescor.',
        },
        {
          id: 'd7',
          itemName: 'Banana nanica',
          quantityLabel: '2 x kg',
          storeName: 'Carrefour Pinheiros',
          neighborhood: 'Pinheiros',
          price: 13.2,
          sourceLabel: 'Panfleto digital Carrefour',
          updatedAt: '2026-04-25T07:10:00-03:00',
          confidence: 'media',
          status: 'selected',
          note: 'Preço acima do melhor local, mas dentro da mesma loja.',
        },
        {
          id: 'd8',
          itemName: 'Café tradicional',
          quantityLabel: '1 x 500 g',
          storeName: 'Carrefour Pinheiros',
          neighborhood: 'Pinheiros',
          price: 15.89,
          sourceLabel: 'Panfleto digital Carrefour',
          updatedAt: '2026-04-25T07:10:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Melhor preço confirmado do dia.',
        },
      ],
    },
    {
      mode: 'global_full',
      label: 'Global completo',
      summary: 'Melhor custo total dividindo entre Assaí e Carrefour.',
      totalEstimatedCost: 54.7,
      estimatedSavings: 17.3,
      coverageLabel: 'Cobertura 4/4 itens com evidência completa',
      tradeoffLabel: 'Maior economia, duas paradas.',
      decisions: [
        {
          id: 'd9',
          itemName: 'Arroz tipo 1',
          quantityLabel: '1 x 5 kg',
          storeName: 'Atacadão Butantã',
          neighborhood: 'Butantã',
          price: 21.9,
          sourceLabel: 'Cupom enviado por Lucas P.',
          updatedAt: '2026-04-23T18:30:00-03:00',
          confidence: 'media',
          status: 'selected',
          note: 'Ainda é o melhor preço confirmado para o pacote de 5 kg.',
        },
        {
          id: 'd10',
          itemName: 'Feijão carioca',
          quantityLabel: '2 x 1 kg',
          storeName: 'Assaí Jaguaré',
          neighborhood: 'Jaguaré',
          price: 13.82,
          sourceLabel: 'Nota fiscal validada pela comunidade',
          updatedAt: '2026-04-25T09:00:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Melhor valor por quilo hoje.',
        },
        {
          id: 'd11',
          itemName: 'Banana nanica',
          quantityLabel: '2 x kg',
          storeName: 'Assaí Jaguaré',
          neighborhood: 'Jaguaré',
          price: 9.98,
          sourceLabel: 'Nota fiscal enviada por Gabriela M.',
          updatedAt: '2026-04-25T09:00:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Melhor preço confirmado na região oeste.',
        },
        {
          id: 'd12',
          itemName: 'Café tradicional',
          quantityLabel: '1 x 500 g',
          storeName: 'Carrefour Pinheiros',
          neighborhood: 'Pinheiros',
          price: 15.89,
          sourceLabel: 'Panfleto digital Carrefour',
          updatedAt: '2026-04-25T07:10:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Mantém a economia total mais baixa.',
        },
      ],
    },
  ],
  'lista-mensal': [
    {
      mode: 'local',
      label: 'Local',
      summary: 'Savegnago concentra a reposição com menos deslocamento.',
      totalEstimatedCost: 142.4,
      estimatedSavings: 11.6,
      coverageLabel: 'Cobertura 2/3 itens e 1 item sem dado suficiente',
      tradeoffLabel: 'Praticidade primeiro.',
      recommendedStore: 'Savegnago Taquaral',
      decisions: [
        {
          id: 'd13',
          itemName: 'Leite integral',
          quantityLabel: '12 x 1 L',
          storeName: 'Savegnago Taquaral',
          neighborhood: 'Taquaral',
          price: 58.68,
          sourceLabel: 'Site oficial Savegnago',
          updatedAt: '2026-04-25T08:20:00-03:00',
          confidence: 'alta',
          status: 'selected',
          note: 'Preço unitário estável no último ciclo.',
        },
        {
          id: 'd14',
          itemName: 'Papel higiênico',
          quantityLabel: '2 x pacote',
          storeName: 'Savegnago Taquaral',
          neighborhood: 'Taquaral',
          price: 39.8,
          sourceLabel: 'Nota enviada por usuário',
          updatedAt: '2026-04-24T17:20:00-03:00',
          confidence: 'media',
          status: 'selected',
          note: 'Pacote com equivalência revisada.',
        },
        {
          id: 'd15',
          itemName: 'Óleo de soja',
          quantityLabel: '4 x 900 ml',
          confidence: 'baixa',
          status: 'missing',
          note: 'Sem preço confirmado hoje para a embalagem pedida.',
        },
      ],
    },
  ],
};

export const profileSnapshot: ProfileSnapshot = {
  totalEstimatedSavings: 427.3,
  listsCreated: 18,
  receiptsShared: 34,
  invalidPromotionReports: 5,
};

export const adminMetrics: AdminMetric[] = [
  {
    id: 'm1',
    label: 'Ofertas válidas hoje',
    value: '1.284',
    support: '73 com cobertura parcial e 41 em revisão',
  },
  {
    id: 'm2',
    label: 'Notas em processamento',
    value: '29',
    support: 'tempo médio de ingestão: 2m14s',
  },
  {
    id: 'm3',
    label: 'Produtos normalizados',
    value: '8.412',
    support: '162 aliases novos nesta semana',
  },
  {
    id: 'm4',
    label: 'Listas otimizadas hoje',
    value: '316',
    support: '58% Global completo, 24% Local, 18% Global único',
  },
];

export const adminQueueIssues: AdminQueueIssue[] = [
  {
    id: 'q1',
    stage: 'OCR de nota',
    message: 'Nota sem CNPJ legível, aguardando revisão humana.',
    createdAt: '2026-04-25T09:40:00-03:00',
    severity: 'warning',
  },
  {
    id: 'q2',
    stage: 'Sanitização',
    message: '“CAF 3C TRAD 500” precisa de confirmação de produto.',
    createdAt: '2026-04-25T09:12:00-03:00',
    severity: 'critical',
  },
  {
    id: 'q3',
    stage: 'Cluster de promoções',
    message: 'Promoção reportada como encerrada por 3 usuários.',
    createdAt: '2026-04-25T08:55:00-03:00',
    severity: 'info',
  },
];

export function getCityById(cityId: string) {
  return supportedCities.find((city) => city.id === cityId) ?? supportedCities[0];
}

export function getOffersForCity(cityId: string) {
  return regionalOffers.filter((offer) => offer.cityId === cityId);
}

export function getOfferById(offerId: string) {
  return regionalOffers.find((offer) => offer.id === offerId);
}

export function getOptimizationScenarios(listId: string) {
  return optimizationScenariosByList[listId] ?? [];
}

