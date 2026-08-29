import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
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

    // Block video files, media streams, and websockets
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();
      if (
        ['media', 'websocket'].includes(resourceType) ||
        /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url)
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await forwardCookies(page, request, baseUrl);

    // Set viewport at 2x Retina resolution for razor-sharp text & graphics
    await page.setViewport({
      width: 1123,
      height: 794,
      deviceScaleFactor: 2,
    });

    await page.goto(previewUrl, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 25000,
    }).catch(() => {
      // If networkidle0 times out, continue with loaded content
    });

    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await applyPdfStyles(page);

    // Fast check for fonts and images
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
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    // Query all slide element handles
    const slideHandles = await page.$$('.pdf-page');

    if (slideHandles.length === 0) {
      throw new Error('No slide pages found to export');
    }

    // Standard A4 landscape dimensions in PDF points (297mm x 210mm at 72dpi)
    const A4_WIDTH = 841.89;
    const A4_HEIGHT = 595.28;

    const pdfDoc = await PDFDocument.create();

    // High-resolution screenshot of each slide embedded as a native hardware-accelerated JPEG
    for (const slideHandle of slideHandles) {
      const screenshotBuffer = await slideHandle.screenshot({
        type: 'jpeg',
        quality: 88,
      });

      const embeddedJpg = await pdfDoc.embedJpg(screenshotBuffer);
      const pdfPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

      pdfPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: A4_WIDTH,
        height: A4_HEIGHT,
      });
    }

    await browser.close();

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
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
