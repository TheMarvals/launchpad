'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from '@/i18n/routing';

export async function createSow(formData: any) {
  const { 
    clientId, items, notasCondiciones, propuesta, estado, fechaValidez,
    taxName, taxPercent, extraFeeName, extraFeeAmount, paymentMethod, totalLabel
  } = formData;

  // Calculate totals
  let montoNeto = 0;
  items.forEach((item: any) => {
    montoNeto += item.subtotal;
  });

  const percent = parseFloat(taxPercent || 19);
  const fee = parseFloat(extraFeeAmount || 0);
  
  const montoIva = Math.round(montoNeto * (percent / 100));
  const montoTotal = montoNeto + montoIva + fee;

  // Determine next correlativo: start from 100 if none exists
  const maxRes = await prisma.sow.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const sow = await prisma.sow.create({
    data: {
      correlativo: nextCorrelativo,
      clientId,
      fechaValidez: new Date(fechaValidez),
      notasCondiciones,
      propuesta,
      montoNeto,
      montoIva,
      montoTotal,
      taxName: taxName || 'IVA',
      taxPercent: percent,
      extraFeeName,
      extraFeeAmount: fee,
      paymentMethod,
      totalLabel,
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
  revalidatePath('/dashboard/sows');
  
  return sow;
}

export async function getSows() {
  return await prisma.sow.findMany({
    include: { client: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: { razonSocial: 'asc' }
  });
}

export async function getSowById(id: string) {
  return await prisma.sow.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
    },
  });
}

export async function updateSow(id: string, formData: any) {
  const { 
    clientId, items, notasCondiciones, propuesta, estado, fechaValidez,
    taxName, taxPercent, extraFeeName, extraFeeAmount, paymentMethod, totalLabel
  } = formData;

  // Calculate totals
  let montoNeto = 0;
  items.forEach((item: any) => {
    montoNeto += item.subtotal;
  });

  const percent = parseFloat(taxPercent || 19);
  const fee = parseFloat(extraFeeAmount || 0);
  
  const montoIva = Math.round(montoNeto * (percent / 100));
  const montoTotal = montoNeto + montoIva + fee;

  // Delete existing items and create new ones in a transaction
  const sow = await prisma.$transaction(async (tx) => {
    await tx.sowItem.deleteMany({
      where: { sowId: id },
    });

    return tx.sow.update({
      where: { id },
      data: {
        clientId,
        fechaValidez: new Date(fechaValidez),
        notasCondiciones,
        propuesta,
        montoNeto,
        montoIva,
        montoTotal,
        taxName: taxName || 'IVA',
        taxPercent: percent,
        extraFeeName,
        extraFeeAmount: fee,
        paymentMethod,
        totalLabel,
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
  revalidatePath('/dashboard/sows');
  
  return sow;
}

export async function duplicateSow(id: string) {
  const original = await prisma.sow.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!original) throw new Error('Sow not found');

  // Determine next correlativo
  const maxRes = await prisma.sow.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const sow = await prisma.sow.create({
    data: {
      correlativo: nextCorrelativo,
      clientId: original.clientId,
      fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estado: 'Borrador',
      propuesta: original.propuesta,
      notasCondiciones: original.notasCondiciones,
      montoNeto: original.montoNeto,
      montoIva: original.montoIva,
      montoTotal: original.montoTotal,
      taxName: original.taxName,
      taxPercent: original.taxPercent,
      extraFeeName: original.extraFeeName,
      extraFeeAmount: original.extraFeeAmount,
      paymentMethod: original.paymentMethod,
      totalLabel: original.totalLabel,
      items: {
        create: original.items.map(item => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento,
          subtotal: item.subtotal,
          esExento: item.esExento,
        })),
      },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sows');

  return sow;
}

export async function deleteSow(id: string) {
  await prisma.sow.delete({
    where: { id },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/sows');
}
