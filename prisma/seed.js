const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@themarvals.com';
  
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`⚠️  Usuario "${email}" ya existe. Saltando...`);
    return;
  }

  const hashedPassword = await bcrypt.hash('Marval2026!', 12);

  const user = await prisma.user.create({
    data: {
      name: 'Eduardo Marval',
      email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin creado: ${user.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
