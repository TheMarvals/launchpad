'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendLoginOtpEmail } from '@/lib/email';
import crypto from 'crypto';

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

    // Generate a 6 digit OTP code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate previous LOGIN OTPs for this user
    await prisma.otpCode.updateMany({
      where: {
        userId: user.id,
        action: 'LOGIN',
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Save the new OTP
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        code,
        expiresAt,
      },
    });

    // Send the email
    await sendLoginOtpEmail(user.email, code, user.name);

    return { success: true };
  } catch (error: any) {
    console.error('Error in startLoginVerification:', error);
    return { error: 'Error del servidor, por favor intenta de nuevo.' };
  }
}
