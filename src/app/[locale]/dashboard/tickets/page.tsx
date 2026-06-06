import React from 'react';
import { Link } from '@/i18n/routing';
import { getAllTickets } from '@/app/actions/tickets';
import { getTranslations } from 'next-intl/server';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default async function AdminTicketsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Tickets');
  const tickets = await getAllTickets();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/30';
      case 'IN_PROGRESS': return 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30';
      case 'CLOSED': return 'bg-canvas-elevated text-muted border-hairline';
      default: return 'bg-canvas-elevated text-muted border-hairline';
    }
  };

  const getStatusText = (status: string) => {
    return t(`status.${status}` as any);
  };

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
        </div>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-xl px-sm">
            <div className="w-[72px] h-[72px] bg-canvas flex items-center justify-center mx-auto mb-xs">
              <span className="material-icons text-muted text-4xl">inbox</span>
            </div>
            <h3 className="text-title-sm font-medium text-ink mb-[4px]">{t('emptyTitle')}</h3>
            <p className="text-sm text-muted mb-sm max-w-sm mx-auto leading-relaxed">{t('emptyMessage')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.client')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.subject')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.status')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.updated')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-canvas/80 transition-colors group">
                    <td className="px-sm py-xs font-medium text-ink text-sm">
                      {ticket.client.razonSocial}
                    </td>
                    <td className="px-sm py-xs">
                      <div className="flex flex-col">
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="font-medium text-ink hover:text-primary transition-colors text-sm">
                          {ticket.subject}
                        </Link>
                        <span className="text-caption text-muted font-mono mt-[2px]">{t('table.id')}: {ticket.id.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-sm py-xs">
                      <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-sm py-xs text-body text-muted">
                      {format(new Date(ticket.updatedAt), locale === 'es' ? "d 'de' MMM, HH:mm" : "MMM d, HH:mm", { 
                        locale: locale === 'es' ? es : enUS 
                      })}
                    </td>
                    <td className="px-sm py-xs text-right">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="inline-flex items-center justify-center p-xxs text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100">
                        <span className="material-icons text-[20px]">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
