'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getContactSubmissions() {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
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
