import React from 'react';
import { prisma } from '@/lib/prisma';
import InvoiceForm from '@/components/InvoiceForm';
import { getInvoiceById } from '@/app/actions/invoices';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';
import { notFound } from 'next/navigation';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, clients, companyProfile, admins] = await Promise.all([
    getInvoiceById(id),
    prisma.client.findMany({ orderBy: { razonSocial: 'asc' } }),
    getCompanyProfile(),
    getAdminsForQuote()
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <InvoiceForm clients={clients} companyProfile={companyProfile} admins={admins} initialData={invoice} />
    </div>
  );
}
