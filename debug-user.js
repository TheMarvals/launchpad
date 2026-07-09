const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { settings: true } });
  for (const user of users) {
    console.log(`User: ${user.email}, Timezone: ${user.settings?.timezone}`);
  }
}
main().finally(() => prisma.$disconnect());
