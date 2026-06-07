import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Page } from 'puppeteer';

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
 * Shared evaluate that all PDF routes apply: remove margins, fix wrapper, collapse pdf-pages.
 */
export async function applyPdfStyles(page: Page) {
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
    }

    document.querySelectorAll('.pdf-page').forEach((el) => {
      (el as HTMLElement).style.marginBottom = '0';
    });
  });
}

/**
 * Options for generatePdf.
 */
interface GeneratePdfOptions {
  request: NextRequest;
  baseUrl: string;
  previewUrl: string;
  filename: string;
  /** Extra evaluate logic to run after the common pdfStyles. */
  extraEvaluate?: (page: Page) => Promise<void>;
}

/**
 * Shared Puppeteer PDF generation pipeline:
 * launch browser → create page → forward cookies → set viewport → goto → emulateMediaType(screen)
 * → applyPdfStyles → extraEvaluate → generate PDF → close browser → return Response.
 */
export async function generatePdf(options: GeneratePdfOptions): Promise<Response> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  const page = await browser.newPage();
  await forwardCookies(page, options.request, options.baseUrl);

  await page.setViewport({
    width: 794,
    height: 1123,
    deviceScaleFactor: 2,
  });

  await page.goto(options.previewUrl, {
    waitUntil: 'networkidle0',
  });

  await page.emulateMediaType('screen');
  await applyPdfStyles(page);

  if (options.extraEvaluate) {
    await options.extraEvaluate(page);
  }

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
      'Content-Disposition': `attachment; filename="${options.filename}"`,
    },
  });
}
