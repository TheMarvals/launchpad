import React from 'react';
import { getClients } from '@/app/actions/quotes';
import PitchForm from '@/components/pitches/PitchForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';

export default async function NewPitchPage() {
  const [clients, companyProfile, admins] = await Promise.all([
    getClients(),
    getCompanyProfile(),
    getAdminsForQuote(),
  ]);

  return (
    <div className="space-y-md max-w-7xl mx-auto">
      <PitchForm
        clients={clients}
        companyProfile={companyProfile}
        admins={admins}
      />
    </div>
  );
}
