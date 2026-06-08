'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { triggerRemindersNotification } from '@/app/actions/reminders';
import Swal from 'sweetalert2';
import EmptyState from '@/components/EmptyState';

interface RemindersBoardProps {
  tasks: any[];
  events: any[];
  vpsExpirations: any[];
  openTickets: any[];
  expiringQuotes: any[];
  failedActions: any[];
}

const SECTION_CONFIG = [
  {
    key: 'vps',
    icon: 'dns',
    color: 'text-accent-yellow',
    bgColor: 'bg-accent-yellow/10',
    borderColor: 'border-accent-yellow/30',
  },
  {
    key: 'tasks',
    icon: 'task_alt',
    color: 'text-semantic-info',
    bgColor: 'bg-semantic-info/10',
    borderColor: 'border-semantic-info/30',
  },
  {
    key: 'events',
    icon: 'event',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/10',
    borderColor: 'border-semantic-success/30',
  },
  {
    key: 'tickets',
    icon: 'confirmation_number',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  {
    key: 'quotes',
    icon: 'description',
    color: 'text-accent-yellow',
    bgColor: 'bg-accent-yellow/10',
    borderColor: 'border-accent-yellow/30',
  },
  {
    key: 'audit',
    icon: 'error_outline',
    color: 'text-semantic-warning',
    bgColor: 'bg-semantic-warning/10',
    borderColor: 'border-semantic-warning/30',
  },
];

export default function RemindersBoard({ tasks, events, vpsExpirations, openTickets, expiringQuotes, failedActions }: RemindersBoardProps) {
  const t = useTranslations('Reminders');
  const locale = useLocale();
  const [isNotifying, setIsNotifying] = useState(false);

  const sections = [
    { items: vpsExpirations, ...SECTION_CONFIG[0] },
    { items: tasks, ...SECTION_CONFIG[1] },
    { items: events, ...SECTION_CONFIG[2] },
    { items: openTickets, ...SECTION_CONFIG[3] },
    { items: expiringQuotes, ...SECTION_CONFIG[4] },
    { items: failedActions, ...SECTION_CONFIG[5] },
  ];

  const hasAnyItems = sections.some(s => s.items.length > 0);

  const handleNotify = async () => {
    setIsNotifying(true);
    try {
      const result = await triggerRemindersNotification(locale);
      
      if (result.success) {
        let msg = 'Notificaciones enviadas exitosamente.';
        if (result.results?.email && result.results?.telegram) {
          msg = 'Resumen enviado a Email y Telegram.';
        } else if (result.results?.email) {
          msg = 'Resumen enviado a Email.';
        } else if (result.results?.telegram) {
          msg = 'Resumen enviado a Telegram.';
        }
        Swal.fire({
          title: 'OK',
          text: msg,
          icon: 'success',
          customClass: {
            popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
            confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
          }
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: result.error || 'No se pudo enviar la notificación',
          icon: 'error',
          customClass: {
            popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
            confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
          }
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error inesperado',
        icon: 'error',
        customClass: {
          popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
          confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        }
      });
    } finally {
      setIsNotifying(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('tomorrow');
    if (diffDays > 1 && diffDays <= 7) return t('daysLeft', { days: diffDays });
    
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  const renderSectionItems = (section: typeof sections[0]) => {
    if (section.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-md px-xxs text-center">
          <span className="material-icons text-muted/30 text-2xl mb-xxs">check_circle</span>
          <p className="text-xs text-muted/60">{section.key === 'audit' ? 'Sin fallos recientes' : t('noReminders')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-[2px]">
        {section.items.slice(0, 4).map((item: any) => {
          if (section.key === 'vps') {
            return (
              <Link key={item.id} href={`/dashboard/clients/${item.clientId}`} className="flex items-center gap-xxs p-xxs bg-canvas border border-hairline hover:border-primary/30 transition-all group cursor-pointer">
                <div className={`w-[6px] h-[6px] shrink-0 ${section.color === 'text-accent-yellow' ? 'bg-accent-yellow' : section.color === 'text-semantic-info' ? 'bg-semantic-info' : section.color === 'text-semantic-success' ? 'bg-semantic-success' : section.color === 'text-primary' ? 'bg-primary' : 'bg-semantic-warning'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-xxs">
                    <span className="text-xs font-medium text-ink truncate">{item.name}</span>
                    <span className="text-[10px] font-semibold text-accent-yellow whitespace-nowrap shrink-0">{formatDate(item.dueDate)}</span>
                  </div>
                  <span className="text-[10px] text-muted">{item.client.razonSocial}</span>
                </div>
                <span className="material-icons text-[14px] text-muted/30 group-hover:text-muted/60 transition-colors shrink-0">chevron_right</span>
              </Link>
            );
          }
          if (section.key === 'tasks') {
            return (
              <Link key={item.id} href={`/dashboard/productivity/tasks/${item.id}`} className="flex items-center gap-xxs p-xxs bg-canvas border border-hairline hover:border-primary/30 transition-all group cursor-pointer">
                <div className={`w-[6px] h-[6px] shrink-0 ${item.priority === 'urgent' || item.priority === 'high' ? 'bg-semantic-warning' : 'bg-muted/50'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-xxs">
                    <span className="text-xs font-medium text-ink truncate">{item.title}</span>
                    <span className="text-[10px] font-semibold text-muted whitespace-nowrap shrink-0">{item.dueDate ? formatDate(item.dueDate) : ''}</span>
                  </div>
                  {item.notes && <span className="text-[10px] text-muted line-clamp-1">{item.notes}</span>}
                </div>
                <span className="material-icons text-[14px] text-muted/30 group-hover:text-muted/60 transition-colors shrink-0">chevron_right</span>
              </Link>
            );
          }
          if (section.key === 'events') {
            return (
              <Link key={item.id} href={`/dashboard/productivity/calendar/${item.id}`} className="flex items-center gap-xxs p-xxs bg-canvas border border-hairline hover:border-primary/30 transition-all group cursor-pointer">
                <div className="w-[6px] h-[6px] shrink-0 bg-semantic-success" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-xxs">
                    <span className="text-xs font-medium text-ink truncate">{item.title}</span>
                    <span className="text-[10px] font-semibold text-semantic-success whitespace-nowrap shrink-0">{formatDate(item.start)}</span>
                  </div>
                  <span className="text-[10px] text-muted">
                    {new Date(item.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="material-icons text-[14px] text-muted/30 group-hover:text-muted/60 transition-colors shrink-0">chevron_right</span>
              </Link>
            );
          }
          if (section.key === 'tickets') {
            return (
              <Link key={item.id} href={`/dashboard/tickets/${item.id}`} className="flex items-center gap-xxs p-xxs bg-canvas border border-hairline hover:border-primary/30 transition-all group cursor-pointer">
                <div className={`w-[6px] h-[6px] shrink-0 ${item.status === 'OPEN' ? 'bg-semantic-warning' : 'bg-muted/50'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-xxs">
                    <span className="text-xs font-medium text-ink truncate">{item.subject}</span>
                    <span className={`text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                      item.status === 'OPEN' ? 'text-semantic-warning' : 'text-muted'
                    }`}>{item.status}</span>
                  </div>
                  <span className="text-[10px] text-muted">{item.client.razonSocial}</span>
                </div>
                <span className="material-icons text-[14px] text-muted/30 group-hover:text-muted/60 transition-colors shrink-0">chevron_right</span>
              </Link>
            );
          }
          if (section.key === 'quotes') {
            return (
              <Link key={item.id} href={`/dashboard/quotes/edit/${item.id}`} className="flex items-center gap-xxs p-xxs bg-canvas border border-hairline hover:border-primary/30 transition-all group cursor-pointer">
                <div className="w-[6px] h-[6px] shrink-0 bg-accent-yellow" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-xxs">
                    <span className="text-xs font-medium text-ink truncate">#{item.correlativo}</span>
                    <span className="text-[10px] font-semibold text-accent-yellow whitespace-nowrap shrink-0">{new Date(item.fechaValidez).toLocaleDateString(locale)}</span>
                  </div>
                  <span className="text-[10px] text-muted">{item.client.razonSocial}</span>
                </div>
                <span className="material-icons text-[14px] text-muted/30 group-hover:text-muted/60 transition-colors shrink-0">chevron_right</span>
              </Link>
            );
          }
          if (section.key === 'audit') {
            return (
              <Link key={item.id} href="/dashboard/logs" className="flex items-center gap-xxs p-xxs bg-canvas border border-hairline hover:border-primary/30 transition-all group cursor-pointer">
                <div className="w-[6px] h-[6px] shrink-0 bg-semantic-warning" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-xxs">
                    <span className="text-xs font-medium text-ink truncate">{item.server.name}</span>
                    <span className="text-[10px] font-semibold text-semantic-warning whitespace-nowrap shrink-0">{item.action.toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] text-muted">{item.user.name}</span>
                </div>
                <span className="material-icons text-[14px] text-muted/30 group-hover:text-muted/60 transition-colors shrink-0">chevron_right</span>
              </Link>
            );
          }
          return null;
        })}
        {section.items.length > 4 && (
          <p className="text-[10px] text-muted/50 text-center pt-[2px]">+{section.items.length - 4} más</p>
        )}
      </div>
    );
  };

  const getSectionTitle = (key: string) => {
    switch (key) {
      case 'vps': return t('vps');
      case 'tasks': return t('tasks');
      case 'events': return t('events');
      case 'tickets': return t('tickets');
      case 'quotes': return t('quotes');
      case 'audit': return t('audit');
      default: return key;
    }
  };

  return (
    <div className="space-y-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
        <div>
          <h1 className="text-display-sm font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted text-sm mt-[2px]">{t('subtitle')}</p>
        </div>
        {hasAnyItems && (
          <button
            onClick={handleNotify}
            disabled={isNotifying}
            className="bg-primary text-on-primary px-sm h-[40px] font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center disabled:opacity-50 gap-xxs"
          >
            <span className="material-icons text-sm">notifications_active</span>
            {isNotifying ? t('sending') : t('sendNotifications')}
          </button>
        )}
      </div>

      {!hasAnyItems ? (
        <div className="bg-canvas-elevated border border-hairline">
        <EmptyState variant="check" title={t('empty')} />
      </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm">
          {sections.map((section) => (
            <div key={section.key} className="bg-canvas-elevated border border-hairline">
              {/* Section Header */}
              <div className="flex items-center gap-xxs p-xxs border-b border-hairline bg-canvas">
                <div className={`w-[32px] h-[32px] ${section.bgColor} flex items-center justify-center`}>
                  <span className={`material-icons text-sm ${section.color}`}>{section.icon}</span>
                </div>
                <span className="text-xs font-semibold text-ink uppercase tracking-wider flex-1 truncate">{getSectionTitle(section.key)}</span>
                {section.items.length > 0 && (
                  <span className="text-[10px] font-semibold text-muted bg-canvas-elevated px-xxs py-[1px]">
                    {section.items.length}
                  </span>
                )}
              </div>
              {/* Section Content */}
              <div className="p-xxs">
                {renderSectionItems(section)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
