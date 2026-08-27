import React from 'react';
import { getClients } from '@/app/actions/quotes';
import PitchForm from '@/components/pitches/PitchForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';
import { prisma } from '@/lib/prisma';

export default async function NewPitchPage() {
  const [clients, companyProfile, admins, showcaseProjects] = await Promise.all([
    getClients(),
    getCompanyProfile(),
    getAdminsForQuote(),
    prisma.showcaseProject.findMany({
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-md max-w-7xl mx-auto">
      <PitchForm
        clients={clients}
        companyProfile={companyProfile}
        admins={admins}
        showcaseProjects={showcaseProjects}
      />
    </div>
  );
}
