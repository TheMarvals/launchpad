import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PitchViewer from '@/components/pitches/PitchViewer';
import { getCompanyProfile } from '@/app/actions/settings';

interface PitchPresentationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PitchPresentationPage({ params }: PitchPresentationPageProps) {
  const { id } = await params;
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated
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
    <div className="min-h-screen bg-[#07070b]">
      <PitchViewer
        pitch={pitch}
        companyProfile={companyProfile}
        senderIdentities={senderIdentities}
        showcaseProjects={showcaseProjects}
        initialMode="deck"
      />
    </div>
  );
}
