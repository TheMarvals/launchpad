'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GenericModal from './GenericModal';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    title: string; 
    projectId?: string; 
    priority: string; 
    notes: string; 
    dueDate?: Date;
  }) => Promise<void>;
  projects: any[];
  initialData?: {
    id?: string;
    title: string;
    projectId?: string | null;
    priority: string;
    notes?: string | null;
    dueDate?: Date | null;
  };
  title: string;
}

export default function TaskModal({ isOpen, onClose, onSave, projects, initialData, title }: TaskModalProps) {
  const t = useTranslations('Tasks');
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    priority: 'medium',
    notes: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title || '',
        projectId: initialData.projectId || '',
        priority: initialData.priority || 'medium',
        notes: initialData.notes || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        projectId: formData.projectId || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GenericModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-sm">
        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.title')}</label>
          <input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('form.titlePlaceholder')}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.project')}</label>
            <div className="relative">
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors appearance-none text-sm"
              >
                <option value="">{t('form.noProject')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.priority')}</label>
            <div className="relative">
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors appearance-none text-sm"
              >
                <option value="low">{t('priority.low')}</option>
                <option value="medium">{t('priority.medium')}</option>
                <option value="high">{t('priority.high')}</option>
                <option value="urgent">{t('priority.urgent')}</option>
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
        </div>

        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={t('form.notesPlaceholder')}
            rows={3}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors resize-none text-sm"
          />
        </div>

        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.dueDate')}</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm"
          />
        </div>

        <div className="pt-xs flex gap-xxs">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-transparent border border-hairline text-ink px-xs py-xs font-semibold text-xs uppercase tracking-wider hover:bg-canvas transition-colors"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] bg-primary text-on-primary px-xs py-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 uppercase tracking-wider text-xs"
          >
            {isSubmitting ? t('form.saving') : t('form.save')}
          </button>
        </div>
      </form>
    </GenericModal>
  );
}
