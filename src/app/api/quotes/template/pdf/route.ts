import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(request: NextRequest) {
  const protocol = request.nextUrl.protocol;
  const host = request.nextUrl.host;
  const baseUrl = `${protocol}//${host}`;
  const previewUrl = `${baseUrl}/quotes/template/preview`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    await page.goto(previewUrl, {
      waitUntil: 'networkidle0',
    });

    await page.emulateMediaType('screen');

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
        'Content-Disposition': 'attachment; filename="marval-template-blank.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating Template PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate template PDF', details: error.message },
      { status: 500 }
    );
  }
}
