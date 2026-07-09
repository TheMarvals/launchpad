import React from 'react';
import { notFound } from 'next/navigation';
import { getQuoteById, getClients } from '@/app/actions/quotes';
import QuoteForm from '@/components/QuoteForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';

interface EditQuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const [quote, clients, companyProfile, admins] = await Promise.all([
    getQuoteById(id),
    getClients(),
    getCompanyProfile(),
    getAdminsForQuote()
  ]);

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <div>
        <h1 className="text-display-md font-medium text-ink tracking-tight">
          Editar Cotización #{String(quote.correlativo).padStart(4, '0')}
        </h1>
        <p className="text-body text-muted mt-[4px]">Modifica los detalles de la cotización.</p>
      </div>

      <QuoteForm clients={clients} companyProfile={companyProfile} admins={admins} initialData={quote} />
    </div>
  );
}
