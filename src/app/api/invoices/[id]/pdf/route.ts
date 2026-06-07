import { NextRequest, NextResponse } from 'next/server';
import { detectLocale, generatePdf } from '@/lib/pdf-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protocol = request.nextUrl.protocol;
  const host = request.nextUrl.host;
  const baseUrl = `${protocol}//${host}`;

  const locale = detectLocale(request);

  const previewUrl = `${baseUrl}/${locale}/invoices/${id}/preview`;

  try {
    return await generatePdf({
      request,
      baseUrl,
      previewUrl,
      filename: `factura-${id}.pdf`,
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
