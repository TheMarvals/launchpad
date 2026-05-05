import React from 'react';
import { notFound } from 'next/navigation';
import { getQuoteById, getClients } from '@/app/actions/quotes';
import QuoteForm from '@/components/QuoteForm';

interface EditQuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const [quote, clients] = await Promise.all([
    getQuoteById(id),
    getClients(),
  ]);

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Editar Cotización #{String(quote.correlativo).padStart(4, '0')}
        </h1>
        <p className="text-gray-500 mt-1">Modifica los detalles de la cotización.</p>
      </div>

      <QuoteForm clients={clients} initialData={quote} />
    </div>
  );
}
