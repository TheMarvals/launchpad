const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const partners = await prisma.partner.findMany();
  console.log(partners.map(p => p.logoUrl));
  await prisma.$disconnect();
}
run();
