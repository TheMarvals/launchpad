import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SowPDF from '@/components/SowPDF';
import { getCompanyProfile } from '@/app/actions/settings';

interface PreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated — render with defaults
  }

  // For testing, we can handle a "mock" ID
  if (id === 'test') {
    const mockSow = {
      correlativo: 1,
      fechaEmision: new Date(),
      fechaValidez: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      notasCondiciones: "Pago 50% anticipado, 50% contra entrega. Válido por 15 días.",
      client: {
        razonSocial: "EMPRESA DE EJEMPLO SPA",
        rut: "76.543.210-K",
        giro: "SERVICIOS DE TECNOLOGÍA",
        direccion: "AV. NUEVA PROVIDENCIA 1234, SANTIAGO"
      },
      propuesta: "Mock SOW"
    };
    return <SowPDF sow={mockSow} companyProfile={companyProfile} />;
  }

  const sow = await prisma.sow.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
    },
  });

  if (!sow) {
    notFound();
  }

  return <SowPDF sow={sow} companyProfile={companyProfile} />;
}
