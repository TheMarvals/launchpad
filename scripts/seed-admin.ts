/**
 * Script para crear el usuario administrador en la base de datos de producción.
 * Uso: DATABASE_URL="postgresql://..." npx ts-node scripts/seed-admin.ts
 * O simplemente ajusta la variable DATABASE_URL en tu .env y corre:
 *   npx ts-node scripts/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@themarvals.com';
  const adminPassword = 'MarvalAdmin2026!'; // ← CAMBIA ESTO DESPUÉS DE CREAR EL USUARIO
  const adminName = 'Admin LAUNCHPAD';

  // Verificar si ya existe
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`✅ El usuario ${adminEmail} ya existe. Nada que hacer.`);
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuario administrador creado exitosamente:');
  console.log(`   📧 Email:    ${user.email}`);
  console.log(`   👤 Nombre:   ${user.name}`);
  console.log(`   🔑 Password: ${adminPassword}`);
  console.log(`   🛡️  Rol:      ${user.role}`);
  console.log('');
  console.log('⚠️  IMPORTANTE: Cambia la contraseña desde el panel después de ingresar.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
