import { getTranslations } from 'next-intl/server';
import { getCalendarEvents } from '@/app/actions/productivity';
import CalendarBoard from '@/components/productivity/CalendarBoard';

export default async function CalendarPage() {
  const t = await getTranslations('Calendar');
  const events = await getCalendarEvents();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-full">
      <div className="mb-8">
        <h1 className="text-title-lg font-outfit uppercase font-medium text-white">{t('title')}</h1>
        <p className="text-body text-muted mt-1">{t('subtitle')}</p>
      </div>
      <CalendarBoard initialEvents={events} />
    </div>
  );
}
