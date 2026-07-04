'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { createTask, updateTask, deleteTask } from '@/app/actions/productivity';
import { useTranslations, useLocale } from 'next-intl';
import TaskModal from './TaskModal';
import Swal from 'sweetalert2';
import { swalTheme } from '@/lib/swal-theme';
import EmptyState from '@/components/EmptyState';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import TaskKanbanColumn from './TaskKanbanColumn';
import TaskKanbanCard from './TaskKanbanCard';

export default function TasksBoard({ initialTasks, projects, adminUsers = [] }: { initialTasks: any[], projects: any[], adminUsers?: any[] }) {
  const t = useTranslations('Tasks');
  const locale = useLocale();
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Drag and Drop State
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCreateTask = async (data: any) => {
    try {
      const newTask = await createTask(data);
      setTasks([newTask, ...tasks]);
    } catch (err) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('create.error') });
    }
  };

  const handleUpdateTask = async (id: string, data: any) => {
    try {
      // Optimistic update for UX
      setTasks(current => current.map(t => t.id === id ? { ...t, ...data } : t));
      const updated = await updateTask(id, data);
      // Confirm with DB response
      setTasks(current => current.map(t => t.id === id ? updated : t));
    } catch (err) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('update.error') });
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
        Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('delete.error') });
      }
    }
  };

  const toggleStatus = async (task: any) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
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

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.sortable;
    const isOverTask = over.data.current?.sortable;

    // Moving between columns logic would go here if we were just sorting arrays locally, 
    // but we can handle the status change in handleDragEnd for simplicity and robust state
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeTaskId = active.id as string;
    let newStatus = over.id as string;

    // If dropped over another task, get that task's status
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) {
      newStatus = overTask.status;
    }

    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    // Status changed
    if (activeTask.status !== newStatus) {
      await handleUpdateTask(activeTaskId, { status: newStatus });
    } else if (overTask) {
      // Reordering within same column
      const oldIndex = tasks.findIndex(t => t.id === activeTaskId);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      if (oldIndex !== newIndex) {
        setTasks(arrayMove(tasks, oldIndex, newIndex));
        // Note: For full persistence of ordering, we'd need a 'order' field in DB. 
        // For now, it stays visual until refresh, or we just rely on creation date.
      }
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h1>
          <p className="text-body text-muted mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-canvas-elevated border border-hairline p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink'}`}
              title="List View"
            >
              <span className="material-icons text-[18px]">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1 flex items-center justify-center transition-colors ${viewMode === 'kanban' ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink'}`}
              title="Kanban Board"
            >
              <span className="material-icons text-[18px]">view_kanban</span>
            </button>
          </div>
          <button 
            onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
            className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center justify-center border border-transparent"
          >
            <span className="material-icons mr-2 text-[20px]">add_task</span> {t('newTask')}
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-canvas-elevated border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.status') || 'Status'}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.task') || 'Task'}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.priority') || 'Priority'}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.dueDate') || 'Due Date'}</th>
                  <th className="px-sm py-xs"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-xl px-sm text-center">
                      <EmptyState variant="task" title={t('emptyTitle')} message={t('emptyMessage')} compact />
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-canvas/80 transition-colors group">
                      <td className="px-sm py-xs">
                        <button 
                          onClick={() => toggleStatus(task)}
                          className={`w-10 h-10 border flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
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
                          {t(`priority.${task.priority}` as any) || task.priority}
                        </span>
                      </td>
                      <td className="px-sm py-xs">
                        <div className="flex items-center text-muted font-medium text-sm">
                          {task.assignee ? (
                            <div className="flex items-center" title={`Assignee: ${task.assignee.name}`}>
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20 mr-2 uppercase">
                                {task.assignee.name.substring(0, 2)}
                              </span>
                            </div>
                          ) : (
                            <span className="material-icons text-[16px] mr-xxs opacity-20" title="Unassigned">person_outline</span>
                          )}
                          <span className="material-icons text-[16px] ml-2 mr-xxs opacity-40">calendar_today</span>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(locale, { day: '2-digit', month: 'short' }) : t('noDate') || '-'}
                        </div>
                      </td>
                      <td className="px-sm py-xs text-right">
                        <div className="flex items-center justify-end space-x-xxs sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                          <Link 
                            href={`/dashboard/productivity/tasks/${task.id}`}
                            className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary transition-colors"
                          >
                            <span className="material-icons text-[20px]">open_in_new</span>
                          </Link>
                          <button 
                            onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                            className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary transition-colors"
                          >
                            <span className="material-icons text-[18px]">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(task.id)}
                            className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary transition-colors"
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
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full min-h-[400px]">
              <TaskKanbanColumn 
                id="todo" 
                title={t('status.todo') || 'To Do'} 
                tasks={tasks.filter(t => t.status === 'todo' || t.status === 'pending' || !t.status)} 
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                onTaskDelete={handleDelete}
                t={t}
              />
              <TaskKanbanColumn 
                id="in-progress" 
                title={t('status.in-progress') || 'In Progress'} 
                tasks={tasks.filter(t => t.status === 'in-progress')} 
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                onTaskDelete={handleDelete}
                t={t}
              />
              <TaskKanbanColumn 
                id="done" 
                title={t('status.done') || 'Done'} 
                tasks={tasks.filter(t => t.status === 'done')} 
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                onTaskDelete={handleDelete}
                t={t}
              />
            </div>
            
            <DragOverlay>
              {activeTask ? (
                <div className="opacity-80 rotate-2 scale-105 transition-transform">
                  <TaskKanbanCard 
                    task={activeTask} 
                    onClick={() => {}}
                    onDelete={() => {}}
                    t={t}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

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
        adminUsers={adminUsers}
        initialData={selectedTask}
        title={selectedTask ? t('editTask') : t('newTask')}
      />
    </div>
  );
}
