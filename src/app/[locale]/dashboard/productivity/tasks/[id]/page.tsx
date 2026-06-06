import { getTask } from '@/app/actions/productivity';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const task = await getTask(id);
  const t = await getTranslations('Tasks');

  if (!task) {
    notFound();
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-semantic-warning font-bold';
      case 'high': return 'text-accent-yellow';
      case 'medium': return 'text-semantic-info';
      default: return 'text-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-semantic-success/10 text-semantic-success border-semantic-success/30';
      case 'in-progress': return 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30';
      case 'todo':
      case 'pending': return 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/30';
      default: return 'bg-canvas-elevated text-muted border-hairline';
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`status.${status}` as any);
  };

  return (
    <div className="space-y-md max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-xs">
        <Link
          href="/dashboard/productivity/tasks"
          className="w-[40px] h-[40px] bg-canvas-elevated border border-hairline flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors"
        >
          <span className="material-icons">arrow_back</span>
        </Link>
        <div>
          <div className="flex items-center space-x-xxs">
            <div className={`w-[10px] h-[10px] ${task.status === 'done' ? 'bg-semantic-success' : 'bg-primary'}`} />
            <h1 className="text-title-md font-medium text-ink tracking-tight">{task.title}</h1>
          </div>
          <p className="text-body text-muted text-sm mt-[2px]">{t('subtitle')}</p>
        </div>
      </div>

      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        {/* Status & Priority */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">{t('table.status')}</p>
            <span className={`px-xxs py-[2px] text-caption-uppercase font-semibold border ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
          </div>
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">{t('table.priority')}</p>
            <span className={`text-sm font-semibold ${getPriorityColor(task.priority)}`}>
              {t(`priority.${task.priority}` as any)}
            </span>
          </div>
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">{t('table.dueDate')}</p>
            <p className="font-semibold text-ink text-sm">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : t('noDate')}
            </p>
          </div>
          <div className="space-y-xxs">
            <p className="text-caption-uppercase text-muted font-semibold">ID</p>
            <p className="font-mono text-xs text-muted">{task.id.split('-')[0]}</p>
          </div>
        </div>

        {/* Notes */}
        {task.notes && (
          <div className="pt-sm border-t border-hairline">
            <p className="text-caption-uppercase text-muted font-semibold mb-xxs">{t('form.notes')}</p>
            <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{task.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
