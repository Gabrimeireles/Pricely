const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = hashSync('admin-password', 10);
  const customerPasswordHash = hashSync('customer-password', 10);

  const admin = await prisma.userAccount.upsert({
    where: { email: 'admin@pricely.local' },
    update: {
      passwordHash: adminPasswordHash,
      displayName: 'Admin Pricely',
      role: 'admin',
      status: 'active',
    },
    create: {
      email: 'admin@pricely.local',
      passwordHash: adminPasswordHash,
      displayName: 'Admin Pricely',
      role: 'admin',
    },
  });

  const customer = await prisma.userAccount.upsert({
    where: { email: 'customer@pricely.local' },
    update: {
      passwordHash: customerPasswordHash,
      displayName: 'Cliente Pricely',
      role: 'customer',
      status: 'active',
    },
    create: {
      email: 'customer@pricely.local',
      passwordHash: customerPasswordHash,
      displayName: 'Cliente Pricely',
      role: 'customer',
    },
  });

  await prisma.userEntitlement.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    update: {
      userId: admin.id,
      plan: 'premium',
      status: 'active',
      source: 'seed_admin',
      endsAt: null,
    },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      userId: admin.id,
      plan: 'premium',
      status: 'active',
      source: 'seed_admin',
    },
  });

  const region = await prisma.region.upsert({
    where: { slug: 'sao-paulo-sp' },
    update: {},
    create: {
      slug: 'sao-paulo-sp',
      name: 'São Paulo',
      stateCode: 'SP',
      implantationStatus: 'active',
      publicSortOrder: 1,
    },
  });

  await prisma.region.upsert({
    where: { slug: 'campinas-sp' },
    update: {},
    create: {
      slug: 'campinas-sp',
      name: 'Campinas',
      stateCode: 'SP',
      implantationStatus: 'activating',
      publicSortOrder: 2,
    },
  });

  const rioRegion = await prisma.region.upsert({
    where: { slug: 'rio-de-janeiro-rj' },
    update: {
      implantationStatus: 'active',
      publicSortOrder: 3,
    },
    create: {
      slug: 'rio-de-janeiro-rj',
      name: 'Rio de Janeiro',
      stateCode: 'RJ',
      implantationStatus: 'active',
      publicSortOrder: 3,
    },
  });

  await prisma.region.upsert({
    where: { slug: 'curitiba-pr' },
    update: {
      implantationStatus: 'activating',
      publicSortOrder: 4,
    },
    create: {
      slug: 'curitiba-pr',
      name: 'Curitiba',
      stateCode: 'PR',
      implantationStatus: 'activating',
      publicSortOrder: 4,
    },
  });

  const establishment = await prisma.establishment.upsert({
    where: { cnpj: '12.345.678/0001-99' },
    update: {
      addressLine: 'Rua dos Pinheiros, 870',
      postalCode: '05422-001',
      latitude: '-23.566263',
      longitude: '-46.683677',
      locationSource: 'seed',
    },
    create: {
      brandName: 'Mercado Exemplo',
      unitName: 'Unidade Pinheiros',
      cnpj: '12.345.678/0001-99',
      cityName: 'São Paulo',
      neighborhood: 'Pinheiros',
      addressLine: 'Rua dos Pinheiros, 870',
      postalCode: '05422-001',
      latitude: '-23.566263',
      longitude: '-46.683677',
      locationSource: 'seed',
      regionId: region.id,
      isActive: true,
    },
  });

  const comparisonEstablishment = await prisma.establishment.upsert({
    where: { cnpj: '98.765.432/0001-11' },
    update: {
      addressLine: 'Rua Domingos de Morais, 1581',
      postalCode: '04010-200',
      latitude: '-23.589108',
      longitude: '-46.634853',
      locationSource: 'seed',
    },
    create: {
      brandName: 'Mercado Comparativo',
      unitName: 'Unidade Vila Mariana',
      cnpj: '98.765.432/0001-11',
      cityName: 'Sao Paulo',
      neighborhood: 'Vila Mariana',
      addressLine: 'Rua Domingos de Morais, 1581',
      postalCode: '04010-200',
      latitude: '-23.589108',
      longitude: '-46.634853',
      locationSource: 'seed',
      regionId: region.id,
      isActive: true,
    },
  });

  const extraEstablishments = await Promise.all(
    [
      {
        cnpj: '11.111.111/0001-10',
        brandName: 'Atacado Sul',
        unitName: 'Unidade Santo Amaro',
        cityName: 'Sao Paulo',
        neighborhood: 'Santo Amaro',
        addressLine: 'Avenida Santo Amaro, 5200',
        postalCode: '04702-001',
        latitude: '-23.652032',
        longitude: '-46.709805',
        regionId: region.id,
      },
      {
        cnpj: '22.222.222/0001-20',
        brandName: 'Mercado Carioca',
        unitName: 'Unidade Botafogo',
        cityName: 'Rio de Janeiro',
        neighborhood: 'Botafogo',
        addressLine: 'Rua Voluntarios da Patria, 190',
        postalCode: '22270-010',
        latitude: '-22.952163',
        longitude: '-43.184255',
        regionId: rioRegion.id,
      },
      {
        cnpj: '33.333.333/0001-30',
        brandName: 'Atacado Guanabara',
        unitName: 'Unidade Tijuca',
        cityName: 'Rio de Janeiro',
        neighborhood: 'Tijuca',
        addressLine: 'Rua Conde de Bonfim, 420',
        postalCode: '20520-054',
        latitude: '-22.924874',
        longitude: '-43.232384',
        regionId: rioRegion.id,
      },
    ].map((entry) =>
      prisma.establishment.upsert({
        where: { cnpj: entry.cnpj },
        update: {
          brandName: entry.brandName,
          unitName: entry.unitName,
          cityName: entry.cityName,
          neighborhood: entry.neighborhood,
          addressLine: entry.addressLine,
          postalCode: entry.postalCode,
          latitude: entry.latitude,
          longitude: entry.longitude,
          locationSource: 'seed',
          regionId: entry.regionId,
          isActive: true,
        },
        create: {
          ...entry,
          locationSource: 'seed',
          isActive: true,
        },
      }),
    ),
  );

  const catalogProduct = await prisma.catalogProduct.upsert({
    where: { slug: 'arroz-tipo-1-5kg' },
    update: {},
    create: {
      slug: 'arroz-tipo-1-5kg',
      name: 'Arroz tipo 1 5kg',
      category: 'mercearia',
      defaultUnit: '5 kg',
      isActive: true,
    },
  });

  const coffeeCatalogProduct = await prisma.catalogProduct.upsert({
    where: { slug: 'cafe-torrado-500g' },
    update: {},
    create: {
      slug: 'cafe-torrado-500g',
      name: 'Cafe torrado',
      category: 'mercearia',
      defaultUnit: 'un',
      isActive: true,
    },
  });

  const seededProducts = await Promise.all(
    [
      {
        slug: 'feijao-carioca-1kg',
        name: 'Feijao carioca 1kg',
        category: 'mercearia',
        defaultUnit: '1 kg',
        imageUrl:
          'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'leite-integral-1l',
        name: 'Leite integral 1L',
        category: 'laticinios',
        defaultUnit: '1 L',
        imageUrl:
          'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'acucar-refinado-1kg',
        name: 'Acucar refinado 1kg',
        category: 'mercearia',
        defaultUnit: '1 kg',
        imageUrl:
          'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'oleo-soja-900ml',
        name: 'Oleo de soja 900ml',
        category: 'mercearia',
        defaultUnit: '900 ml',
        imageUrl:
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'macarrao-espaguete-500g',
        name: 'Macarrao espaguete 500g',
        category: 'mercearia',
        defaultUnit: '500 g',
        imageUrl:
          'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'molho-tomate-340g',
        name: 'Molho de tomate 340g',
        category: 'mercearia',
        defaultUnit: '340 g',
        imageUrl:
          'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'banana-nanica-1kg',
        name: 'Banana nanica 1kg',
        category: 'hortifruti',
        defaultUnit: '1 kg',
        imageUrl:
          'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'ovos-brancos-12un',
        name: 'Ovos brancos 12 unidades',
        category: 'proteinas',
        defaultUnit: '12 un',
        imageUrl:
          'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'detergente-neutro-500ml',
        name: 'Detergente neutro 500ml',
        category: 'limpeza',
        defaultUnit: '500 ml',
        imageUrl:
          'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80',
      },
      {
        slug: 'papel-higienico-12-rolos',
        name: 'Papel higienico 12 rolos',
        category: 'higiene',
        defaultUnit: '12 rolos',
        imageUrl:
          'https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=900&q=80',
      },
    ].map((entry) =>
      prisma.catalogProduct.upsert({
        where: { slug: entry.slug },
        update: {
          name: entry.name,
          category: entry.category,
          defaultUnit: entry.defaultUnit,
          imageUrl: entry.imageUrl,
          isActive: true,
        },
        create: {
          ...entry,
          isActive: true,
        },
      }),
    ),
  );

  const productVariant = await prisma.productVariant.upsert({
    where: { slug: 'arroz-tipo-1-5kg-seed-5kg' },
    update: {
      brandName: 'Camil',
      imageUrl:
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
    },
    create: {
      catalogProductId: catalogProduct.id,
      slug: 'arroz-tipo-1-5kg-seed-5kg',
      displayName: 'Arroz Camil tipo 1 5kg',
      brandName: 'Camil',
      packageLabel: '5 kg',
      imageUrl:
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
      isActive: true,
    },
  });

  const coffeeVariant = await prisma.productVariant.upsert({
    where: { slug: 'cafe-pilao-500g' },
    update: {},
    create: {
      catalogProductId: coffeeCatalogProduct.id,
      slug: 'cafe-pilao-500g',
      displayName: 'Cafe Pilao 500g',
      brandName: 'Pilao',
      packageLabel: '500 g',
      isActive: true,
    },
  });

  const seededVariants = await Promise.all(
    [
      {
        product: seededProducts[0],
        slug: 'feijao-carioca-kicaldo-1kg',
        displayName: 'Feijao Carioca Kicaldo 1kg',
        brandName: 'Kicaldo',
        packageLabel: '1 kg',
        imageUrl:
          'https://placehold.co/900x600/e8f5e9/14532d?text=Feijao+Kicaldo+1kg',
      },
      {
        product: seededProducts[0],
        slug: 'feijao-carioca-camil-1kg',
        displayName: 'Feijao Carioca Camil 1kg',
        brandName: 'Camil',
        packageLabel: '1 kg',
        imageUrl:
          'https://placehold.co/900x600/ecfdf5/047857?text=Feijao+Camil+1kg',
      },
      {
        product: seededProducts[1],
        slug: 'leite-integral-italac-1l',
        displayName: 'Leite Integral Italac 1L',
        brandName: 'Italac',
        packageLabel: '1 L',
        imageUrl:
          'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[2],
        slug: 'acucar-uniao-refinado-1kg',
        displayName: 'Acucar Uniao Refinado 1kg',
        brandName: 'Uniao',
        packageLabel: '1 kg',
        imageUrl:
          'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[3],
        slug: 'oleo-soya-900ml',
        displayName: 'Oleo Soya 900ml',
        brandName: 'Soya',
        packageLabel: '900 ml',
        imageUrl:
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: catalogProduct,
        slug: 'arroz-prato-fino-tipo-1-5kg',
        displayName: 'Arroz Prato Fino tipo 1 5kg',
        brandName: 'Prato Fino',
        packageLabel: '5 kg',
        imageUrl:
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: coffeeCatalogProduct,
        slug: 'cafe-melitta-tradicional-500g',
        displayName: 'Cafe Melitta Tradicional 500g',
        brandName: 'Melitta',
        packageLabel: '500 g',
        imageUrl:
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[4],
        slug: 'macarrao-renata-espaguete-500g',
        displayName: 'Macarrao Renata Espaguete 500g',
        brandName: 'Renata',
        packageLabel: '500 g',
        imageUrl:
          'https://placehold.co/900x600/fff7ed/c2410c?text=Macarrao+Renata+500g',
      },
      {
        product: seededProducts[4],
        slug: 'macarrao-barilla-spaghetti-500g',
        displayName: 'Macarrao Barilla Spaghetti 500g',
        brandName: 'Barilla',
        packageLabel: '500 g',
        imageUrl:
          'https://placehold.co/900x600/eff6ff/1d4ed8?text=Macarrao+Barilla+500g',
      },
      {
        product: seededProducts[5],
        slug: 'molho-tomate-quero-340g',
        displayName: 'Molho de Tomate Quero 340g',
        brandName: 'Quero',
        packageLabel: '340 g',
        imageUrl:
          'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[6],
        slug: 'banana-nanica-granel-1kg',
        displayName: 'Banana Nanica a granel 1kg',
        brandName: 'Hortifruti',
        packageLabel: '1 kg',
        imageUrl:
          'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[7],
        slug: 'ovos-brancos-granja-12un',
        displayName: 'Ovos Brancos Granja 12 unidades',
        brandName: 'Granja',
        packageLabel: '12 un',
        imageUrl:
          'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[8],
        slug: 'detergente-ype-neutro-500ml',
        displayName: 'Detergente Ype Neutro 500ml',
        brandName: 'Ype',
        packageLabel: '500 ml',
        imageUrl:
          'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[9],
        slug: 'papel-higienico-neve-12-rolos',
        displayName: 'Papel Higienico Neve 12 rolos',
        brandName: 'Neve',
        packageLabel: '12 rolos',
        imageUrl:
          'https://placehold.co/900x600/f8fafc/334155?text=Papel+Neve+12+rolos',
      },
      {
        product: seededProducts[9],
        slug: 'papel-higienico-mimmo-12-rolos',
        displayName: 'Papel Higienico Mimmo 12 rolos',
        brandName: 'Mimmo',
        packageLabel: '12 rolos',
        imageUrl:
          'https://placehold.co/900x600/f1f5f9/0f766e?text=Papel+Mimmo+12+rolos',
      },
    ].map((entry) =>
      prisma.productVariant.upsert({
        where: { slug: entry.slug },
        update: {
          displayName: entry.displayName,
          brandName: entry.brandName,
          packageLabel: entry.packageLabel,
          imageUrl: entry.imageUrl,
          isActive: true,
        },
        create: {
          catalogProductId: entry.product.id,
          slug: entry.slug,
          displayName: entry.displayName,
          brandName: entry.brandName,
          packageLabel: entry.packageLabel,
          imageUrl: entry.imageUrl,
          isActive: true,
        },
      }),
    ),
  );

  const aliasSeeds = [
    {
      product: catalogProduct,
      aliases: ['arroz 5kg', 'arroz tipo um 5kg', 'arroz branco 5 kg'],
    },
    {
      product: coffeeCatalogProduct,
      aliases: ['cafe 500g', 'cafe torrado moido', 'cafe tradicional'],
    },
    {
      product: seededProducts[0],
      aliases: ['feijao 1kg', 'feijao carioca', 'feijao carioquinha'],
    },
    {
      product: seededProducts[1],
      aliases: ['leite 1l', 'leite integral', 'leite caixa 1 litro'],
    },
    {
      product: seededProducts[2],
      aliases: ['acucar 1kg', 'acucar refinado', 'açucar uniao'],
    },
    {
      product: seededProducts[3],
      aliases: ['oleo 900ml', 'oleo soja', 'oleo de cozinha'],
    },
    {
      product: seededProducts[4],
      aliases: ['macarrao 500g', 'espaguete 500g', 'massa espaguete'],
    },
    {
      product: seededProducts[5],
      aliases: ['molho tomate', 'molho 340g', 'extrato tomate sache'],
    },
    {
      product: seededProducts[6],
      aliases: ['banana 1kg', 'banana nanica', 'banana kg'],
    },
    {
      product: seededProducts[7],
      aliases: ['ovos 12un', 'duzia ovos', 'ovos brancos'],
    },
    {
      product: seededProducts[8],
      aliases: ['detergente 500ml', 'detergente neutro', 'lava loucas'],
    },
    {
      product: seededProducts[9],
      aliases: ['papel higienico', 'papel 12 rolos', 'papel banheiro'],
    },
  ];

  await Promise.all(
    aliasSeeds.flatMap((entry) =>
      entry.aliases.map((alias) =>
        prisma.catalogProductAlias.upsert({
          where: {
            catalogProductId_alias: {
              catalogProductId: entry.product.id,
              alias,
            },
          },
          update: {
            sourceType: 'admin',
            confidenceScore: '0.95',
          },
          create: {
            catalogProductId: entry.product.id,
            alias,
            sourceType: 'admin',
            confidenceScore: '0.95',
          },
        }),
      ),
    ),
  );

  await prisma.productOffer.upsert({
    where: {
      id: '11111111-1111-1111-1111-111111111111',
    },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      catalogProductId: catalogProduct.id,
      productVariantId: productVariant.id,
      establishmentId: establishment.id,
      displayName: 'Arroz tipo 1 5kg',
      packageLabel: '5 kg',
      priceAmount: '22.90',
      basePriceAmount: '24.90',
      promotionalPriceAmount: '22.90',
      currencyCode: 'BRL',
      availabilityStatus: 'available',
      confidenceLevel: 'high',
      sourceType: 'admin',
      sourceReference: 'Seed local',
      observedAt: new Date(),
      isActive: true,
    },
  });

  await prisma.productOffer.upsert({
    where: {
      id: '44444444-4444-4444-4444-444444444444',
    },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      catalogProductId: catalogProduct.id,
      productVariantId: productVariant.id,
      establishmentId: comparisonEstablishment.id,
      displayName: 'Arroz Camil tipo 1 5kg',
      packageLabel: '5 kg',
      priceAmount: '21.90',
      basePriceAmount: '21.90',
      promotionalPriceAmount: null,
      currencyCode: 'BRL',
      availabilityStatus: 'available',
      confidenceLevel: 'high',
      sourceType: 'admin',
      sourceReference: 'Seed comparativo',
      observedAt: new Date(),
      isActive: true,
    },
  });

  await prisma.productOffer.upsert({
    where: {
      id: '33333333-3333-3333-3333-333333333333',
    },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      catalogProductId: coffeeCatalogProduct.id,
      productVariantId: coffeeVariant.id,
      establishmentId: establishment.id,
      displayName: 'Cafe Pilao 500g',
      packageLabel: '500 g',
      priceAmount: '15.90',
      basePriceAmount: '18.90',
      promotionalPriceAmount: '15.90',
      currencyCode: 'BRL',
      availabilityStatus: 'available',
      confidenceLevel: 'high',
      sourceType: 'admin',
      sourceReference: 'Seed local',
      observedAt: new Date(),
      isActive: true,
    },
  });

  const offerSeeds = [
    {
      id: '55555555-5555-4555-8555-555555555555',
      product: catalogProduct,
      variant: productVariant,
      establishment: extraEstablishments[0],
      priceAmount: '20.90',
      basePriceAmount: '23.90',
      promotionalPriceAmount: '20.90',
      confidenceLevel: 'medium',
      sourceReference: 'Seed atacado',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: '66666666-6666-4666-8666-666666666666',
      product: coffeeCatalogProduct,
      variant: coffeeVariant,
      establishment: comparisonEstablishment,
      priceAmount: '16.40',
      basePriceAmount: '16.40',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: '77777777-7777-4777-8777-777777777777',
      product: seededProducts[0],
      variant: seededVariants[0],
      establishment,
      priceAmount: '8.49',
      basePriceAmount: '9.29',
      promotionalPriceAmount: '8.49',
      confidenceLevel: 'high',
      sourceReference: 'Seed local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: '88888888-8888-4888-8888-888888888888',
      product: seededProducts[0],
      variant: seededVariants[0],
      establishment: comparisonEstablishment,
      priceAmount: '8.99',
      basePriceAmount: '8.99',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      id: '99999999-9999-4999-8999-999999999999',
      product: seededProducts[0],
      variant: seededVariants[1],
      establishment: extraEstablishments[0],
      priceAmount: '7.99',
      basePriceAmount: '8.79',
      promotionalPriceAmount: '7.99',
      confidenceLevel: 'low',
      sourceReference: 'Seed baixa confianca',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
    },
    {
      id: 'aaaaaaaa-1111-4111-8111-aaaaaaaa1111',
      product: seededProducts[1],
      variant: seededVariants[2],
      establishment,
      priceAmount: '5.29',
      basePriceAmount: '5.99',
      promotionalPriceAmount: '5.29',
      confidenceLevel: 'high',
      sourceReference: 'Seed local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
      id: 'bbbbbbbb-2222-4222-8222-bbbbbbbb2222',
      product: seededProducts[1],
      variant: seededVariants[2],
      establishment: comparisonEstablishment,
      priceAmount: '5.49',
      basePriceAmount: '5.49',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: 'cccccccc-3333-4333-8333-cccccccc3333',
      product: seededProducts[2],
      variant: seededVariants[3],
      establishment: extraEstablishments[0],
      priceAmount: '4.19',
      basePriceAmount: '4.79',
      promotionalPriceAmount: '4.19',
      confidenceLevel: 'high',
      sourceReference: 'Seed atacado',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: 'dddddddd-4444-4444-8444-dddddddd4444',
      product: seededProducts[3],
      variant: seededVariants[4],
      establishment: extraEstablishments[1],
      priceAmount: '6.99',
      basePriceAmount: '7.99',
      promotionalPriceAmount: '6.99',
      confidenceLevel: 'high',
      sourceReference: 'Seed Rio',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: 'eeeeeeee-5555-4555-8555-eeeeeeee5555',
      product: seededProducts[3],
      variant: seededVariants[4],
      establishment: extraEstablishments[2],
      priceAmount: '7.39',
      basePriceAmount: '7.39',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed Rio comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
    {
      id: 'f1111111-1111-4111-8111-111111111111',
      product: catalogProduct,
      variant: seededVariants[5],
      establishment,
      priceAmount: '23.49',
      basePriceAmount: '23.49',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed variante arroz',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: 'f2222222-2222-4222-8222-222222222222',
      product: catalogProduct,
      variant: seededVariants[5],
      establishment: comparisonEstablishment,
      priceAmount: '22.79',
      basePriceAmount: '24.29',
      promotionalPriceAmount: '22.79',
      confidenceLevel: 'high',
      sourceReference: 'Seed variante arroz comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 14),
    },
    {
      id: 'f3333333-3333-4333-8333-333333333333',
      product: coffeeCatalogProduct,
      variant: seededVariants[6],
      establishment: extraEstablishments[0],
      priceAmount: '14.99',
      basePriceAmount: '17.49',
      promotionalPriceAmount: '14.99',
      confidenceLevel: 'high',
      sourceReference: 'Seed cafe atacado',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
    },
    {
      id: 'f4444444-4444-4444-8444-444444444444',
      product: coffeeCatalogProduct,
      variant: seededVariants[6],
      establishment,
      priceAmount: '16.19',
      basePriceAmount: '16.19',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed cafe comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: 'f5555555-5555-4555-8555-555555555555',
      product: seededProducts[4],
      variant: seededVariants[7],
      establishment,
      priceAmount: '4.79',
      basePriceAmount: '5.29',
      promotionalPriceAmount: '4.79',
      confidenceLevel: 'high',
      sourceReference: 'Seed massa local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    },
    {
      id: 'f6666666-6666-4666-8666-666666666666',
      product: seededProducts[4],
      variant: seededVariants[7],
      establishment: comparisonEstablishment,
      priceAmount: '5.19',
      basePriceAmount: '5.19',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed massa comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: 'f7777777-7777-4777-8777-777777777777',
      product: seededProducts[4],
      variant: seededVariants[8],
      establishment: extraEstablishments[0],
      priceAmount: '7.49',
      basePriceAmount: '8.49',
      promotionalPriceAmount: '7.49',
      confidenceLevel: 'medium',
      sourceReference: 'Seed massa premium',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      id: 'f8888888-8888-4888-8888-888888888888',
      product: seededProducts[5],
      variant: seededVariants[9],
      establishment,
      priceAmount: '2.99',
      basePriceAmount: '3.49',
      promotionalPriceAmount: '2.99',
      confidenceLevel: 'high',
      sourceReference: 'Seed molho local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
    },
    {
      id: 'f9999999-9999-4999-8999-999999999999',
      product: seededProducts[5],
      variant: seededVariants[9],
      establishment: comparisonEstablishment,
      priceAmount: '3.19',
      basePriceAmount: '3.19',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed molho comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: 'fa111111-1111-4111-8111-111111111111',
      product: seededProducts[6],
      variant: seededVariants[10],
      establishment,
      priceAmount: '4.99',
      basePriceAmount: '5.99',
      promotionalPriceAmount: '4.99',
      confidenceLevel: 'high',
      sourceReference: 'Seed hortifruti local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    },
    {
      id: 'fa222222-2222-4222-8222-222222222222',
      product: seededProducts[6],
      variant: seededVariants[10],
      establishment: comparisonEstablishment,
      priceAmount: '5.39',
      basePriceAmount: '5.39',
      promotionalPriceAmount: null,
      confidenceLevel: 'high',
      sourceReference: 'Seed hortifruti comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
      id: 'fa333333-3333-4333-8333-333333333333',
      product: seededProducts[6],
      variant: seededVariants[10],
      establishment: extraEstablishments[0],
      priceAmount: '4.59',
      basePriceAmount: '5.29',
      promotionalPriceAmount: '4.59',
      confidenceLevel: 'medium',
      sourceReference: 'Seed hortifruti atacado',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: 'fa444444-4444-4444-8444-444444444444',
      product: seededProducts[7],
      variant: seededVariants[11],
      establishment,
      priceAmount: '10.99',
      basePriceAmount: '12.49',
      promotionalPriceAmount: '10.99',
      confidenceLevel: 'high',
      sourceReference: 'Seed ovos local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 11),
    },
    {
      id: 'fa555555-5555-4555-8555-555555555555',
      product: seededProducts[7],
      variant: seededVariants[11],
      establishment: comparisonEstablishment,
      priceAmount: '11.89',
      basePriceAmount: '11.89',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed ovos comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: 'fa666666-6666-4666-8666-666666666666',
      product: seededProducts[8],
      variant: seededVariants[12],
      establishment,
      priceAmount: '2.39',
      basePriceAmount: '2.79',
      promotionalPriceAmount: '2.39',
      confidenceLevel: 'high',
      sourceReference: 'Seed limpeza local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
      id: 'fa777777-7777-4777-8777-777777777777',
      product: seededProducts[8],
      variant: seededVariants[12],
      establishment: comparisonEstablishment,
      priceAmount: '2.59',
      basePriceAmount: '2.59',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed limpeza comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: 'fa888888-8888-4888-8888-888888888888',
      product: seededProducts[9],
      variant: seededVariants[13],
      establishment,
      priceAmount: '18.90',
      basePriceAmount: '21.90',
      promotionalPriceAmount: '18.90',
      confidenceLevel: 'high',
      sourceReference: 'Seed higiene local',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 16),
    },
    {
      id: 'fa999999-9999-4999-8999-999999999999',
      product: seededProducts[9],
      variant: seededVariants[13],
      establishment: comparisonEstablishment,
      priceAmount: '19.90',
      basePriceAmount: '19.90',
      promotionalPriceAmount: null,
      confidenceLevel: 'medium',
      sourceReference: 'Seed higiene comparativo',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      id: 'fb111111-1111-4111-8111-111111111111',
      product: seededProducts[9],
      variant: seededVariants[14],
      establishment: extraEstablishments[0],
      priceAmount: '16.90',
      basePriceAmount: '18.90',
      promotionalPriceAmount: '16.90',
      confidenceLevel: 'low',
      sourceReference: 'Seed higiene baixa confianca',
      observedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
    },
  ];

  await Promise.all(
    offerSeeds.map((offer) =>
      prisma.productOffer.upsert({
        where: { id: offer.id },
        update: {
          catalogProductId: offer.product.id,
          productVariantId: offer.variant.id,
          establishmentId: offer.establishment.id,
          displayName: offer.variant.displayName,
          packageLabel:
            offer.variant.packageLabel ?? offer.product.defaultUnit ?? 'un',
          priceAmount: offer.priceAmount,
          basePriceAmount: offer.basePriceAmount,
          promotionalPriceAmount: offer.promotionalPriceAmount,
          availabilityStatus: 'available',
          confidenceLevel: offer.confidenceLevel,
          sourceType: 'admin',
          sourceReference: offer.sourceReference,
          observedAt: offer.observedAt,
          isActive: true,
        },
        create: {
          id: offer.id,
          catalogProductId: offer.product.id,
          productVariantId: offer.variant.id,
          establishmentId: offer.establishment.id,
          displayName: offer.variant.displayName,
          packageLabel:
            offer.variant.packageLabel ?? offer.product.defaultUnit ?? 'un',
          priceAmount: offer.priceAmount,
          basePriceAmount: offer.basePriceAmount,
          promotionalPriceAmount: offer.promotionalPriceAmount,
          currencyCode: 'BRL',
          availabilityStatus: 'available',
          confidenceLevel: offer.confidenceLevel,
          sourceType: 'admin',
          sourceReference: offer.sourceReference,
          observedAt: offer.observedAt,
          isActive: true,
        },
      }),
    ),
  );

  await prisma.shoppingList.upsert({
    where: {
      id: '22222222-2222-2222-2222-222222222222',
    },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      userId: customer.id,
      name: 'Compra da semana',
      preferredRegionId: region.id,
      status: 'draft',
    },
  });

  const receiptSeeds = [
    {
      job: {
        id: '12121212-1212-4121-8121-121212121212',
        queueName: 'receipt-processing',
        jobType: 'receipt_processing',
        status: 'completed',
        attemptCount: 1,
        finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      receipt: {
        id: '13131313-1313-4131-8131-131313131313',
        sourceType: 'qr_code_url',
        parseStatus: 'parsed',
        storeName: establishment.unitName,
        storeCnpj: establishment.cnpj,
        accessKey: '35260500000000000100550010000000011000000011',
        sefazUrl: 'https://sefaz.example/accepted',
        purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 7),
        rawReference: 'NFCe seed aceita',
        confidenceScore: '0.96',
        duplicateKey: 'seed-accepted-receipt',
        trustLevel: 'trusted',
        moderationStatus: 'accepted',
        rewardEligibilityStatus: 'granted',
        reviewReason: 'receipt_reward_granted',
        establishmentId: establishment.id,
      },
      lineItems: [
        {
          id: '14141414-1414-4141-8141-141414141414',
          ean: '7891000100103',
          rawProductName: 'CAFE PILAO 500G',
          normalizedName: 'cafe pilao 500g',
          packageSize: '500 g',
          quantity: '1.000',
          unitPrice: '15.90',
          originalUnitPrice: '18.90',
          promotionalUnitPrice: '15.90',
          lineTotal: '15.90',
          matchConfidence: '0.94',
          linkedOfferId: '33333333-3333-3333-3333-333333333333',
        },
      ],
    },
    {
      job: {
        id: '15151515-1515-4151-8151-151515151515',
        queueName: 'receipt-processing',
        jobType: 'receipt_processing',
        status: 'retrying',
        attemptCount: 2,
        failureReason: 'ocr_low_confidence',
      },
      receipt: {
        id: '16161616-1616-4161-8161-161616161616',
        sourceType: 'image_parse',
        parseStatus: 'partial',
        storeName: comparisonEstablishment.unitName,
        storeCnpj: comparisonEstablishment.cnpj,
        purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        rawReference: 'Imagem parcial seed',
        confidenceScore: '0.58',
        duplicateKey: 'seed-quarantined-receipt',
        trustLevel: 'pending_review',
        moderationStatus: 'quarantined',
        rewardEligibilityStatus: 'disabled',
        reviewReason: 'ocr_low_confidence',
        establishmentId: comparisonEstablishment.id,
      },
      lineItems: [
        {
          id: '17171717-1717-4171-8171-171717171717',
          ean: null,
          rawProductName: 'ARROZ CAMIL TP1 5KG',
          normalizedName: 'arroz camil tipo 1 5kg',
          packageSize: '5 kg',
          quantity: '1.000',
          unitPrice: '21.90',
          originalUnitPrice: '21.90',
          promotionalUnitPrice: null,
          lineTotal: '21.90',
          matchConfidence: '0.61',
        },
      ],
    },
    {
      job: {
        id: '18181818-1818-4181-8181-181818181818',
        queueName: 'receipt-processing',
        jobType: 'receipt_processing',
        status: 'completed',
        attemptCount: 1,
        finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      },
      receipt: {
        id: '19191919-1919-4191-8191-191919191919',
        sourceType: 'qr_code_url',
        parseStatus: 'parsed',
        storeName: establishment.unitName,
        storeCnpj: establishment.cnpj,
        accessKey: '35260500000000000100550010000000011000000011-DUP',
        purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        rawReference: 'NFCe duplicada seed',
        confidenceScore: '0.91',
        duplicateKey: 'seed-accepted-receipt',
        trustLevel: 'rejected',
        moderationStatus: 'duplicate',
        rewardEligibilityStatus: 'ineligible',
        reviewReason: 'duplicate_receipt',
        establishmentId: establishment.id,
      },
      lineItems: [
        {
          id: '20202020-2020-4020-8020-202020202020',
          ean: '7891000100103',
          rawProductName: 'CAFE PILAO 500G',
          normalizedName: 'cafe pilao 500g',
          packageSize: '500 g',
          quantity: '1.000',
          unitPrice: '15.90',
          originalUnitPrice: '18.90',
          promotionalUnitPrice: '15.90',
          lineTotal: '15.90',
          matchConfidence: '0.92',
        },
      ],
    },
    {
      job: {
        id: '21212121-2121-4121-8121-212121212121',
        queueName: 'receipt-processing',
        jobType: 'receipt_processing',
        status: 'failed',
        attemptCount: 3,
        failureReason: 'invalid_receipt_payload',
        finishedAt: new Date(Date.now() - 1000 * 60 * 40),
      },
      receipt: {
        id: '23232323-2323-4232-8232-232323232323',
        sourceType: 'pdf_upload',
        parseStatus: 'failed',
        storeName: null,
        storeCnpj: null,
        purchaseDate: null,
        rawReference: 'PDF invalido seed',
        confidenceScore: '0.12',
        duplicateKey: 'seed-rejected-receipt',
        trustLevel: 'rejected',
        moderationStatus: 'rejected',
        rewardEligibilityStatus: 'ineligible',
        reviewReason: 'invalid_receipt_payload',
        establishmentId: null,
      },
      lineItems: [],
    },
    {
      job: {
        id: '24242424-2424-4242-8242-242424242424',
        queueName: 'receipt-processing',
        jobType: 'receipt_processing',
        status: 'queued',
        attemptCount: 0,
      },
      receipt: {
        id: '25252525-2525-4252-8252-252525252525',
        sourceType: 'manual_entry',
        parseStatus: 'queued',
        storeName: extraEstablishments[1].unitName,
        storeCnpj: extraEstablishments[1].cnpj,
        purchaseDate: new Date(Date.now() - 1000 * 60 * 20),
        rawReference: 'Entrada manual aguardando processamento',
        confidenceScore: '0.40',
        duplicateKey: 'seed-pending-receipt',
        trustLevel: 'untrusted',
        moderationStatus: 'pending',
        rewardEligibilityStatus: 'disabled',
        reviewReason: 'awaiting_processing',
        establishmentId: extraEstablishments[1].id,
      },
      lineItems: [],
    },
  ];

  for (const seed of receiptSeeds) {
    await prisma.processingJob.upsert({
      where: { id: seed.job.id },
      update: {
        queueName: seed.job.queueName,
        jobType: seed.job.jobType,
        resourceType: 'receipt',
        resourceId: seed.receipt.id,
        status: seed.job.status,
        attemptCount: seed.job.attemptCount,
        failureReason: seed.job.failureReason ?? null,
        finishedAt: seed.job.finishedAt ?? null,
      },
      create: {
        id: seed.job.id,
        queueName: seed.job.queueName,
        jobType: seed.job.jobType,
        resourceType: 'receipt',
        resourceId: seed.receipt.id,
        status: seed.job.status,
        attemptCount: seed.job.attemptCount,
        failureReason: seed.job.failureReason ?? null,
        finishedAt: seed.job.finishedAt ?? null,
      },
    });

    await prisma.receiptRecord.upsert({
      where: { id: seed.receipt.id },
      update: {
        userId: customer.id,
        establishmentId: seed.receipt.establishmentId,
        sourceType: seed.receipt.sourceType,
        parseStatus: seed.receipt.parseStatus,
        storeName: seed.receipt.storeName,
        storeCnpj: seed.receipt.storeCnpj,
        accessKey: seed.receipt.accessKey ?? null,
        sefazUrl: seed.receipt.sefazUrl ?? null,
        purchaseDate: seed.receipt.purchaseDate,
        jobId: seed.job.id,
        rawReference: seed.receipt.rawReference,
        confidenceScore: seed.receipt.confidenceScore,
        duplicateKey: seed.receipt.duplicateKey,
        trustLevel: seed.receipt.trustLevel,
        moderationStatus: seed.receipt.moderationStatus,
        rewardEligibilityStatus: seed.receipt.rewardEligibilityStatus,
        reviewReason: seed.receipt.reviewReason,
      },
      create: {
        id: seed.receipt.id,
        userId: customer.id,
        establishmentId: seed.receipt.establishmentId,
        sourceType: seed.receipt.sourceType,
        parseStatus: seed.receipt.parseStatus,
        storeName: seed.receipt.storeName,
        storeCnpj: seed.receipt.storeCnpj,
        accessKey: seed.receipt.accessKey ?? null,
        sefazUrl: seed.receipt.sefazUrl ?? null,
        purchaseDate: seed.receipt.purchaseDate,
        jobId: seed.job.id,
        rawReference: seed.receipt.rawReference,
        confidenceScore: seed.receipt.confidenceScore,
        duplicateKey: seed.receipt.duplicateKey,
        trustLevel: seed.receipt.trustLevel,
        moderationStatus: seed.receipt.moderationStatus,
        rewardEligibilityStatus: seed.receipt.rewardEligibilityStatus,
        reviewReason: seed.receipt.reviewReason,
      },
    });

    for (const item of seed.lineItems) {
      await prisma.receiptLineItem.upsert({
        where: { id: item.id },
        update: {
          receiptRecordId: seed.receipt.id,
          ean: item.ean,
          rawProductName: item.rawProductName,
          normalizedName: item.normalizedName,
          packageSize: item.packageSize,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originalUnitPrice: item.originalUnitPrice,
          promotionalUnitPrice: item.promotionalUnitPrice,
          lineTotal: item.lineTotal,
          matchConfidence: item.matchConfidence,
        },
        create: {
          id: item.id,
          receiptRecordId: seed.receipt.id,
          ean: item.ean,
          rawProductName: item.rawProductName,
          normalizedName: item.normalizedName,
          packageSize: item.packageSize,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          originalUnitPrice: item.originalUnitPrice,
          promotionalUnitPrice: item.promotionalUnitPrice,
          lineTotal: item.lineTotal,
          matchConfidence: item.matchConfidence,
        },
      });

      if (item.linkedOfferId) {
        await prisma.productOffer.update({
          where: { id: item.linkedOfferId },
          data: {
            sourceType: 'receipt',
            sourceReference: seed.receipt.rawReference,
            receiptRecordId: seed.receipt.id,
            receiptLineItemId: item.id,
            confidenceLevel: 'high',
            observedAt: seed.receipt.purchaseDate ?? new Date(),
          },
        });
      }
    }
  }

  console.log(
    JSON.stringify({
      adminEmail: admin.email,
      customerEmail: customer.email,
      region: region.slug,
      establishment: establishment.unitName,
      comparisonEstablishment: comparisonEstablishment.unitName,
      product: catalogProduct.slug,
      variant: productVariant.slug,
      publicOfferProduct: coffeeCatalogProduct.slug,
      publicOfferVariant: coffeeVariant.slug,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
