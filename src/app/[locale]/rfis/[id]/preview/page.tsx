import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RfiPDF from '@/components/RfiPDF';
import { getCompanyProfile } from '@/app/actions/settings';

interface PreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RfiPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated — render with defaults
  }

  // For testing, mock ID
  if (id === 'test') {
    const mockRfi = {
      correlativo: 1,
      fechaEmision: new Date(),
      fechaValidez: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      notasCondiciones: 'Confidencialidad bajo acuerdo NDA.',
      client: {
        razonSocial: 'EMPRESA DE EJEMPLO SPA',
        rut: '76.543.210-K',
        giro: 'SERVICIOS DE TECNOLOGÍA',
        direccion: 'AV. NUEVA PROVIDENCIA 1234, SANTIAGO',
      },
      propuesta: 'Mock RFI',
    };
    return <RfiPDF rfi={mockRfi} companyProfile={companyProfile} />;
  }

  const rfi = await prisma.rfi.findUnique({
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
  });

  if (!rfi) {
    notFound();
  }

  return <RfiPDF rfi={rfi} companyProfile={companyProfile} />;
}
