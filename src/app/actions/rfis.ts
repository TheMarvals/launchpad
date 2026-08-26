'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createRfi(formData: any) {
  const {
    clientId,
    userId,
    fechaEmision,
    fechaValidez,
    estado,
    propuesta,
    notasCondiciones,
  } = formData;

  // Determine next correlativo: start from 100 if none exists
  const maxRes = await prisma.rfi.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const rfi = await prisma.rfi.create({
    data: {
      correlativo: nextCorrelativo,
      clientId,
      userId: userId || null,
      fechaEmision: fechaEmision ? new Date(fechaEmision) : new Date(),
      fechaValidez: new Date(fechaValidez),
      estado: estado || 'Borrador',
      propuesta: propuesta || '',
      notasCondiciones: notasCondiciones || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/rfis');

  return rfi;
}

export async function getRfis() {
  return await prisma.rfi.findMany({
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

export async function getRfiById(id: string) {
  return await prisma.rfi.findUnique({
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

export async function updateRfi(id: string, formData: any) {
  const {
    clientId,
    userId,
    fechaEmision,
    fechaValidez,
    estado,
    propuesta,
    notasCondiciones,
  } = formData;

  const rfi = await prisma.rfi.update({
    where: { id },
    data: {
      clientId,
      userId: userId || null,
      fechaEmision: fechaEmision ? new Date(fechaEmision) : undefined,
      fechaValidez: new Date(fechaValidez),
      estado: estado || 'Borrador',
      propuesta: propuesta || '',
      notasCondiciones: notasCondiciones || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/rfis');

  return rfi;
}

export async function updateRfiStatus(id: string, estado: string) {
  const rfi = await prisma.rfi.update({
    where: { id },
    data: { estado },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/rfis');

  return rfi;
}

export async function duplicateRfi(id: string) {
  const original = await prisma.rfi.findUnique({
    where: { id },
  });

  if (!original) throw new Error('RFI not found');

  // Determine next correlativo
  const maxRes = await prisma.rfi.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const rfi = await prisma.rfi.create({
    data: {
      correlativo: nextCorrelativo,
      clientId: original.clientId,
      userId: original.userId,
      fechaEmision: new Date(),
      fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estado: 'Borrador',
      propuesta: original.propuesta,
      notasCondiciones: original.notasCondiciones,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/rfis');

  return rfi;
}

export async function deleteRfi(id: string) {
  await prisma.rfi.delete({
    where: { id },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/rfis');
}
