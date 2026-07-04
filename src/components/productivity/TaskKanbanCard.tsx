'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskKanbanCardProps {
  task: any;
  onClick: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}

export default function TaskKanbanCard({ task, onClick, onDelete, t }: TaskKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-primary text-primary';
      case 'high': return 'border-primary text-primary';
      case 'medium': return 'border-hairline text-muted';
      default: return 'border-hairline text-muted';
    }
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="bg-canvas border border-primary p-xs opacity-30 min-h-[80px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-canvas border border-hairline p-xs hover:border-muted/50 transition-colors cursor-grab active:cursor-grabbing group flex flex-col gap-2"
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-sm font-medium text-ink line-clamp-2 leading-tight">{task.title}</h4>
        
        {/* Actions (hidden until hover) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="text-muted hover:text-ink transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <span className="material-icons text-[14px]">edit</span>
          </button>
          <button
            type="button"
            className="text-muted hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <span className="material-icons text-[14px]">delete</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-1">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 border ${getPriorityColor(task.priority)}`}>
          {t(`priority.${task.priority}`) || task.priority}
        </span>
        
        {task.dueDate && (
          <div className="flex items-center text-muted text-xs">
            <span className="material-icons text-[12px] mr-1">event</span>
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
