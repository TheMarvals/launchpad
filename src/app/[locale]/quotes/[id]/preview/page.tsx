import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import QuotePDF from '@/components/QuotePDF';
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
    const mockQuote = {
      correlativo: 1,
      fechaEmision: new Date(),
      fechaValidez: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      montoNeto: 1000000,
      montoIva: 190000,
      montoTotal: 1190000,
      notasCondiciones: "Pago 50% anticipado, 50% contra entrega. Válido por 15 días.",
      client: {
        razonSocial: "EMPRESA DE EJEMPLO SPA",
        rut: "76.543.210-K",
        giro: "SERVICIOS DE TECNOLOGÍA",
        direccion: "AV. NUEVA PROVIDENCIA 1234, SANTIAGO"
      },
      items: [
        { descripcion: "Desarrollo de Módulo de Facturación", cantidad: 1, precioUnitario: 600000, subtotal: 600000 },
        { descripcion: "Consultoría de Arquitectura Cloud", cantidad: 1, precioUnitario: 400000, subtotal: 400000 }
      ]
    };
    return <QuotePDF quote={mockQuote} companyProfile={companyProfile} />;
  }

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
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

  if (!quote) {
    notFound();
  }

  return <QuotePDF quote={quote} companyProfile={companyProfile} />;
}
