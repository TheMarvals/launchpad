import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { detectLocale, forwardCookies, applyPdfStyles } from '@/lib/pdf-utils';

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
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await forwardCookies(page, request, baseUrl);

    await page.setViewport({
      width: 1123,
      height: 794,
      deviceScaleFactor: 2,
    });

    await page.goto(previewUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForSelector('.pdf-page', { timeout: 30000 });
    await page.emulateMediaType('screen');
    await applyPdfStyles(page);

    // Ensure all Google Fonts and images are fully rendered
    await page.evaluateHandle('document.fonts.ready');
    await page.evaluate(async () => {
      const selectors = Array.from(document.images);
      await Promise.all(
        selectors.map((img) => {
          if (img.complete) return;
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        })
      );
    });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
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
        'Content-Disposition': `attachment; filename="pitch-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating pitch PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
