import { NextRequest, NextResponse } from 'next/server';
import { detectLocale, generatePdf } from '@/lib/pdf-utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protocol = request.nextUrl.protocol;
  const host = request.nextUrl.host;
  const baseUrl = `${protocol}//${host}`;

  const locale = detectLocale(request);
  const previewUrl = `${baseUrl}/${locale}/pitches/${id}/preview`;

  try {
    return await generatePdf({
      request,
      baseUrl,
      previewUrl,
      filename: `pitch-${id}.pdf`,
      landscape: true,
      flattenSlides: true,
      width: 1123,
      height: 794,
    });
  } catch (error: any) {
    console.error('Error generating pitch PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
