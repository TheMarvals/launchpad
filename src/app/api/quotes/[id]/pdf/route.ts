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

  const previewUrl = `${baseUrl}/${locale}/quotes/${id}/preview`;

  try {
    return await generatePdf({
      request,
      baseUrl,
      previewUrl,
      filename: `cotizacion-${id}.pdf`,
      extraEvaluate: async (page) => {
        await page.evaluate(() => {
          const wrapper = document.querySelector('.pdf-wrapper') as HTMLElement;
          if (wrapper) {
            wrapper.style.setProperty('gap', '0', 'important');
          }

          // Hide Next.js dev indicators
          document.querySelectorAll('nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast]').forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
          const nextIndicator = document.querySelector('body > nextjs-portal');
          if (nextIndicator) nextIndicator.remove();
        });
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
