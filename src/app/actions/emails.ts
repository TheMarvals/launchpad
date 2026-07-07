'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getEmails() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Verify permission
  const dbUser = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
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

  const email = await prisma.emailMessage.findUnique({
    where: { id }
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

  const originalEmail = await prisma.emailMessage.findUnique({
    where: { id: originalEmailId }
  });

  if (!originalEmail) throw new Error('Original email not found');

  const fromEmail = process.env.USERM || 'soporte@thelaunchpad.help'; // Fallback
  
  // Format subject: add Re: if not already there
  let subject = originalEmail.subject || '';
  if (!subject.toLowerCase().startsWith('re:')) {
    subject = `Re: ${subject}`;
  }

  // Send via Resend
  const data = await resend.emails.send({
    from: `LAUNCHPAD Support <${fromEmail}>`,
    to: originalEmail.from,
    subject: subject,
    text: replyBody, // Simple text reply for now
  });

  if (data.error) {
    console.error('Failed to send reply:', data.error);
    throw new Error('Failed to send reply: ' + data.error.message);
  }

  // Save the reply as an OUTBOUND message in the DB
  await prisma.emailMessage.create({
    data: {
      from: fromEmail,
      to: originalEmail.from,
      subject: subject,
      textBody: replyBody,
      direction: 'OUTBOUND',
      status: 'REPLIED'
    }
  });

  // Mark original as REPLIED
  await prisma.emailMessage.update({
    where: { id: originalEmailId },
    data: { status: 'REPLIED' }
  });

  return { success: true };
}
