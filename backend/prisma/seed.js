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
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
    },
    create: {
      catalogProductId: catalogProduct.id,
      slug: 'arroz-tipo-1-5kg-seed-5kg',
      displayName: 'Arroz Camil tipo 1 5kg',
      brandName: 'Camil',
      packageLabel: '5 kg',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
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
          'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=900&q=80',
      },
      {
        product: seededProducts[0],
        slug: 'feijao-carioca-camil-1kg',
        displayName: 'Feijao Carioca Camil 1kg',
        brandName: 'Camil',
        packageLabel: '1 kg',
        imageUrl:
          'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=900&q=80',
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
          packageLabel: offer.variant.packageLabel ?? offer.product.defaultUnit ?? 'un',
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
          packageLabel: offer.variant.packageLabel ?? offer.product.defaultUnit ?? 'un',
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
