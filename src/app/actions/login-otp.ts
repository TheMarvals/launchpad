'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendSecurityOtpEmail } from '@/lib/email';
import { generateAndSaveOtp } from '@/lib/otp';

export async function startLoginVerification(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      // Return a generic error to prevent email enumeration
      return { error: 'Credenciales inválidas' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { error: 'Credenciales inválidas' };
    }

    // Generate and save OTP
    const code = await generateAndSaveOtp(user.id, 'LOGIN');

    // Send the unified email
    await sendSecurityOtpEmail(
      user.email,
      code,
      user.name,
      "Código de Acceso",
      "Se ha detectado un intento de inicio de sesión en tu cuenta. Usa el siguiente código para completar el proceso:"
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error in startLoginVerification:', error);
    return { error: 'Error del servidor, por favor intenta de nuevo.' };
  }
}
