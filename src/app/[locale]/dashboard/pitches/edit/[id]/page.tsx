import React from 'react';
import { notFound } from 'next/navigation';
import { getPitchById } from '@/app/actions/pitches';
import { getClients } from '@/app/actions/quotes';
import PitchForm from '@/components/pitches/PitchForm';
import { getCompanyProfile, getAdminsForQuote } from '@/app/actions/settings';
import { prisma } from '@/lib/prisma';

interface EditPitchPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPitchPage({ params }: EditPitchPageProps) {
  const { id } = await params;
  const [pitch, clients, companyProfile, admins, showcaseProjects] = await Promise.all([
    getPitchById(id),
    getClients(),
    getCompanyProfile(),
    getAdminsForQuote(),
    prisma.showcaseProject.findMany({
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    }),
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
        showcaseProjects={showcaseProjects}
        initialData={pitch}
      />
    </div>
  );
}
