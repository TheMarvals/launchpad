/**
 * Script para crear o actualizar el usuario administrador.
 * Uso: npx tsx scripts/seed-admin.ts
 *
 * Lee DATABASE_URL del .env actual.
 * Si el admin ya existe, le asigna permisos completos.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const ALL_PERMISSIONS = [
  'dashboard', 'quotes', 'invoices', 'clients', 'showcase', 'products',
  'tickets', 'logs', 'contacts', 'settings',
  'projects', 'tasks', 'notes', 'calendar', 'reminders',
];

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@themarvals.com';
  const adminPassword = 'MarvalAdmin2026!';
  const adminName = 'Admin LAUNCHPAD';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    // Update existing admin with full permissions
    const user = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: adminName,
        role: 'ADMIN',
        isActive: true,
        permissions: ALL_PERMISSIONS,
      },
    });

    console.log('✅ Administrador actualizado con permisos completos:');
    console.log(`   📧 Email:        ${user.email}`);
    console.log(`   👤 Nombre:       ${user.name}`);
    console.log(`   🛡️  Rol:          ${user.role}`);
    console.log(`   🔑 Permisos:     ${user.permissions.length} permisos asignados`);
    console.log(`   ✅ Activo:       ${user.isActive ? 'Sí' : 'No'}`);
    return;
  }

  // Create new admin
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      permissions: ALL_PERMISSIONS,
    },
  });

  console.log('✅ Administrador creado exitosamente:');
  console.log(`   📧 Email:        ${user.email}`);
  console.log(`   👤 Nombre:       ${user.name}`);
  console.log(`   🔑 Contraseña:   ${adminPassword}`);
  console.log(`   🛡️  Rol:          ${user.role}`);
  console.log(`   🔑 Permisos:     ${user.permissions.length} permisos asignados`);
  console.log('');
  console.log('⚠️  Cambia la contraseña desde el panel Settings > Team después de ingresar.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
