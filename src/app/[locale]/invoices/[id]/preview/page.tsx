import React from 'react';
import { getInvoiceById } from '@/app/actions/invoices';
import { getCompanyProfile } from '@/app/actions/settings';
import InvoicePDF from '@/components/InvoicePDF';
import { notFound } from 'next/navigation';

export default async function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const [invoice, companyProfile] = await Promise.all([
    getInvoiceById(id),
    getCompanyProfile(),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="bg-slate-100 min-h-screen py-12 px-4 print:p-0 print:bg-white">
      <InvoicePDF invoice={invoice} companyProfile={companyProfile} />
    </div>
  );
}
