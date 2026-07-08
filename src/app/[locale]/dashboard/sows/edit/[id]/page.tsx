import React from 'react';
import { notFound } from 'next/navigation';
import { getSowById, getClients } from '@/app/actions/sows';
import SowForm from '@/components/SowForm';
import { getCompanyProfile } from '@/app/actions/settings';

interface EditSowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSowPage({ params }: EditSowPageProps) {
  const { id } = await params;
  const [sow, clients, companyProfile] = await Promise.all([
    getSowById(id),
    getClients(),
    getCompanyProfile(),
  ]);

  if (!sow) {
    notFound();
  }

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <div>
        <h1 className="text-display-md font-medium text-ink tracking-tight">
          Editar SOWón #{String(sow.correlativo).padStart(4, '0')}
        </h1>
        <p className="text-body text-muted mt-[4px]">Modifica los detalles de la sowón.</p>
      </div>

      <SowForm clients={clients} companyProfile={companyProfile} initialData={sow} />
    </div>
  );
}
