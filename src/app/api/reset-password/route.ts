import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Endpoint ONE-TIME para resetear la contraseña de un usuario.
 * Protegido por AUTH_SECRET.
 * Uso: GET /api/reset-password?token=AUTH_SECRET&email=user@email.com&password=NuevaPassword
 * ELIMINAR después de usar.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const password = searchParams.get('password');

  if (!token || token !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'email y password son requeridos' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: `Usuario ${email} no encontrado` }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: `✅ Contraseña actualizada para ${email}. Ya puedes hacer login.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
