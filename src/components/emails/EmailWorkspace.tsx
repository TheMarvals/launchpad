'use client';

import type { EmailMessage } from '@prisma/client';
import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/routing';
import EmailSidebar from '@/components/emails/EmailSidebar';

interface EmailWorkspaceProps {
  children: ReactNode;
  emails: EmailMessage[];
  header: ReactNode;
  locale: string;
}

export default function EmailWorkspace({ children, emails, header, locale }: EmailWorkspaceProps) {
  const pathname = usePathname();
  const isDetailView = /\/dashboard\/emails\/[^/]+\/?$/.test(pathname);

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] md:h-[calc(100vh-130px)] -mx-sm md:-mx-lg -mt-4 bg-canvas">
      <div className={isDetailView ? 'hidden md:block' : 'block'}>
        {header}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <EmailSidebar
          initialEmails={emails}
          locale={locale}
          mobileHidden={isDetailView}
        />

        <div className={`${isDetailView ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 flex-col overflow-hidden bg-canvas-elevated/10`}>
          {children}
        </div>
      </div>
    </div>
  );
}
