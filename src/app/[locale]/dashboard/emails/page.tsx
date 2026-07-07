import React from 'react';
import { getTranslations } from 'next-intl/server';
import { getEmails } from '@/app/actions/emails';
import { Link } from '@/i18n/routing';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default async function EmailsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Navigation');
  
  const dateLocale = locale === 'es' ? es : enUS;

  let emails: any[] = [];
  try {
    emails = await getEmails();
  } catch (error) {
    console.error('Error fetching emails:', error);
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">{t('emails')}</h1>
          <p className="text-muted text-sm mt-1">
            {locale === 'es' ? 'Bandeja de entrada de correos entrantes' : 'Inbound emails inbox'}
          </p>
        </div>
      </div>

      <div className="bg-canvas border border-hairline rounded-sm overflow-hidden shadow-sm">
        {emails.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <span className="material-icons text-5xl mb-3 opacity-50">inbox</span>
            <p>{locale === 'es' ? 'No hay correos en la bandeja de entrada.' : 'No emails in the inbox.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {emails.map((email: any) => (
              <Link 
                href={`/dashboard/emails/${email.id}`} 
                key={email.id}
                className={`block p-4 hover:bg-canvas-elevated transition-colors ${email.status === 'UNREAD' ? 'bg-canvas-elevated/50 border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 md:gap-4">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold truncate ${email.status === 'UNREAD' ? 'text-ink' : 'text-body'}`}>
                        {email.from}
                      </span>
                      {email.direction === 'OUTBOUND' && (
                        <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">
                          {locale === 'es' ? 'Enviado' : 'Sent'}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm truncate ${email.status === 'UNREAD' ? 'font-bold text-ink' : 'text-muted'}`}>
                      {email.subject || '(Sin asunto)'}
                    </h3>
                  </div>
                  <div className="text-xs text-muted whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: dateLocale })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
