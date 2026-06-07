import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const partners = [
  { name: 'TechCorp', logoUrl: 'https://res.cloudinary.com/demo/logo-techcorp.png', websiteUrl: 'https://techcorp.example.com', order: 0 },
  { name: 'InnovateLab', logoUrl: 'https://res.cloudinary.com/demo/logo-innovatelab.png', websiteUrl: 'https://innovatelab.example.com', order: 1 },
  { name: 'CloudNative', logoUrl: 'https://res.cloudinary.com/demo/logo-cloudnative.png', websiteUrl: 'https://cloudnative.example.com', order: 2 },
  { name: 'DataFlow', logoUrl: 'https://res.cloudinary.com/demo/logo-dataflow.png', websiteUrl: 'https://dataflow.example.com', order: 3 },
  { name: 'SecureNet', logoUrl: 'https://res.cloudinary.com/demo/logo-securenet.png', websiteUrl: 'https://securenet.example.com', order: 4 },
  { name: 'AlphaDigital', logoUrl: 'https://res.cloudinary.com/demo/logo-alphadigital.png', websiteUrl: 'https://alphadigital.example.com', order: 5 },
];

async function main() {
  console.log('🌱 Seeding partners...\n');

  for (const partner of partners) {
    const existing = await prisma.partner.findFirst({ where: { name: partner.name } });
    if (existing) {
      console.log(`⚠️  Partner "${partner.name}" already exists. Skipping...`);
      continue;
    }

    await prisma.partner.create({ data: partner });
    console.log(`✅ Partner created: ${partner.name}`);
  }

  const count = await prisma.partner.count();
  console.log(`\n📊 Total partners: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
