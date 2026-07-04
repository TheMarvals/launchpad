'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import enLocale from '@fullcalendar/core/locales/en-gb';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, shareEvent, unshareEvent } from '@/app/actions/productivity';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Swal from 'sweetalert2';
import { swalTheme } from '@/lib/swal-theme';
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
      color: e.color,
      isRecurring: e.isRecurring,
      isShared: e.isShared,
      sharedBy: e.sharedBy,
      shares: e.shares,
      recurrenceRule: e.recurrenceRule,
      recurrenceEnd: e.recurrenceEnd,
      originalEventId: e.originalEventId
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
      id: ev.extendedProps.originalEventId || ev.id, // Use original ID if it's an expanded recurring event
      title: ev.title,
      start: ev.start,
      end: ev.end || ev.start,
      allDay: ev.allDay,
      color: ev.backgroundColor,
      description: ev.extendedProps.description || '',
      isRecurring: ev.extendedProps.isRecurring,
      isShared: ev.extendedProps.isShared,
      sharedBy: ev.extendedProps.sharedBy,
      shares: ev.extendedProps.shares,
      recurrenceRule: ev.extendedProps.recurrenceRule,
      recurrenceEnd: ev.extendedProps.recurrenceEnd
    });
    setIsModalOpen(true);
  };

  const renderEventContent = (eventInfo: any) => {
    const { isShared, isRecurring } = eventInfo.event.extendedProps;
    return (
      <div className="flex items-center w-full overflow-hidden">
        {isShared && <span className="material-icons text-[10px] mr-[2px] opacity-70">people</span>}
        {isRecurring && <span className="material-icons text-[10px] mr-[2px] opacity-70">repeat</span>}
        <span className="truncate flex-1">{eventInfo.event.title}</span>
      </div>
    );
  };

  const handleSaveEvent = async (formData: any, editMode?: 'this' | 'all') => {
    try {
      if (selectedEvent?.id) {
        // Update
        const updated = await updateCalendarEvent(selectedEvent.id, formData, editMode);
        
        // We will just do a hard refresh of the page to get the newly expanded events
        // since calculating all the RRule expansions client-side is complex
        window.location.reload();
      } else {
        // Create
        const newEvent = await createCalendarEvent(formData);
        
        // If it's recurring, it's safer to just reload to get the server to expand it correctly
        if (formData.recurrenceRule) {
          window.location.reload();
        } else {
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
              color: newEvent.color,
              isRecurring: false,
              isShared: false,
              sharedBy: undefined,
              shares: [],
              recurrenceRule: null,
              recurrenceEnd: null,
              originalEventId: newEvent.id
            }
          }]);
        }
      }
    } catch (err) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('create.error') });
    }
  };

  const handleDeleteEvent = async (deleteMode?: 'this' | 'thisAndFuture' | 'all') => {
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
        await deleteCalendarEvent(selectedEvent.id, deleteMode, selectedEvent.start);
        
        if (selectedEvent.isRecurring) {
           window.location.reload(); // Reload for complex recurring deletions
        } else {
           setEvents(events.filter(e => e.id !== selectedEvent.id));
        }
        setIsModalOpen(false);
      } catch (err) {
        Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('delete.error') });
      }
    }
  };

  const handleShareEvent = async (email: string) => {
    if (!selectedEvent?.id) return;
    try {
      await shareEvent(selectedEvent.id, email);
      window.location.reload(); // Hard refresh to get updated shares
    } catch (err: any) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: err.message || t('share.shareError') });
    }
  };

  const handleUnshareEvent = async (userId: string) => {
    if (!selectedEvent?.id) return;
    try {
      await unshareEvent(selectedEvent.id, userId);
      window.location.reload();
    } catch (err: any) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: err.message || t('share.removeError') });
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

        @media (max-width: 767px) {
          .fc-toolbar.fc-header-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }
          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }
          .fc-button {
            padding: 0.7rem 0.75rem !important;
            font-size: 0.6rem !important;
          }
          .fc-toolbar-title {
            font-size: 1.1rem !important;
          }
          .fc-col-header-cell-cushion {
            padding: 0.5rem 0 !important;
            font-size: 0.55rem !important;
          }
          .fc-daygrid-day-number {
            font-size: 0.75rem !important;
            padding: 0.25rem !important;
          }
          .fc-event {
            font-size: 0.65rem !important;
            padding: 0.15rem 0.3rem !important;
          }
        }
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
        eventContent={renderEventContent}
        locale={locale === 'es' ? esLocale : enLocale}
        height="100%"
      />

      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onShare={handleShareEvent}
        onUnshare={handleUnshareEvent}
        title={selectedEvent?.id ? t('editEvent') : t('newEvent')}
        initialData={selectedEvent}
      />
    </div>
  );
}
