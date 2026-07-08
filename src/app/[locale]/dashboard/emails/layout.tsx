import React from 'react';
import { getTranslations } from 'next-intl/server';
import { getEmails } from '@/app/actions/emails';
import { Link } from '@/i18n/routing';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default async function EmailsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
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
    <div className="flex flex-col h-[calc(100vh-130px)] -mx-sm md:-mx-lg -mt-4 bg-canvas">
      {/* Encabezado */}
      <div className="px-sm md:px-lg py-4 border-b border-hairline shrink-0 flex justify-between items-center bg-canvas">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">{t('emails')}</h1>
        </div>
      </div>

      {/* Contenedor dividido */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Panel Izquierdo: Lista de correos */}
        <div className="w-full md:w-1/3 lg:w-[400px] border-r border-hairline overflow-y-auto bg-canvas shrink-0">
          {emails.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <span className="material-icons text-4xl mb-2 opacity-50">inbox</span>
              <p className="text-sm">{locale === 'es' ? 'No hay correos.' : 'No emails.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {emails.map((email: any) => (
                <Link 
                  href={`/dashboard/emails/${email.id}`} 
                  key={email.id}
                  className={`block p-4 hover:bg-canvas-elevated transition-colors ${email.status === 'UNREAD' ? 'bg-canvas-elevated/50 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold truncate text-sm flex-1 pr-2 ${email.status === 'UNREAD' ? 'text-ink' : 'text-body'}`}>
                      {email.from}
                    </span>
                    <span className="text-[10px] text-muted whitespace-nowrap shrink-0 mt-1">
                      {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {email.direction === 'OUTBOUND' && (
                      <span className="bg-primary/10 text-primary text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                        {locale === 'es' ? 'Enviado' : 'Sent'}
                      </span>
                    )}
                    <h3 className={`text-xs truncate ${email.status === 'UNREAD' ? 'font-bold text-ink' : 'text-muted'}`}>
                      {email.subject || '(Sin asunto)'}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho: Contenido (children) */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-canvas-elevated/10">
          {children}
        </div>
        
        {/* Mobile View: En móviles, si estamos en /[id], Next.js reemplazará toda la página por defecto si hacemos el ruteo correcto, 
            pero como el layout envuelve todo, en móviles se verá lista Y detalle a menos que lo manejemos por CSS.
            Dado que no podemos ocultar fácilmente el panel izquierdo solo por CSS sin saber la ruta exacta en Server Components,
            por ahora en pantallas md+ se verá dividido, y en móviles el panel derecho se esconde a menos que lo forcemos.
            Para una solución móvil real, Next.js 'Parallel Routes' o un Client Component es mejor. 
            Como ajuste rápido, usaremos CSS básico. */}
      </div>
    </div>
  );
}
