import { prisma } from '@/lib/prisma';
async function test() {
  const partners = await prisma.partner.findMany();
  console.log(partners.map(p => p.logoUrl));
}
test();
