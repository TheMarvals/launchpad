'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendEmailReply } from '@/lib/email-replies';
import { findActiveSenderIdentity } from '@/lib/email-sender-identities';
import { syncOutboundEmailDeliveryStatus } from '@/lib/email-delivery-status';

export async function getEmails() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Verify permission
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true }
  });

  if (!dbUser?.permissions?.includes('emails')) {
    throw new Error('Forbidden');
  }

  const emails = await prisma.emailMessage.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return emails;
}

export async function getActiveEmailSenderIdentities() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true, isActive: true },
  });

  if (!dbUser?.isActive || dbUser.role !== 'ADMIN' || !dbUser.permissions.includes('emails')) {
    throw new Error('Forbidden');
  }

  return prisma.emailSenderIdentity.findMany({
    where: { isActive: true },
    orderBy: { email: 'asc' },
  });
}

export async function getEmailById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true, isActive: true },
  });

  if (!dbUser?.isActive || dbUser.role !== 'ADMIN' || !dbUser.permissions.includes('emails')) {
    throw new Error('Forbidden');
  }

  const email = await prisma.emailMessage.findUnique({
    where: { id },
    include: {
      attachments: {
        orderBy: { createdAt: 'asc' },
      },
      senderIdentity: true,
    },
  });

  if (!email) throw new Error('Email not found');

  const syncedDelivery = email.direction === 'OUTBOUND'
    ? await syncOutboundEmailDeliveryStatus(email)
    : {
        deliveryStatus: email.deliveryStatus,
        deliveryUpdatedAt: email.deliveryUpdatedAt,
      };

  // Mark as read if INBOUND and UNREAD
  if (email.direction === 'INBOUND' && email.status === 'UNREAD') {
    await prisma.emailMessage.update({
      where: { id },
      data: { status: 'READ' }
    });
  }

  const allActiveIdentities = await prisma.emailSenderIdentity.findMany({
    where: { isActive: true },
    orderBy: { email: 'asc' },
  });

  const matchingIdentity = email.direction === 'INBOUND'
    ? await findActiveSenderIdentity(email.to)
    : (email.senderIdentityId ? allActiveIdentities.find(i => i.id === email.senderIdentityId) : null);

  const replySenderIdentity = matchingIdentity || allActiveIdentities[0] || null;

  return {
    ...email,
    ...syncedDelivery,
    replySenderIdentity,
    activeSenderIdentities: allActiveIdentities,
  };
}

export async function replyToEmail(originalEmailId: string, replyBody: string, senderIdentityId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true, isActive: true },
  });

  if (!dbUser?.isActive || dbUser.role !== 'ADMIN' || !dbUser.permissions.includes('emails')) {
    throw new Error('Forbidden');
  }

  return sendEmailReply(originalEmailId, replyBody.trim(), [], senderIdentityId);
}

export async function deleteEmail(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Verify permission
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true }
  });

  if (!dbUser?.permissions?.includes('emails')) {
    throw new Error('Forbidden');
  }

  await prisma.emailMessage.delete({
    where: { id }
  });

  revalidatePath('/dashboard/emails', 'layout');

  return { success: true };
}
