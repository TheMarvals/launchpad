import React from 'react';
import { getClients } from '@/app/actions/quotes';
import RfiForm from '@/components/RfiForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';

export default async function NewRfiPage() {
  const [clients, companyProfile, admins] = await Promise.all([
    getClients(),
    getCompanyProfile(),
    getAdminsForQuote(),
  ]);

  return (
    <div className="space-y-md max-w-5xl mx-auto">
      <RfiForm clients={clients} companyProfile={companyProfile} admins={admins} />
    </div>
  );
}
