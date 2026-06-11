import React from 'react';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTicketDetails } from '@/app/actions/tickets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import TicketReplyForm from './TicketReplyForm';
import TicketStatusManager from './TicketStatusManager';

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getTicketDetails(id);
  const t = await getTranslations('ClientPortal');

  if (!ticket) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="bg-semantic-success/10 text-semantic-success border border-semantic-success/30 px-xxs py-[2px] text-caption-uppercase font-semibold">{t('tickets.status.open')}</span>;
      case 'IN_PROGRESS': return <span className="bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 px-xxs py-[2px] text-caption-uppercase font-semibold">{t('tickets.status.inProgress')}</span>;
      case 'CLOSED': return <span className="bg-canvas-elevated text-muted border border-hairline px-xxs py-[2px] text-caption-uppercase font-semibold">{t('tickets.status.closed')}</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority;
    return (
      <span className={`text-sm flex items-center ${
        p === 'URGENT' ? 'text-semantic-warning font-bold' :
        p === 'HIGH' ? 'text-accent-yellow' :
        p === 'MEDIUM' ? 'text-semantic-info' :
        'text-muted'
      }`}>
        <span className="material-icons text-[16px] mr-xxs">flag</span>
        {p === 'URGENT' ? t('tickets.priority.urgent') :
         p === 'HIGH' ? t('tickets.priority.high') :
         p === 'MEDIUM' ? t('tickets.priority.medium') :
         t('tickets.priority.low')}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Compact Header */}
      <div className="bg-canvas-elevated border border-hairline px-sm py-xs mb-sm">
        <div className="flex items-center gap-xxs">
          <Link href="/client-portal/tickets" className="shrink-0 w-[40px] h-[40px] flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">
            <span className="material-icons text-[18px]">arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-xxs">
              <h1 className="text-sm font-medium text-ink truncate">{ticket.subject}</h1>
              <span className="text-[10px] text-muted/40 font-mono shrink-0">#{ticket.id.split('-')[0].toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-xxs shrink-0">
            {getPriorityBadge(ticket.priority)}
            {getStatusBadge(ticket.status)}
          </div>
          {ticket.status !== 'CLOSED' && (
            <TicketStatusManager ticketId={ticket.id} currentStatus={ticket.status} role="CLIENT" />
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-canvas-elevated/50 rounded-2xl border border-hairline mb-sm p-sm md:p-md">
        <div className="space-y-md">
          {ticket.messages.map((msg, idx) => {
            const isAdmin = msg.user.role === 'ADMIN';
            
            return (
              <div key={msg.id} className="flex gap-sm group">
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {isAdmin ? (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold shadow-sm" title={t('tickets.statusManager.supportTeam')}>
                      {msg.user.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-canvas-elevated flex items-center justify-center border border-hairline text-ink font-bold shadow-sm" title={t('tickets.detail.you')}>
                      {msg.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className={`flex-1 ${isAdmin ? 'bg-primary/5 border-primary/20' : 'bg-canvas-elevated border-hairline'} border rounded-2xl ${isAdmin ? 'rounded-tl-sm' : 'rounded-tl-sm'} p-sm shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex flex-wrap justify-between items-center mb-xs gap-2">
                    <div className="flex items-center gap-xxs">
                      <span className="text-sm font-semibold text-ink">
                        {isAdmin ? t('tickets.statusManager.supportTeam') : t('tickets.detail.you')}
                      </span>
                      {isAdmin && (
                        <span className="bg-primary/10 text-primary px-xxs py-[2px] rounded-md text-[10px] font-bold uppercase tracking-wider">
                          Staff
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted/70 group-hover:text-muted transition-colors">
                      {format(new Date(msg.createdAt), locale === 'es' ? "d 'de' MMM, HH:mm" : "MMM d, HH:mm", { locale: locale === 'es' ? es : enUS })}
                    </span>
                  </div>
                  <p className="text-sm text-body leading-relaxed whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply Section */}
      {ticket.status !== 'CLOSED' ? (
        <div className="bg-canvas-elevated border border-hairline p-xs">
          <div className="flex items-center gap-xxxs mb-xxs">
            <span className="material-icons text-[14px] text-muted">reply</span>
            <span className="text-[11px] font-medium text-muted">{t('tickets.detail.you')}</span>
          </div>
          <TicketReplyForm ticketId={ticket.id} />
        </div>
      ) : (
        <div className="bg-canvas/80 border border-hairline p-sm">
          <div className="flex items-center gap-xxs mb-xxs">
            <div className="w-[36px] h-[36px] bg-canvas-elevated flex items-center justify-center shrink-0">
              <span className="material-icons text-muted text-lg">lock</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">{t('tickets.detail.closedMessage')}</p>
          </div>
          <div className="pl-[44px]">
            <TicketReplyForm ticketId={ticket.id} buttonText={t('tickets.detail.reopenButton')} />
          </div>
        </div>
      )}
    </div>
  );
}
