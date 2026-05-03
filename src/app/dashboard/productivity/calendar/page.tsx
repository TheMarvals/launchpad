import { getCalendarEvents } from '@/app/actions/productivity';
import CalendarBoard from '@/components/productivity/CalendarBoard';

export default async function CalendarPage() {
  const events = await getCalendarEvents();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#0a041a]">Calendario</h1>
        <p className="text-gray-400 font-medium mt-1">Gestiona tus citas, hitos de proyectos y recordatorios locales.</p>
      </div>
      <CalendarBoard initialEvents={events} />
    </div>
  );
}
