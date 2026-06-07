import { NextRequest, NextResponse } from 'next/server';
import { detectLocale, generatePdf } from '@/lib/pdf-utils';

export async function GET(request: NextRequest) {
  const protocol = request.nextUrl.protocol;
  const host = request.nextUrl.host;
  const baseUrl = `${protocol}//${host}`;

  const locale = detectLocale(request);

  const previewUrl = `${baseUrl}/${locale}/quotes/template/preview`;

  try {
    return await generatePdf({
      request,
      baseUrl,
      previewUrl,
      filename: 'launchpad-template-blank.pdf',
    });
  } catch (error: any) {
    console.error('Error generating Template PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate template PDF', details: error.message },
      { status: 500 }
    );
  }
}
