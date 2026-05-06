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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.title')}</label>
          <input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('form.titlePlaceholder')}
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium placeholder:text-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.project')}</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium appearance-none"
            >
              <option value="">{t('form.noProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.priority')}</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium appearance-none"
            >
              <option value="low">{t('priority.low')}</option>
              <option value="medium">{t('priority.medium')}</option>
              <option value="high">{t('priority.high')}</option>
              <option value="urgent">{t('priority.urgent')}</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={t('form.notesPlaceholder')}
            rows={3}
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium placeholder:text-gray-300 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.dueDate')}</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium"
          />
        </div>

        <div className="pt-4 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] bg-[#0a041a] text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-[#0a041a]/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? t('form.saving') : t('form.save')}
          </button>
        </div>
      </form>
    </GenericModal>
  );
}
