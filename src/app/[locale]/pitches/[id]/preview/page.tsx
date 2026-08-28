import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PitchPDF from '@/components/pitches/PitchPDF';
import { getCompanyProfile } from '@/app/actions/settings';

interface PitchPreviewPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function PitchPreviewPage({ params }: PitchPreviewPageProps) {
  const { id, locale } = await params;
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated — render with defaults
  }

  const [pitch, showcaseProjects, senderIdentities] = await Promise.all([
    prisma.pitch.findUnique({
      where: { id },
      include: {
        client: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cargo: true,
            telefono: true,
          },
        },
      },
    }),
    prisma.showcaseProject.findMany({
      where: { isActive: true },
      include: { images: true },
      orderBy: { order: 'asc' },
    }),
    prisma.emailSenderIdentity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (!pitch) {
    notFound();
  }

  return (
    <PitchPDF
      pitch={pitch}
      companyProfile={companyProfile}
      senderIdentities={senderIdentities}
      showcaseProjects={showcaseProjects}
      locale={locale}
    />
  );
}
