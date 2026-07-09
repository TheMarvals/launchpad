'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createClient(formData: any) {
  try {
    const client = await prisma.client.create({
      data: {
        rut: formData.rut,
        razonSocial: formData.razonSocial,
        giro: formData.giro,
        direccion: formData.direccion,
        comuna: formData.comuna,
        ciudad: formData.ciudad,
        email: formData.email || null,
        telefono: formData.telefono || null,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/clients');

    return client;
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Ya existe un cliente con este RUT' };
    }
    return { error: 'Error al crear el cliente' };
  }
}

export async function updateClient(id: string, formData: any) {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        rut: formData.rut,
        razonSocial: formData.razonSocial,
        giro: formData.giro,
        direccion: formData.direccion,
        comuna: formData.comuna,
        ciudad: formData.ciudad,
        email: formData.email || null,
        telefono: formData.telefono || null,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/clients');

    return client;
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Ya existe un cliente con este RUT' };
    }
    return { error: 'Error al actualizar el cliente' };
  }
}

export async function deleteClient(id: string) {
  // Check if client has quotes
  const quotesCount = await prisma.quote.count({
    where: { clientId: id },
  });

  if (quotesCount > 0) {
    throw new Error(`No se puede eliminar: el cliente tiene ${quotesCount} cotización(es) asociada(s).`);
  }

  await prisma.client.delete({
    where: { id },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/clients');
}
