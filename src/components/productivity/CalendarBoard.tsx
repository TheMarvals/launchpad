'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import enLocale from '@fullcalendar/core/locales/en-gb';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/actions/productivity';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Swal from 'sweetalert2';
import EventModal from './EventModal';

export default function CalendarBoard({ initialEvents }: { initialEvents: any[] }) {
  const t = useTranslations('Calendar');
  const locale = useLocale();
  const [events, setEvents] = useState(initialEvents.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    allDay: e.allDay,
    backgroundColor: e.color || '#3b82f6',
    borderColor: 'transparent',
    extendedProps: {
      description: e.description,
      color: e.color
    }
  })));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleDateSelect = (selectInfo: any) => {
    setSelectedEvent({
      title: '',
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay,
      color: '#3b82f6',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const ev = clickInfo.event;
    setSelectedEvent({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end || ev.start,
      allDay: ev.allDay,
      color: ev.backgroundColor,
      description: ev.extendedProps.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (formData: any) => {
    try {
      if (selectedEvent?.id) {
        // Update
        const updated = await updateCalendarEvent(selectedEvent.id, formData);
        setEvents(events.map(e => e.id === selectedEvent.id ? {
          id: updated.id,
          title: updated.title,
          start: updated.start.toISOString(),
          end: updated.end.toISOString(),
          allDay: updated.allDay,
          backgroundColor: updated.color,
          borderColor: 'transparent',
          extendedProps: {
            description: updated.description,
            color: updated.color
          }
        } : e));
      } else {
        // Create
        const newEvent = await createCalendarEvent(formData);
        setEvents([...events, {
          id: newEvent.id,
          title: newEvent.title,
          start: newEvent.start.toISOString(),
          end: newEvent.end.toISOString(),
          allDay: newEvent.allDay,
          backgroundColor: newEvent.color,
          borderColor: 'transparent',
          extendedProps: {
            description: newEvent.description,
            color: newEvent.color
          }
        }]);
      }
    } catch (err) {
      Swal.fire('Error', t('create.error'), 'error');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;
    
    const result = await Swal.fire({
      title: t('delete.title'),
      text: t('delete.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f3f4f6',
      confirmButtonText: t('delete.confirm'),
      cancelButtonText: t('delete.cancel'),
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold text-gray-400'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteCalendarEvent(selectedEvent.id);
        setEvents(events.filter(e => e.id !== selectedEvent.id));
        setIsModalOpen(false);
      } catch (err) {
        Swal.fire('Error', t('delete.error'), 'error');
      }
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-gray-100 border border-gray-50 overflow-hidden h-[calc(100vh-250px)]">
      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc-toolbar-title { font-weight: 900 !important; color: #0a041a !important; font-size: 1.5rem !important; }
        .fc-button { background-color: #f9fafb !important; border: none !important; color: #9ca3af !important; font-weight: 700 !important; padding: 0.75rem 1.25rem !important; border-radius: 1rem !important; transition: all 0.2s !important; }
        .fc-button:hover { background-color: #0a041a !important; color: white !important; }
        .fc-button-active { background-color: #0a041a !important; color: white !important; }
        .fc-daygrid-day { transition: background-color 0.1s; }
        .fc-daygrid-day:hover { background-color: #f9fafb; cursor: pointer; }
        .fc-event { border-radius: 0.5rem !important; padding: 0.25rem 0.5rem !important; font-weight: 600 !important; font-size: 0.8rem !important; border: none !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; }
        .fc-col-header-cell-cushion { color: #9ca3af !important; text-transform: uppercase !important; font-size: 0.7rem !important; letter-spacing: 0.1em !important; font-weight: 900 !important; padding: 1rem 0 !important; }
        .fc-day-today { background-color: #f8fafc !important; }
      `}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        locale={locale === 'es' ? esLocale : enLocale}
        height="100%"
      />

      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        title={selectedEvent?.id ? t('editEvent') : t('newEvent')}
        initialData={selectedEvent}
      />
    </div>
  );
}
