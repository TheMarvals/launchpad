import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function generateAndSaveOtp(userId: string, action: string, serverId?: string) {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await prisma.otpCode.updateMany({
    where: {
      userId,
      action,
      ...(serverId ? { serverId } : {}),
      used: false,
    },
    data: { used: true },
  });

  await prisma.otpCode.create({
    data: {
      userId,
      action,
      code,
      expiresAt,
      ...(serverId ? { serverId } : {}),
    },
  });

  return code;
}

export async function verifyAndConsumeOtp(userId: string, action: string, code: string, serverId?: string) {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId,
      action,
      code,
      used: false,
      ...(serverId ? { serverId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return { isValid: false, error: 'Código inválido o ya ha sido utilizado.' };
  }

  if (new Date() > otpRecord.expiresAt) {
    return { isValid: false, error: 'El código ha expirado. Solicita uno nuevo.' };
  }

  // Marcar como usado
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return { isValid: true };
}
