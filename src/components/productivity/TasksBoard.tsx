'use client';

import { useState } from 'react';
import { createTask, updateTask, deleteTask } from '@/app/actions/productivity';
import TaskModal from './TaskModal';
import Swal from 'sweetalert2';

export default function TasksBoard({ initialTasks, projects }: { initialTasks: any[], projects: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const handleCreateTask = async (data: any) => {
    try {
      const newTask = await createTask(data);
      setTasks([newTask, ...tasks]);
    } catch (err) {
      Swal.fire('Error', 'No se pudo crear la tarea.', 'error');
    }
  };

  const handleUpdateTask = async (id: string, data: any) => {
    try {
      const updated = await updateTask(id, data);
      setTasks(tasks.map(t => t.id === id ? updated : t));
    } catch (err) {
      Swal.fire('Error', 'No se pudo actualizar la tarea.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar tarea?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold text-gray-400'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar la tarea.', 'error');
      }
    }
  };

  const toggleStatus = async (task: any) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    await handleUpdateTask(task.id, { status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0a041a]">Tareas</h1>
          <p className="text-gray-400 font-medium mt-1">Control de actividades y pendientes personales.</p>
        </div>
        <button 
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
          className="bg-[#0a041a] text-white px-8 py-4 rounded-[1.5rem] font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-[#0a041a]/10 flex items-center justify-center"
        >
          <span className="material-icons mr-2 text-[20px]">add_task</span> Nueva Tarea
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-2xl shadow-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-black text-gray-300">Estado</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-black text-gray-300">Tarea</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-black text-gray-300">Prioridad</th>
                <th className="px-10 py-8 text-[10px] uppercase tracking-widest font-black text-gray-300">Vencimiento</th>
                <th className="px-10 py-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mb-4">
                        <span className="material-icons text-3xl text-gray-200">checklist</span>
                      </div>
                      <p className="text-gray-400 font-bold text-lg">No tienes tareas pendientes.</p>
                      <p className="text-gray-300 text-sm mt-1">Organiza tu día agregando tu primera tarea.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => toggleStatus(task)}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
                          task.status === 'done' ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' : 'border-gray-200 hover:border-blue-400 bg-white'
                        }`}
                      >
                        {task.status === 'done' && <span className="material-icons text-white text-[18px]">check</span>}
                      </button>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <p className={`text-lg font-black text-[#0a041a] transition-all ${task.status === 'done' ? 'line-through opacity-30 italic' : ''}`}>
                          {task.title}
                        </p>
                        {task.notes && (
                          <p className={`text-sm text-gray-400 mt-1 max-w-sm line-clamp-1 font-medium ${task.status === 'done' ? 'opacity-30' : ''}`}>
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center text-gray-400 font-bold text-sm">
                        <span className="material-icons text-[16px] mr-2 opacity-40">calendar_today</span>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : 'Sin fecha'}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                          className="p-3 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <span className="material-icons text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <span className="material-icons text-[20px]">delete</span>
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
        title={selectedTask ? 'Editar Tarea' : 'Nueva Tarea'}
      />
    </div>
  );
}
