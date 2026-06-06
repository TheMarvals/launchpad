import React from 'react';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTicketDetails } from '@/app/actions/tickets';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import TicketReplyForm from '@/app/[locale]/client-portal/tickets/[id]/TicketReplyForm';
import AdminTicketStatus from './AdminTicketStatus';

export default async function AdminTicketDetailsPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const ticket = await getTicketDetails(id);
  const t = await getTranslations('Tickets');

  if (!ticket) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/30 px-xxs py-[2px] text-caption-uppercase font-semibold">{t('status.OPEN')}</span>;
      case 'IN_PROGRESS': return <span className="bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 px-xxs py-[2px] text-caption-uppercase font-semibold">{t('status.IN_PROGRESS')}</span>;
      case 'CLOSED': return <span className="bg-canvas-elevated text-muted border border-hairline px-xxs py-[2px] text-caption-uppercase font-semibold">{t('status.CLOSED')}</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority;
    const label = t(`detail.priority.${p}` as any);
    return (
      <span className={`text-sm flex items-center ${
        p === 'URGENT' ? 'text-semantic-warning font-bold' :
        p === 'HIGH' ? 'text-accent-yellow' :
        p === 'MEDIUM' ? 'text-semantic-info' :
        'text-muted'
      }`}>
        <span className="material-icons text-[16px] mr-xxs">flag</span>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-md font-sans">
      {/* Compact Header */}
      <div className="bg-canvas-elevated border border-hairline px-sm py-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-xxs">
          <div className="flex items-center gap-xxs min-w-0">
            <Link href="/dashboard/tickets" className="shrink-0 w-[28px] h-[28px] flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">
              <span className="material-icons text-[18px]">arrow_back</span>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-xxs">
                <h1 className="text-sm font-medium text-ink truncate">{ticket.subject}</h1>
                <span className="text-[10px] text-muted/40 font-mono shrink-0">#{ticket.id.split('-')[0].toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-xxs text-caption text-muted mt-[1px]">
                <span>{ticket.client.razonSocial}</span>
                <span className="text-muted/30">·</span>
                {getPriorityBadge(ticket.priority)}
                <span className="text-muted/30">·</span>
                {getStatusBadge(ticket.status)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-xxs ml-[34px] sm:ml-0">
            <AdminTicketStatus ticketId={ticket.id} currentStatus={ticket.status} />
          </div>
        </div>
        <div className="flex items-center gap-sm mt-xxs pt-xxs border-t border-hairline ml-[34px]">
          <div className="flex items-center gap-xxxs text-caption text-muted">
            <span className="material-icons text-[14px]">calendar_today</span>
            {format(new Date(ticket.createdAt), locale === 'es' ? "d 'de' MMM yyyy" : "MMM d, yyyy", { locale: locale === 'es' ? es : enUS })}
          </div>
          <div className="flex items-center gap-xxxs text-caption text-muted">
            <span className="material-icons text-[14px]">schedule</span>
            {format(new Date(ticket.updatedAt), "HH:mm", { locale: locale === 'es' ? es : enUS })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xs">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-xs">
          <div className="bg-canvas/50 border border-hairline">
            <div className="px-xs py-sm space-y-[5px]">
              {ticket.messages.map((msg, idx) => {
                const isAdmin = msg.user.role === 'ADMIN';
                const prevMsg = idx > 0 ? ticket.messages[idx - 1] : null;
                const sameSender = prevMsg?.user.role === msg.user.role;
                return (
                  <div key={msg.id} className={`flex items-end gap-[6px] ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    {/* Admin Avatar */}
                    {isAdmin ? (
                      <div className="w-[26px] shrink-0" />
                    ) : (
                      <div className={`shrink-0 transition-opacity duration-200 ${sameSender ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <div className="w-[26px] h-[26px] rounded-full bg-canvas-elevated border border-hairline flex items-center justify-center text-[10px] font-bold text-primary">
                          {msg.user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`relative max-w-[80%] md:max-w-[70%] ${
                      isAdmin 
                        ? 'rounded-l-lg rounded-br-lg bg-primary text-on-primary' 
                        : 'rounded-r-lg rounded-bl-lg bg-canvas-elevated border border-hairline'
                    } ${sameSender ? 'rounded-tl-lg rounded-tr-lg' : ''}`}>
                      {!sameSender && (
                        <div className={`px-xs pt-[6px] pb-0 ${isAdmin ? 'text-right' : ''}`}>
                          <span className={`text-[10px] font-semibold tracking-wide ${isAdmin ? 'text-on-primary/65' : 'text-primary'}`}>
                            {isAdmin ? 'Staff' : ticket.client.razonSocial}
                          </span>
                        </div>
                      )}
                      <div className={`px-xs ${sameSender ? 'pt-[7px]' : 'pt-[4px]'} pb-[2px]`}>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isAdmin ? 'text-on-primary/90' : 'text-body'}`}>
                          {msg.message}
                        </p>
                      </div>
                      <div className={`px-xs pb-[5px] flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] ${isAdmin ? 'text-on-primary/45' : 'text-muted/50'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: locale === 'es' ? es : enUS })}
                        </span>
                      </div>
                    </div>

                    {/* Client Avatar */}
                    {!isAdmin ? (
                      <div className="w-[26px] shrink-0" />
                    ) : (
                      <div className={`shrink-0 transition-opacity duration-200 ${sameSender ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <div className="w-[26px] h-[26px] rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                          {msg.user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reply Form */}
          <div className="bg-canvas-elevated border border-hairline p-xs">
            <div className="flex items-center gap-xxxs mb-xxs">
              <span className="material-icons text-[14px] text-muted">reply</span>
              <span className="text-[11px] font-medium text-muted">{t('detail.respond')}</span>
            </div>
            <TicketReplyForm ticketId={ticket.id} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div>
          <div className="bg-canvas-elevated border border-hairline p-sm">
            <h3 className="text-caption-uppercase text-muted font-semibold mb-xs">{t('detail.clientInfo')}</h3>
            <div className="space-y-xs">
              <div>
                <span className="block text-caption text-muted mb-[2px]">{t('detail.razonSocial')}</span>
                <span className="block text-sm font-medium text-ink">{ticket.client.razonSocial}</span>
              </div>
              <div>
                <span className="block text-caption text-muted mb-[2px]">{t('detail.rut')}</span>
                <span className="block text-sm font-medium text-ink">{ticket.client.rut}</span>
              </div>
              <div>
                <span className="block text-caption text-muted mb-[2px]">{t('detail.email')}</span>
                <span className="block text-sm font-medium text-primary">{ticket.client.email || t('detail.notRegistered')}</span>
              </div>
              <div className="pt-xs border-t border-hairline">
                <Link href={`/dashboard/clients/${ticket.clientId}`} className="text-sm font-medium text-muted hover:text-ink flex items-center transition-colors">
                  {t('detail.viewProfile')}
                  <span className="material-icons text-[16px] ml-[2px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
