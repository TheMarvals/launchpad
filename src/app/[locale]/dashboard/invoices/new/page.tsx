import React from 'react';
import { prisma } from '@/lib/prisma';
import InvoiceForm from '@/components/InvoiceForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';

export default async function NewInvoicePage() {
  const [clients, companyProfile, admins] = await Promise.all([
    prisma.client.findMany({ orderBy: { razonSocial: 'asc' } }),
    getCompanyProfile(),
    getAdminsForQuote()
  ]);

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <InvoiceForm clients={clients} companyProfile={companyProfile} admins={admins} />
    </div>
  );
}
