'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from '@/i18n/routing';

export async function createInvoice(formData: any) {
  const { 
    clientId, items, notas, fechaVencimiento, estado,
    taxName, taxPercent, extraFeeName, extraFeeAmount, paymentMethod,
    quoteId, userId, totalLabel
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

  const invoice = await prisma.invoice.create({
    data: {
      clientId,
      fechaVencimiento: new Date(fechaVencimiento),
      notas,
      montoNeto,
      montoIva,
      montoTotal,
      taxName: taxName || 'IVA',
      taxPercent: percent,
      extraFeeName,
      extraFeeAmount: fee,
      paymentMethod,
      totalLabel,
      userId: userId || null,
      estado: estado || 'Pendiente',
      items: {
        create: items.map((item: any) => ({
          descripcion: item.descripcion,
          cantidad: parseFloat(item.cantidad),
          precioUnitario: parseFloat(item.precioUnitario),
          subtotal: item.subtotal,
          esExento: item.esExento || false,
        })),
      },
      ...(quoteId && { quote: { connect: { id: quoteId } } })
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
  
  return invoice;
}

export async function getInvoices() {
  return await prisma.invoice.findMany({
    include: { client: true },
    orderBy: { correlativo: 'desc' }
  });
}

export async function getInvoiceById(id: string) {
  return await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
      quote: true,
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

export async function updateInvoice(id: string, formData: any) {
  const { 
    clientId, items, notas, fechaVencimiento, estado,
    taxName, taxPercent, extraFeeName, extraFeeAmount, paymentMethod,
    userId, totalLabel
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

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    return tx.invoice.update({
      where: { id },
      data: {
        clientId,
        fechaVencimiento: new Date(fechaVencimiento),
        notas,
        montoNeto,
        montoIva,
        montoTotal,
        taxName: taxName || 'IVA',
        taxPercent: percent,
        extraFeeName,
        extraFeeAmount: fee,
        paymentMethod,
        totalLabel,
        userId: userId || null,
        estado,
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
  revalidatePath('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({
    where: { id },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices');
}

export async function convertQuoteToInvoice(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true }
  });

  if (!quote) throw new Error('Quote not found');

  // Set due date to 15 days from now by default
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  const invoice = await prisma.invoice.create({
    data: {
      clientId: quote.clientId,
      fechaVencimiento: dueDate,
      montoNeto: quote.montoNeto,
      montoIva: quote.montoIva,
      montoTotal: quote.montoTotal,
      taxName: quote.taxName,
      taxPercent: quote.taxPercent,
      extraFeeName: quote.extraFeeName,
      extraFeeAmount: quote.extraFeeAmount,
      paymentMethod: quote.paymentMethod,
      totalLabel: quote.totalLabel,
      userId: quote.userId,
      estado: 'Pendiente',
      items: {
        create: quote.items.map(item => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
          esExento: item.esExento
        }))
      },
      quote: { connect: { id: quoteId } }
    }
  });

  // Update quote status
  await prisma.quote.update({
    where: { id: quoteId },
    data: { estado: 'Aceptada' }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/quotes');
  revalidatePath('/dashboard/invoices');

  return invoice;
}

export async function updateInvoiceStatus(id: string, estado: string) {
  await prisma.invoice.update({
    where: { id },
    data: { estado }
  });
  revalidatePath('/dashboard/invoices');
}
