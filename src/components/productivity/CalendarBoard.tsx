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
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas'
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
    <div className="bg-canvas-elevated p-sm border border-hairline overflow-hidden h-[calc(100vh-250px)]">
      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc-toolbar-title { font-weight: 500 !important; color: var(--color-ink) !important; font-size: 1.5rem !important; text-transform: uppercase !important; font-family: 'Outfit', sans-serif !important; }
        .fc-button { background-color: transparent !important; border: 1px solid var(--color-hairline) !important; color: var(--color-muted) !important; font-weight: 700 !important; padding: 0.75rem 1.25rem !important; border-radius: 0 !important; transition: all 0.2s !important; text-transform: uppercase !important; font-size: 0.75rem !important; letter-spacing: 0.05em !important; }
        .fc-button:hover { background-color: var(--color-ink) !important; opacity: 0.8 !important; }
        .fc-button-active { background-color: var(--color-ink) !important; opacity: 0.8 !important; border-color: var(--color-ink) !important; }
        .fc-daygrid-day { transition: background-color 0.1s; border-color: var(--color-hairline) !important; }
        .fc-daygrid-day:hover { background-color: rgba(255,255,255,0.03); cursor: pointer; }
        .fc-event { border-radius: 0 !important; padding: 0.25rem 0.5rem !important; font-weight: 600 !important; font-size: 0.8rem !important; border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: none !important; }
        .fc-col-header-cell-cushion { color: var(--color-muted) !important; text-transform: uppercase !important; font-size: 0.7rem !important; letter-spacing: 0.1em !important; font-weight: 700 !important; padding: 1rem 0 !important; }
        .fc-day-today { background-color: rgba(218, 41, 28, 0.08) !important; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: var(--color-hairline) !important; }
        .fc-theme-standard .fc-scrollgrid { border-color: var(--color-hairline) !important; }
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
