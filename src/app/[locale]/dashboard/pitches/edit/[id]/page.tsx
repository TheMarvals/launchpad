import React from 'react';
import { notFound } from 'next/navigation';
import { getPitchById } from '@/app/actions/pitches';
import { getClients } from '@/app/actions/quotes';
import PitchForm from '@/components/pitches/PitchForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';

interface EditPitchPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPitchPage({ params }: EditPitchPageProps) {
  const { id } = await params;
  const [pitch, clients, companyProfile, admins] = await Promise.all([
    getPitchById(id),
    getClients(),
    getCompanyProfile(),
    getAdminsForQuote(),
  ]);

  if (!pitch) {
    notFound();
  }

  return (
    <div className="space-y-md max-w-7xl mx-auto">
      <PitchForm
        clients={clients}
        companyProfile={companyProfile}
        admins={admins}
        initialData={pitch}
      />
    </div>
  );
}
