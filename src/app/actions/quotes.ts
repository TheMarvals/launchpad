'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createQuote(formData: any) {
  const { clientId, items, notasCondiciones, propuesta, estado, fechaValidez } = formData;

  // Calculate totals
  let montoNeto = 0;
  items.forEach((item: any) => {
    montoNeto += item.subtotal;
  });

  const montoIva = Math.round(montoNeto * 0.19);
  const montoTotal = montoNeto + montoIva;

  const quote = await prisma.quote.create({
    data: {
      clientId,
      fechaValidez: new Date(fechaValidez),
      notasCondiciones,
      propuesta,
      montoNeto,
      montoIva,
      montoTotal,
      estado: estado || 'Borrador',
      items: {
        create: items.map((item: any) => ({
          descripcion: item.descripcion,
          cantidad: parseFloat(item.cantidad),
          precioUnitario: parseFloat(item.precioUnitario),
          subtotal: item.subtotal,
          esExento: item.esExento || false,
        })),
      },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/quotes');
  
  return quote;
}

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: { razonSocial: 'asc' }
  });
}

export async function getQuoteById(id: string) {
  return await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
    },
  });
}

export async function updateQuote(id: string, formData: any) {
  const { clientId, items, notasCondiciones, propuesta, estado, fechaValidez } = formData;

  // Calculate totals
  let montoNeto = 0;
  items.forEach((item: any) => {
    montoNeto += item.subtotal;
  });

  const montoIva = Math.round(montoNeto * 0.19);
  const montoTotal = montoNeto + montoIva;

  // Delete existing items and create new ones in a transaction
  const quote = await prisma.$transaction(async (tx) => {
    await tx.quoteItem.deleteMany({
      where: { quoteId: id },
    });

    return tx.quote.update({
      where: { id },
      data: {
        clientId,
        fechaValidez: new Date(fechaValidez),
        notasCondiciones,
        propuesta,
        montoNeto,
        montoIva,
        montoTotal,
        estado: estado || 'Borrador',
        items: {
          create: items.map((item: any) => ({
            descripcion: item.descripcion,
            cantidad: parseFloat(item.cantidad),
            precioUnitario: parseFloat(item.precioUnitario),
            subtotal: item.subtotal,
            esExento: item.esExento || false,
          })),
        },
      },
    });
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/quotes');
  
  return quote;
}

export async function deleteQuote(id: string) {
  await prisma.quote.delete({
    where: { id },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/quotes');
}
