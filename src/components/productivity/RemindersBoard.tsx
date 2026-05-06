'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { triggerRemindersNotification } from '@/app/actions/reminders';
import Swal from 'sweetalert2';

interface RemindersBoardProps {
  tasks: any[];
  events: any[];
  vpsExpirations: any[];
}

export default function RemindersBoard({ tasks, events, vpsExpirations }: RemindersBoardProps) {
  const t = useTranslations('Reminders');
  const locale = useLocale();
  const [isNotifying, setIsNotifying] = useState(false);

  const isEmpty = tasks.length === 0 && events.length === 0 && vpsExpirations.length === 0;

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
        Swal.fire('OK', msg, 'success');
      } else {
        Swal.fire('Error', result.error || 'No se pudo enviar la notificación', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Ocurrió un error inesperado', 'error');
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0a041a] tracking-tight">{t('title')}</h1>
          <p className="text-gray-500 mt-2 font-medium">{t('subtitle')}</p>
        </div>
        {!isEmpty && (
          <button
            onClick={handleNotify}
            disabled={isNotifying}
            className="bg-[#0088cc] text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-[#0088cc]/20 transition-all flex items-center disabled:opacity-50"
          >
            <span className="material-icons mr-2">notifications_active</span>
            {isNotifying ? '...' : 'Enviar Notificaciones'}
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-icons text-green-500 text-4xl">check_circle</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('empty')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* VPS Expirations */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                <span className="material-icons text-xl">dns</span>
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('vps')}</h2>
            </div>
            <div className="space-y-3">
              {vpsExpirations.length > 0 ? vpsExpirations.map((vps) => (
                <div key={vps.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                      {formatDate(vps.dueDate)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{vps.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{t('client')}: {vps.client.razonSocial}</p>
                </div>
              )) : (
                <p className="text-sm text-gray-400 px-2 italic">{t('noReminders')}</p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                <span className="material-icons text-xl">task_alt</span>
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('tasks')}</h2>
            </div>
            <div className="space-y-3">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                      {formatDate(task.dueDate)}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                  </div>
                  <h3 className="font-bold text-gray-900">{task.title}</h3>
                  {task.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{task.notes}</p>}
                </div>
              )) : (
                <p className="text-sm text-gray-400 px-2 italic">{t('noReminders')}</p>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
                <span className="material-icons text-xl">event</span>
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('events')}</h2>
            </div>
            <div className="space-y-3">
              {events.length > 0 ? events.map((event) => (
                <div key={event.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
                      {formatDate(event.start)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900">{event.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-gray-400 px-2 italic">{t('noReminders')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
