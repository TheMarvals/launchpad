import { getCalendarEvent } from '@/app/actions/productivity';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const event = await getCalendarEvent(id);
  const t = await getTranslations('Calendar');

  if (!event) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-md max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-xs">
        <Link
          href="/dashboard/productivity/calendar"
          className="w-[40px] h-[40px] bg-canvas-elevated border border-hairline flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors"
        >
          <span className="material-icons">arrow_back</span>
        </Link>
        <div className="flex items-center space-x-xxs">
          <div className="w-[12px] h-[12px]" style={{ backgroundColor: event.color || '#3b82f6' }} />
          <h1 className="text-title-md font-medium text-ink tracking-tight">{event.title}</h1>
        </div>
      </div>

      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">{t('form.start')}</p>
            <p className="font-semibold text-ink">
              {formatDate(event.start)}
            </p>
            <p className="text-sm text-muted">
              {event.allDay ? t('form.allDay') : formatTime(event.start)}
            </p>
          </div>
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">{t('form.end')}</p>
            <p className="font-semibold text-ink">
              {formatDate(event.end)}
            </p>
            <p className="text-sm text-muted">
              {event.allDay ? t('form.allDay') : formatTime(event.end)}
            </p>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="pt-sm border-t border-hairline">
            <p className="text-caption-uppercase text-muted font-semibold mb-xxs">{t('form.description')}</p>
            <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Meta */}
        <div className="pt-sm border-t border-hairline grid grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">{t('form.color')}</p>
            <div className="flex items-center gap-xxs">
              <div className="w-[16px] h-[16px]" style={{ backgroundColor: event.color || '#3b82f6' }} />
              <span className="text-sm text-ink font-mono">{event.color || '#3b82f6'}</span>
            </div>
          </div>
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">ID</p>
            <p className="font-mono text-xs text-muted">{event.id.split('-')[0]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
