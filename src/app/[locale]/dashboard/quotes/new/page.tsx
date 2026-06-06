import React from 'react';
import { getClients } from '@/app/actions/quotes';
import QuoteForm from '@/components/QuoteForm';
import { getCompanyProfile } from '@/app/actions/settings';

export default async function NewQuotePage() {
  const [clients, companyProfile] = await Promise.all([
    getClients(),
    getCompanyProfile()
  ]);

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <div>
        <h1 className="text-display-md font-medium text-ink tracking-tight">Crear Cotización</h1>
        <p className="text-body text-muted mt-[4px]">Ingresa los detalles para generar el documento formal.</p>
      </div>

      <QuoteForm clients={clients} companyProfile={companyProfile} />
    </div>
  );
}
