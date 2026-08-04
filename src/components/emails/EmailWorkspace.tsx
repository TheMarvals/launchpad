'use client';

import type { EmailMessage } from '@prisma/client';
import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/routing';
import EmailSidebar from '@/components/emails/EmailSidebar';

interface EmailWorkspaceProps {
  children: ReactNode;
  emails: EmailMessage[];
  locale: string;
}

export default function EmailWorkspace({ children, emails, locale }: EmailWorkspaceProps) {
  const pathname = usePathname();
  const isDetailView = /\/dashboard\/emails\/[^/]+\/?$/.test(pathname);

  return (
    <div className="flex flex-1 overflow-hidden">
      <EmailSidebar
        initialEmails={emails}
        locale={locale}
        mobileHidden={isDetailView}
      />

      <div className={`${isDetailView ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 flex-col overflow-hidden bg-canvas-elevated/10`}>
        {children}
      </div>
    </div>
  );
}
