'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { createTask, updateTask, deleteTask } from '@/app/actions/productivity';
import { useTranslations, useLocale } from 'next-intl';
import TaskModal from './TaskModal';
import Swal from 'sweetalert2';

export default function TasksBoard({ initialTasks, projects }: { initialTasks: any[], projects: any[] }) {
  const t = useTranslations('Tasks');
  const locale = useLocale();
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const handleCreateTask = async (data: any) => {
    try {
      const newTask = await createTask(data);
      setTasks([newTask, ...tasks]);
    } catch (err) {
      Swal.fire('Error', t('create.error'), 'error');
    }
  };

  const handleUpdateTask = async (id: string, data: any) => {
    try {
      const updated = await updateTask(id, data);
      setTasks(tasks.map(t => t.id === id ? updated : t));
    } catch (err) {
      Swal.fire('Error', t('update.error'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: t('delete.title'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
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
        await deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
      } catch (err) {
        Swal.fire('Error', t('delete.error'), 'error');
      }
    }
  };

  const toggleStatus = async (task: any) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    await handleUpdateTask(task.id, { status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border border-primary text-primary';
  case 'high': return 'border border-primary text-primary';
  case 'medium': return 'border border-hairline text-muted';
  default: return 'border border-hairline text-muted';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h1>
          <p className="text-body text-muted mt-1">{t('subtitle')}</p>
        </div>
        <button 
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
          className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center justify-center border border-transparent"
        >
          <span className="material-icons mr-2 text-[20px]">add_task</span> {t('newTask')}
        </button>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas border-b border-hairline">
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.status')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.task')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.priority')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.dueDate')}</th>
                <th className="px-sm py-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl px-sm text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-[72px] h-[72px] bg-canvas border border-hairline flex items-center justify-center mb-xs">
                          <span className="material-icons text-3xl text-muted">checklist</span>
                        </div>
                        <p className="text-title-sm font-medium text-ink">{t('emptyTitle')}</p>
                        <p className="text-sm text-muted mt-[4px]">{t('emptyMessage')}</p>
                      </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-canvas/80 transition-colors group">
                    <td className="px-sm py-xs">
                      <button 
                        onClick={() => toggleStatus(task)}
                        className={`w-8 h-8 border flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
                          task.status === 'done' ? 'bg-primary border-primary text-white' : 'border-hairline hover:border-primary bg-transparent text-transparent'
                        }`}
                      >
                        {task.status === 'done' && <span className="material-icons text-white text-[18px]">check</span>}
                      </button>
                    </td>
                    <td className="px-sm py-xs">
                      <div className="flex flex-col">
                        <p className={`text-sm font-medium text-ink transition-all ${task.status === 'done' ? 'line-through opacity-30' : ''}`}>
                          {task.title}
                        </p>
                        {task.notes && (
                          <p className={`text-caption text-muted mt-[2px] max-w-[24rem] line-clamp-1 ${task.status === 'done' ? 'opacity-30' : ''}`}>
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-sm py-xs">
                      <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold ${getPriorityColor(task.priority)}`}>
                        {t(`priority.${task.priority}` as any)}
                      </span>
                    </td>
                    <td className="px-sm py-xs">
                      <div className="flex items-center text-muted font-medium text-sm">
                        <span className="material-icons text-[16px] mr-xxs opacity-40">calendar_today</span>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString(locale, { day: '2-digit', month: 'short' }) : t('noDate')}
                      </div>
                    </td>
                    <td className="px-sm py-xs text-right">
                      <div className="flex items-center justify-end space-x-xxs opacity-0 group-hover:opacity-100 transition-all">
                        <Link 
                          href={`/dashboard/productivity/tasks/${task.id}`}
                          className="p-xxs text-muted hover:text-primary transition-colors"
                        >
                          <span className="material-icons text-[20px]">open_in_new</span>
                        </Link>
                        <button 
                          onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                          className="p-xxs text-muted hover:text-primary transition-colors"
                        >
                          <span className="material-icons text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-xxs text-muted hover:text-primary transition-colors"
                        >
                          <span className="material-icons text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          if (selectedTask) {
            await handleUpdateTask(selectedTask.id, data);
          } else {
            await handleCreateTask(data);
          }
        }}
        projects={projects}
        initialData={selectedTask}
        title={selectedTask ? t('editTask') : t('newTask')}
      />
    </div>
  );
}
