import React from 'react';
import { prisma } from '@/lib/prisma';
import InvoiceForm from '@/components/InvoiceForm';
import { getInvoiceById } from '@/app/actions/invoices';
import { notFound } from 'next/navigation';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, clients] = await Promise.all([
    getInvoiceById(id),
    prisma.client.findMany({ orderBy: { razonSocial: 'asc' } })
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="p-8">
      <InvoiceForm clients={clients} initialData={invoice} />
    </div>
  );
}
