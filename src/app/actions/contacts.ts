'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/email';

export async function getContactSubmissions() {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return submissions;
  } catch (error) {
    console.error('[Contacts] Error fetching submissions:', error);
    return [];
  }
}

export async function markAsRead(id: string) {
  try {
    await prisma.contactSubmission.update({
      where: { id },
      data: { read: true },
    });
    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('[Contacts] Error marking as read:', error);
    return { error: 'Error updating submission.' };
  }
}

export async function markAllAsRead() {
  try {
    await prisma.contactSubmission.updateMany({
      where: { read: false },
      data: { read: true },
    });
    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('[Contacts] Error marking all as read:', error);
    return { error: 'Error updating submissions.' };
  }
}

export async function deleteContactSubmission(id: string) {
  try {
    await prisma.contactSubmission.delete({ where: { id } });
    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('[Contacts] Error deleting submission:', error);
    return { error: 'Error deleting submission.' };
  }
}

export async function replyToContactSubmission(id: string, subject: string, message: string) {
  try {
    const submission = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!submission) return { error: 'Submission not found' };

    const { error } = await resend.emails.send({
      from: `"LAUNCHPAD Portal" <${process.env.USERM || 'onboarding@resend.dev'}>`,
      to: submission.email,
      subject: subject,
      text: message,
    });

    if (error) {
      console.error('[Contacts] Error sending reply:', error);
      return { error: 'Failed to send email.' };
    }

    // Record the reply in the database
    const newReply = await prisma.contactReply.create({
      data: {
        contactSubmissionId: id,
        subject,
        message,
        sentBy: 'ADMIN',
      },
    });

    // Mark as read just in case
    await prisma.contactSubmission.update({
      where: { id },
      data: { read: true },
    });
    
    revalidatePath('/dashboard/contacts');
    return { success: true, reply: newReply };
  } catch (error) {
    console.error('[Contacts] Error replying to submission:', error);
    return { error: 'Failed to reply.' };
  }
}
