import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import PWARegistration from '@/components/PWARegistration';
import "./globals.css";

export const metadata: Metadata = {
  title: "LAUNCHPAD · Admin Panel",
  description: "Plataforma administrativa y centro de productividad integral de LAUNCHPAD.",
  metadataBase: new URL(process.env.SITE_ORIGIN || 'https://thelaunchpad.help'),
  applicationName: 'LAUNCHPAD',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LAUNCHPAD',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#131314',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.some((supportedLocale) => supportedLocale === locale)) {
    notFound();
  }

  // Providing all messages to the client component
  // is the easiest way to get started. To follow senior advice,
  // we could filter messages here, but for now we'll provide them
  // and encourage using Server Components for the majority of translations.
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink" suppressHydrationWarning>
        <PWARegistration />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
