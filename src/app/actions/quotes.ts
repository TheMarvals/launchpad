'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from '@/i18n/routing';

export async function createQuote(formData: any) {
  const { 
    clientId, items, notasCondiciones, propuesta, estado, fechaValidez,
    taxName, taxPercent, extraFeeName, extraFeeAmount, paymentMethod, totalLabel,
    userId, showInvestment
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
  const maxRes = await prisma.quote.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const quote = await prisma.quote.create({
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
      userId: userId || null,
      showInvestment: showInvestment !== undefined ? showInvestment : true,
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

export async function updateQuote(id: string, formData: any) {
  const { 
    clientId, items, notasCondiciones, propuesta, estado, fechaValidez,
    taxName, taxPercent, extraFeeName, extraFeeAmount, paymentMethod, totalLabel,
    userId, showInvestment
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
        taxName: taxName || 'IVA',
        taxPercent: percent,
        extraFeeName,
        extraFeeAmount: fee,
        paymentMethod,
        totalLabel,
        estado: estado || 'Borrador',
        userId: userId || null,
        showInvestment: showInvestment !== undefined ? showInvestment : true,
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

export async function duplicateQuote(id: string) {
  const original = await prisma.quote.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!original) throw new Error('Quote not found');

  // Determine next correlativo
  const maxRes = await prisma.quote.aggregate({ _max: { correlativo: true } });
  const currentMax = (maxRes._max && maxRes._max.correlativo) ? maxRes._max.correlativo : 0;
  const nextCorrelativo = currentMax >= 100 ? currentMax + 1 : 100;

  const quote = await prisma.quote.create({
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
      userId: original.userId,
      showInvestment: original.showInvestment,
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
