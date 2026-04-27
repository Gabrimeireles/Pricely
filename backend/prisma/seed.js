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

  const establishment = await prisma.establishment.upsert({
    where: { cnpj: '12.345.678/0001-99' },
    update: {},
    create: {
      brandName: 'Mercado Exemplo',
      unitName: 'Unidade Pinheiros',
      cnpj: '12.345.678/0001-99',
      cityName: 'São Paulo',
      neighborhood: 'Pinheiros',
      regionId: region.id,
      isActive: true,
    },
  });

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
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    },
  });

  const productVariant = await prisma.productVariant.upsert({
    where: { slug: 'arroz-tipo-1-5kg-seed-5kg' },
    update: {},
    create: {
      catalogProductId: catalogProduct.id,
      slug: 'arroz-tipo-1-5kg-seed-5kg',
      displayName: 'Arroz tipo 1 5kg',
      packageLabel: '5 kg',
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
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    },
  });

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
      currencyCode: 'BRL',
      availabilityStatus: 'available',
      confidenceLevel: 'high',
      sourceType: 'admin',
      sourceReference: 'Seed local',
      observedAt: new Date(),
      isActive: true,
    },
  });

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
