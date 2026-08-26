'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPitch(formData: any) {
  const {
    title,
    subtitle,
    clientName,
    clientId,
    userId,
    status,
    theme,
    slides,
  } = formData;

  // Determine next correlativo: start from 100 if none exists
  const maxRes = await prisma.pitch.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const pitch = await prisma.pitch.create({
    data: {
      correlativo: nextCorrelativo,
      title: title || 'Pitch Proposal',
      subtitle: subtitle || 'Where ideas take off',
      clientName: clientName || null,
      clientId: clientId || null,
      userId: userId || null,
      status: status || 'Borrador',
      theme: theme || 'midnight',
      slides: slides || [],
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');

  return pitch;
}

export async function getPitches() {
  return await prisma.pitch.findMany({
    include: {
      client: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          cargo: true,
          telefono: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPitchById(id: string) {
  return await prisma.pitch.findUnique({
    where: { id },
    include: {
      client: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          cargo: true,
          telefono: true,
        },
      },
    },
  });
}

export async function updatePitch(id: string, formData: any) {
  const {
    title,
    subtitle,
    clientName,
    clientId,
    userId,
    status,
    theme,
    slides,
  } = formData;

  const pitch = await prisma.pitch.update({
    where: { id },
    data: {
      title,
      subtitle,
      clientName: clientName || null,
      clientId: clientId || null,
      userId: userId || null,
      status: status || 'Borrador',
      theme: theme || 'midnight',
      slides: slides || [],
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');
  revalidatePath(`/pitches/${id}`);

  return pitch;
}

export async function updatePitchStatus(id: string, status: string) {
  const pitch = await prisma.pitch.update({
    where: { id },
    data: { status },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');

  return pitch;
}

export async function duplicatePitch(id: string) {
  const original = await prisma.pitch.findUnique({
    where: { id },
  });

  if (!original) throw new Error('Pitch not found');

  const maxRes = await prisma.pitch.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const pitch = await prisma.pitch.create({
    data: {
      correlativo: nextCorrelativo,
      title: `${original.title} (Copia)`,
      subtitle: original.subtitle,
      clientName: original.clientName,
      clientId: original.clientId,
      userId: original.userId,
      status: 'Borrador',
      theme: original.theme,
      slides: original.slides as any,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');

  return pitch;
}

export async function deletePitch(id: string) {
  await prisma.pitch.delete({
    where: { id },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pitches');
}
