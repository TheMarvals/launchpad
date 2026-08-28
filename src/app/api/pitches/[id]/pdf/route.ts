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

    // Block videos, large media, and unnecessary requests
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();
      // Block video files, media streams, websockets, and font-display preloads
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

    // deviceScaleFactor: 1 — cuts PDF file size by ~75% (from ~47MB to ~8-12MB)
    await page.setViewport({
      width: 1123,
      height: 794,
      deviceScaleFactor: 1,
    });

    await page.goto(previewUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await page.emulateMediaType('screen');
    await applyPdfStyles(page);

    // Downscale all images in the DOM to max 800px wide and compress via canvas
    // This dramatically reduces embedded image sizes in the final PDF
    await page.evaluate(async () => {
      const MAX_W = 800;
      const QUALITY = 0.7;
      const imgs = Array.from(document.querySelectorAll('img'));

      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              const process = () => {
                try {
                  if (!img.naturalWidth || img.naturalWidth <= MAX_W) {
                    resolve();
                    return;
                  }
                  const ratio = MAX_W / img.naturalWidth;
                  const w = MAX_W;
                  const h = Math.round(img.naturalHeight * ratio);
                  const canvas = document.createElement('canvas');
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) { resolve(); return; }
                  ctx.drawImage(img, 0, 0, w, h);
                  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
                  img.src = dataUrl;
                } catch {
                  // CORS or tainted canvas — skip
                }
                resolve();
              };
              if (img.complete) {
                process();
              } else {
                img.addEventListener('load', process, { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              }
            })
        )
      );
    });

    // Brief pause for re-renders after image replacement
    await new Promise((resolve) => setTimeout(resolve, 300));

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
