import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Page } from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

/**
 * Forwards all cookies from the incoming NextRequest to a Puppeteer page
 * so that the admin session is maintained when Puppeteer navigates to preview URLs.
 */
export async function forwardCookies(page: Page, request: NextRequest, baseUrl: string) {
  const cookies = request.cookies.getAll();
  if (cookies.length > 0) {
    await page.setCookie(
      ...cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: new URL(baseUrl).hostname,
        path: '/',
      }))
    );
  }
}

/**
 * Detect locale from query parameter, cookie, or referer header.
 * Falls back to 'es'.
 */
export function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const localeParam = request.nextUrl.searchParams.get('locale');
  const referer = request.headers.get('referer');
  let refererLocale = '';
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const pathParts = refererUrl.pathname.split('/');
      if (['en', 'es'].includes(pathParts[1])) {
        refererLocale = pathParts[1];
      }
    } catch (e) {}
  }
  return localeParam || cookieLocale || refererLocale || 'es';
}

/**
 * Shared evaluate that all PDF routes apply: remove margins, fix wrapper, collapse pdf-pages,
 * and clean up Next.js dev portals and indicators.
 */
export async function applyPdfStyles(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // Remove Next.js dev portals and overlays
    document.querySelectorAll('nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
      el.remove();
    });
    const nextPortal = document.querySelector('body > nextjs-portal');
    if (nextPortal) nextPortal.remove();

    const wrapper = document.querySelector('.pdf-wrapper') as HTMLElement;
    if (wrapper) {
      wrapper.style.maxWidth = '100%';
      wrapper.style.width = '100%';
      wrapper.style.margin = '0';
      wrapper.style.padding = '0';
      wrapper.style.setProperty('gap', '0', 'important');
    }

    document.querySelectorAll('.pdf-page').forEach((el) => {
      (el as HTMLElement).style.marginBottom = '0';
    });
  });
}

/**
 * Options for generatePdf.
 */
export interface GeneratePdfOptions {
  request: NextRequest;
  baseUrl: string;
  previewUrl: string;
  filename: string;
  landscape?: boolean;
  flattenSlides?: boolean;
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  /** Extra evaluate logic to run after the common pdfStyles. */
  extraEvaluate?: (page: Page) => Promise<void>;
}

/**
 * Unified Puppeteer PDF generation pipeline:
 * Supports standard vector PDF as well as flattened high-res presentation slide assembly.
 */
export async function generatePdf(options: GeneratePdfOptions): Promise<Response> {
  const isLandscape = options.landscape ?? false;
  const isFlatten = options.flattenSlides ?? false;
  const viewportWidth = options.width || (isLandscape ? 1123 : 794);
  const viewportHeight = options.height || (isLandscape ? 794 : 1123);
  // 1.5× keeps presentation text and imagery crisp on screen while avoiding
  // the much heavier 2× images previously embedded per slide.
  const scaleFactor = options.deviceScaleFactor || (isFlatten ? 1.5 : 1.5);

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

  try {
    const page = await browser.newPage();

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

    await forwardCookies(page, options.request, options.baseUrl);

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor: scaleFactor,
    });

    await page.goto(options.previewUrl, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 25000,
    }).catch(() => {
      // Continue if networkidle0 times out
    });

    await page.waitForSelector('.pdf-page', { timeout: 15000 });

    await page.emulateMediaType('screen');
    await applyPdfStyles(page);

    // Wait for fonts and images to load
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

    if (options.extraEvaluate) {
      await options.extraEvaluate(page);
    }

    if (isFlatten) {
      // High-res slide rasterization (Canva / Keynote style) for buttery smooth 60fps scrolling
      const slideHandles = await page.$$('.pdf-page');
      if (slideHandles.length === 0) {
        throw new Error('No slide pages found to export');
      }

      const A4_WIDTH = isLandscape ? 841.89 : 595.28;
      const A4_HEIGHT = isLandscape ? 595.28 : 841.89;

      const pdfDoc = await PDFDocument.create();

      for (const slideHandle of slideHandles) {
        const screenshotBuffer = await slideHandle.screenshot({
          type: 'jpeg',
          quality: 82,
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

      const pdfBytes = await pdfDoc.save();

      return new Response(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${options.filename}"`,
        },
      });
    }

    // Standard document vector PDF
    const pdf = await page.pdf({
      format: 'A4',
      landscape: isLandscape,
      preferCSSPageSize: true,
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
    });

    return new Response(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${options.filename}"`,
      },
    });
  } finally {
    await browser.close();
  }
}
