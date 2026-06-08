import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import EmptyState from '@/components/EmptyState';

export default async function ClientQuotesPage() {
  const session = await auth();
  const clientId = (session?.user as any)?.clientId;
  const t = await getTranslations('ClientPortal');

  if (!clientId) return null;

  const quotes = await prisma.quote.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-md">
      <div>
        <h1 className="text-title-md font-medium text-ink tracking-tight">{t('quotes.pageTitle')}</h1>
        <p className="text-body text-muted mt-[2px]">{t('quotes.pageSubtitle')}</p>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {quotes.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-caption-uppercase text-muted font-semibold border-b border-hairline bg-canvas">
                <th className="px-sm py-xs">{t('quotes.table.number')}</th>
                <th className="px-sm py-xs">{t('quotes.table.date')}</th>
                <th className="px-sm py-xs">{t('quotes.table.status')}</th>
                <th className="px-sm py-xs text-right">{t('quotes.table.netAmount')}</th>
                <th className="px-sm py-xs text-right">{t('quotes.table.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {quotes.map((quote) => (
                <tr key={quote.id} className="text-sm hover:bg-canvas/80 transition-colors">
                  <td className="px-sm py-xs font-medium text-ink">COT-{quote.correlativo.toString().padStart(4, '0')}</td>
                  <td className="px-sm py-xs text-muted">{new Date(quote.fechaEmision).toLocaleDateString()}</td>
                  <td className="px-sm py-xs">
                    <span className={`px-xxs py-[2px] text-caption-uppercase font-semibold border ${
                      quote.estado === 'Aceptada' ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/30' :
                      quote.estado === 'Rechazada' ? 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/30' :
                      'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30'
                    }`}>
                      {quote.estado}
                    </span>
                  </td>
                  <td className="px-sm py-xs text-right font-mono font-medium text-ink">
                    ${quote.montoNeto.toLocaleString('es-CL')}
                  </td>
                  <td className="px-sm py-xs text-right">
                    <a 
                      href={`/api/quotes/${quote.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors bg-primary/10 px-xxs py-[4px] text-caption-uppercase font-semibold"
                    >
                      <span className="material-icons text-[16px] mr-[2px]">picture_as_pdf</span> {t('quotes.pdf')}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
              variant="document"
              message={t('quotes.empty')}
            />
        )}
      </div>
    </div>
  );
}
