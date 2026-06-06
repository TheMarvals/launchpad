import React from 'react';
import { prisma } from '@/lib/prisma';
import InvoiceForm from '@/components/InvoiceForm';

export default async function NewInvoicePage() {
  const clients = await prisma.client.findMany({
    orderBy: { razonSocial: 'asc' }
  });

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <InvoiceForm clients={clients} />
    </div>
  );
}
