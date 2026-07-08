import React from 'react';
import { getClients } from '@/app/actions/sows';
import SowForm from '@/components/SowForm';
import { getCompanyProfile } from '@/app/actions/settings';

export default async function NewSowPage() {
  const [clients, companyProfile] = await Promise.all([
    getClients(),
    getCompanyProfile()
  ]);

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <div>
        <h1 className="text-display-md font-medium text-ink tracking-tight">Crear SOWón</h1>
        <p className="text-body text-muted mt-[4px]">Ingresa los detalles para generar el documento formal.</p>
      </div>

      <SowForm clients={clients} companyProfile={companyProfile} />
    </div>
  );
}
