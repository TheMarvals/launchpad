'use client';

import React, { useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { formatDistanceToNow } from 'date-fns';

type EmailSidebarProps = {
  initialEmails: any[];
  locale: string;
  dateLocale: any;
};

export default function EmailSidebar({ initialEmails, locale, dateLocale }: EmailSidebarProps) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const pathname = usePathname(); // e.g. /dashboard/emails or /dashboard/emails/123

  // Filter emails based on the active tab
  const filteredEmails = initialEmails.filter((email) => {
    if (activeTab === 'inbox') return email.direction === 'INBOUND';
    if (activeTab === 'sent') return email.direction === 'OUTBOUND';
    return true;
  });

  return (
    <div className="w-full md:w-1/3 lg:w-[400px] border-r border-hairline overflow-y-auto bg-canvas shrink-0 flex flex-col h-full">
      {/* Tabs Header */}
      <div className="flex border-b border-hairline shrink-0 bg-canvas">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'inbox' 
              ? 'border-b-2 border-primary text-primary' 
              : 'border-b-2 border-transparent text-muted hover:text-ink'
          }`}
        >
          {locale === 'es' ? 'Inbox' : 'Inbox'}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'sent' 
              ? 'border-b-2 border-primary text-primary' 
              : 'border-b-2 border-transparent text-muted hover:text-ink'
          }`}
        >
          {locale === 'es' ? 'Enviados' : 'Sent'}
        </button>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <span className="material-icons text-4xl mb-2 opacity-50">
              {activeTab === 'inbox' ? 'inbox' : 'send'}
            </span>
            <p className="text-sm">
              {locale === 'es' 
                ? (activeTab === 'inbox' ? 'No hay correos en tu bandeja de entrada.' : 'No has enviado correos.') 
                : (activeTab === 'inbox' ? 'No emails in your inbox.' : 'No sent emails.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {filteredEmails.map((email: any) => {
              const isActive = pathname === `/dashboard/emails/${email.id}`;
              
              return (
                <Link 
                  href={`/dashboard/emails/${email.id}`} 
                  key={email.id}
                  className={`block p-4 transition-colors ${
                    isActive 
                      ? 'bg-canvas-elevated border-l-4 border-l-primary' 
                      : email.status === 'UNREAD' && activeTab === 'inbox'
                        ? 'bg-canvas-elevated/30 border-l-4 border-l-primary/50 hover:bg-canvas-elevated'
                        : 'border-l-4 border-l-transparent hover:bg-canvas-elevated'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className={`font-semibold truncate text-sm flex-1 ${email.status === 'UNREAD' && activeTab === 'inbox' ? 'text-ink' : 'text-body'}`}>
                      {activeTab === 'inbox' ? email.from : `Para: ${email.to}`}
                    </span>
                    <span className="text-[10px] text-muted whitespace-nowrap shrink-0 mt-1">
                      {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs truncate ${email.status === 'UNREAD' && activeTab === 'inbox' ? 'font-bold text-ink' : 'text-muted'}`}>
                      {email.subject || '(Sin asunto)'}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
