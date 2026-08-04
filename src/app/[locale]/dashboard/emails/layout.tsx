import React from 'react';
import { getTranslations } from 'next-intl/server';
import { getEmails } from '@/app/actions/emails';
import EmailWorkspace from '@/components/emails/EmailWorkspace';

export default async function EmailsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Navigation');

  let emails: Awaited<ReturnType<typeof getEmails>> = [];
  try {
    emails = await getEmails();
  } catch (error) {
    console.error('Error fetching emails:', error);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] -mx-sm md:-mx-lg -mt-4 bg-canvas">
      {/* Encabezado */}
      <div className="px-sm md:px-lg py-4 border-b border-hairline shrink-0 flex justify-between items-center bg-canvas">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">{t('emails')}</h1>
        </div>
      </div>

      <EmailWorkspace emails={emails} locale={locale}>
        {children}
      </EmailWorkspace>
    </div>
  );
}
