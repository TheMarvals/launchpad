import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protocol = request.nextUrl.protocol;
  const host = request.nextUrl.host;
  const baseUrl = `${protocol}//${host}`;
  const previewUrl = `${baseUrl}/quotes/${id}/preview`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set viewport for A4 size
    await page.setViewport({
      width: 794, // 210mm at 96dpi
      height: 1123, // 297mm at 96dpi
      deviceScaleFactor: 2,
    });

    await page.goto(previewUrl, {
      waitUntil: 'networkidle0',
    });

    // Force screen media type so rendering matches the browser preview exactly
    // (print mode causes subpixel scaling artifacts at page edges)
    await page.emulateMediaType('screen');

    // Use inline styles (highest CSS specificity) to force edge-to-edge rendering
    await page.evaluate(() => {
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.body.style.margin = '0';
      document.body.style.padding = '0';

      const wrapper = document.querySelector('.pdf-wrapper') as HTMLElement;
      if (wrapper) {
        wrapper.style.maxWidth = '100%';
        wrapper.style.width = '100%';
        wrapper.style.margin = '0';
        wrapper.style.padding = '0';
        wrapper.style.setProperty('gap', '0', 'important');
      }

      // Remove space between pages for PDF
      document.querySelectorAll('.pdf-page').forEach((el) => {
        (el as HTMLElement).style.marginBottom = '0';
      });

      // Hide Next.js dev indicators
      document.querySelectorAll('nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast]').forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
      // Also hide any shadow DOM based Next.js indicators
      const nextIndicator = document.querySelector('body > nextjs-portal');
      if (nextIndicator) nextIndicator.remove();
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
    });

    await browser.close();

    return new Response(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-${id}.pdf"`,
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
