import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Endpoint de inicialización ONE-TIME para crear el usuario admin.
 * Protegido por el AUTH_SECRET como token de autorización.
 * 
 * Uso: GET /api/setup?token=TU_AUTH_SECRET&email=admin@email.com&password=TuPassword
 * 
 * ELIMINAR este archivo después del primer uso por seguridad.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email') || 'admin@themarvals.com';
  const password = searchParams.get('password') || 'MarvalAdmin2026!';
  const name = searchParams.get('name') || 'Admin MARVAL';

  // Verificar token de seguridad
  if (!token || token !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Ya existe un administrador.',
        email: existingAdmin.email,
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: `El email ${email} ya está en uso.` }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '✅ Usuario administrador creado exitosamente.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
