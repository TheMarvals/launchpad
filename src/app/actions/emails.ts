'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendEmailReply } from '@/lib/email-replies';

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
    },
  });

  if (!email) throw new Error('Email not found');

  // Mark as read if INBOUND and UNREAD
  if (email.direction === 'INBOUND' && email.status === 'UNREAD') {
    await prisma.emailMessage.update({
      where: { id },
      data: { status: 'READ' }
    });
  }

  return email;
}

export async function replyToEmail(originalEmailId: string, replyBody: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true, isActive: true },
  });

  if (!dbUser?.isActive || dbUser.role !== 'ADMIN' || !dbUser.permissions.includes('emails')) {
    throw new Error('Forbidden');
  }

  return sendEmailReply(originalEmailId, replyBody.trim());
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
