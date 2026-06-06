'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendSecurityOtpEmail } from '@/lib/email';
import { generateAndSaveOtp } from '@/lib/otp';
import { checkRateLimit, recordAttempt, generateGateToken, verifyGateToken } from '@/lib/gate';

export async function checkAccessEmail(email: string) {
  try {
    // Check rate limit
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      return { exists: false, error: 'RATE_LIMITED' };
    }

    // Record this attempt
    recordAttempt(email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      // Generate a short-lived gate token for secure redirect
      const token = generateGateToken(email);
      return { exists: true, token };
    }

    return { exists: false };
  } catch (error: any) {
    console.error('Error in checkAccessEmail:', error);
    return { exists: false, error: 'SERVER_ERROR' };
  }
}

export async function verifyGateTokenAction(token: string) {
  const email = verifyGateToken(token);
  if (!email) return { error: 'INVALID_TOKEN' };
  return { email };
}

export async function startLoginVerification(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return { error: 'INVALID_CREDENTIALS' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { error: 'INVALID_CREDENTIALS' };
    }

    // Generate and save OTP
    const code = await generateAndSaveOtp(user.id, 'LOGIN');

    // Detect user locale from next-intl cookie
    const cookieStore = await cookies();
    const userLocale = cookieStore.get('NEXT_LOCALE')?.value || 'es';

    // Send the unified email
    const title = userLocale === 'en' ? 'Access Code' : 'Código de Acceso';
    const description = userLocale === 'en'
      ? 'A login attempt has been detected on your account. Use the following code to complete the process:'
      : 'Se ha detectado un intento de inicio de sesión en tu cuenta. Usa el siguiente código para completar el proceso:';

    await sendSecurityOtpEmail(
      user.email,
      code,
      user.name,
      title,
      description,
      userLocale
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error in startLoginVerification:', error);
    return { error: 'SERVER_ERROR' };
  }
}
