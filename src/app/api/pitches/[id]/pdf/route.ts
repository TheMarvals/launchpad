import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { detectLocale, forwardCookies, applyPdfStyles } from '@/lib/pdf-utils';

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
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--safebrowsing-disable-auto-update',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    
    // Intercept and abort unnecessary heavy requests like video streams or web sockets
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['media', 'websocket'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await forwardCookies(page, request, baseUrl);

    await page.setViewport({
      width: 1123,
      height: 794,
      deviceScaleFactor: 2,
    });

    // Use domcontentloaded for fast load, followed by selector wait
    await page.goto(previewUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await page.emulateMediaType('screen');
    await applyPdfStyles(page);

    // Fast check for fonts and images with 2.5s maximum timeout
    await Promise.race([
      Promise.all([
        page.evaluateHandle('document.fonts.ready').catch(() => null),
        page.evaluate(async () => {
          const selectors = Array.from(document.images);
          await Promise.all(
            selectors.map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              });
            })
          );
        }).catch(() => null),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);

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
