import React from 'react';
import { getClients } from '@/app/actions/quotes';
import QuoteForm from '@/components/QuoteForm';

export default async function NewQuotePage() {
  const clients = await getClients();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Crear Cotización</h1>
        <p className="text-gray-500 mt-1">Ingresa los detalles para generar el documento formal.</p>
      </div>

      <QuoteForm clients={clients} />
    </div>
  );
}
