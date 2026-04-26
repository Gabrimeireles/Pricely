const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.userAccount.upsert({
    where: { email: 'admin@pricely.local' },
    update: {},
    create: {
      email: 'admin@pricely.local',
      passwordHash: 'seed-admin-password-hash',
      displayName: 'Admin Pricely',
      role: 'admin',
    },
  });

  const customer = await prisma.userAccount.upsert({
    where: { email: 'customer@pricely.local' },
    update: {},
    create: {
      email: 'customer@pricely.local',
      passwordHash: 'seed-customer-password-hash',
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

  const product = await prisma.product.upsert({
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

  await prisma.productOffer.upsert({
    where: {
      id: '11111111-1111-1111-1111-111111111111',
    },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      productId: product.id,
      establishmentId: establishment.id,
      displayName: 'Arroz tipo 1 5kg',
      packageLabel: '5 kg',
      priceAmount: '22.90',
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
      product: product.slug,
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
