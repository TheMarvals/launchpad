const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const server = await prisma.vpsService.findFirst({
    where: { name: 'MySalonHub' }
  });
  if (server.providerId) {
     const token = process.env.PROVIDER_API_TOKEN;
     const res = await fetch(`https://panel.servercheap.com/api/v1/servers/${server.providerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
     });
     const data = await res.json();
     console.log(JSON.stringify(data, null, 2));
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
