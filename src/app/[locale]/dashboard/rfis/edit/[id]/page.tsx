import React from 'react';
import { notFound } from 'next/navigation';
import { getRfiById } from '@/app/actions/rfis';
import { getClients } from '@/app/actions/quotes';
import RfiForm from '@/components/RfiForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';

interface EditRfiPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRfiPage({ params }: EditRfiPageProps) {
  const { id } = await params;
  const [rfi, clients, companyProfile, admins] = await Promise.all([
    getRfiById(id),
    getClients(),
    getCompanyProfile(),
    getAdminsForQuote(),
  ]);

  if (!rfi) {
    notFound();
  }

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <RfiForm
        clients={clients}
        companyProfile={companyProfile}
        admins={admins}
        initialData={rfi}
      />
    </div>
  );
}
