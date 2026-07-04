'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskKanbanCard from './TaskKanbanCard';

interface TaskKanbanColumnProps {
  id: string;
  title: string;
  tasks: any[];
  onTaskClick: (task: any) => void;
  onTaskDelete: (id: string) => void;
  t: (key: string) => string;
}

export default function TaskKanbanColumn({ id, title, tasks, onTaskClick, onTaskDelete, t }: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col flex-1 min-w-[280px] md:min-w-[320px] bg-canvas-elevated border border-hairline overflow-hidden">
      <div className="p-xs border-b border-hairline bg-canvas flex justify-between items-center">
        <h3 className="text-caption-uppercase text-ink font-semibold">{title}</h3>
        <span className="bg-hairline text-muted text-[10px] px-1.5 py-0.5 font-bold rounded-sm">
          {tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`flex-1 p-xs flex flex-col gap-xs min-h-[150px] transition-colors ${
          isOver ? 'bg-primary/5' : 'bg-transparent'
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskKanbanCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              onDelete={() => onTaskDelete(task.id)}
              t={t}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center p-sm border border-dashed border-hairline opacity-50">
            <span className="text-muted text-[10px] uppercase tracking-wider font-semibold">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}
