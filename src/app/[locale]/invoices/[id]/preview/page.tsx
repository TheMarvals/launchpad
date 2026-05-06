import React from 'react';
import { getInvoiceById } from '@/app/actions/invoices';
import InvoicePDF from '@/components/InvoicePDF';
import { notFound } from 'next/navigation';

export default async function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="bg-slate-100 min-h-screen py-12 px-4 print:p-0 print:bg-white">
      <InvoicePDF invoice={invoice} />
    </div>
  );
}
