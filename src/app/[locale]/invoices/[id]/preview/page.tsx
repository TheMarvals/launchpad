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
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated — render with defaults
  }

  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return <InvoicePDF invoice={invoice} companyProfile={companyProfile} />;
}
