import React from 'react';
import { Link } from '@/i18n/routing';
import { getClientTickets } from '@/app/actions/tickets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';

export default async function TicketsPage() {
  const tickets = await getClientTickets();
  const t = await getTranslations('ClientPortal');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-semantic-success/10 text-semantic-success border-semantic-success/30';
      case 'IN_PROGRESS': return 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30';
      case 'CLOSED': return 'bg-canvas-elevated text-muted border-hairline';
      default: return 'bg-canvas-elevated text-muted border-hairline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return t('tickets.status.open');
      case 'IN_PROGRESS': return t('tickets.status.inProgress');
      case 'CLOSED': return t('tickets.status.closed');
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-muted';
      case 'MEDIUM': return 'text-semantic-info';
      case 'HIGH': return 'text-accent-yellow';
      case 'URGENT': return 'text-semantic-warning font-bold';
      default: return 'text-muted';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-md">
      <div className="flex justify-between items-center bg-canvas-elevated border border-hairline p-sm">
        <div>
          <h1 className="text-title-md font-medium text-ink tracking-tight">{t('tickets.pageTitle')}</h1>
          <p className="text-body text-muted mt-[2px]">{t('tickets.pageSubtitle')}</p>
        </div>
        <Link 
          href="/client-portal/tickets/new" 
          className="bg-primary text-on-primary px-sm py-xxs font-semibold transition-colors flex items-center text-xs uppercase tracking-wider"
        >
          <span className="material-icons text-[18px] mr-xxs">add</span>
          {t('tickets.newTicket')}
        </Link>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-xl px-sm">
            <div className="w-[72px] h-[72px] bg-canvas flex items-center justify-center mx-auto mb-xs">
              <span className="material-icons text-muted text-4xl">support_agent</span>
            </div>
            <h3 className="text-title-sm font-medium text-ink mb-[4px]">{t('tickets.emptyTitle')}</h3>
            <p className="text-sm text-muted mb-sm max-w-sm mx-auto leading-relaxed">{t('tickets.emptyMessage')}</p>
            <Link 
              href="/client-portal/tickets/new" 
              className="text-primary font-medium hover:text-primary/80 transition-colors text-sm"
            >
              {t('tickets.emptyAction')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('tickets.table.subject')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('tickets.table.status')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('tickets.table.priority')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('tickets.table.updated')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('tickets.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-canvas/80 transition-colors group">
                    <td className="px-sm py-xs">
                      <div className="flex flex-col">
                        <Link href={`/client-portal/tickets/${ticket.id}`} className="font-medium text-ink hover:text-primary transition-colors text-sm">
                          {ticket.subject}
                        </Link>
                        <span className="text-caption text-muted font-mono mt-[2px]">#{ticket.id.split('-')[0].toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-sm py-xs">
                      <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-sm py-xs">
                      <div className="flex items-center space-x-xxxs">
                        <span className="material-icons text-sm text-muted">flag</span>
                        <span className={`text-sm ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority === 'URGENT' ? t('tickets.priority.urgent') :
                           ticket.priority === 'HIGH' ? t('tickets.priority.high') :
                           ticket.priority === 'MEDIUM' ? t('tickets.priority.medium') :
                           t('tickets.priority.low')}
                        </span>
                      </div>
                    </td>
                    <td className="px-sm py-xs text-body text-muted">
                      {format(new Date(ticket.updatedAt), "d 'de' MMM, HH:mm", { locale: es })}
                    </td>
                    <td className="px-sm py-xs text-right">
                      <Link 
                        href={`/client-portal/tickets/${ticket.id}`}
                        className="inline-flex items-center justify-center p-xxs text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                      >
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
