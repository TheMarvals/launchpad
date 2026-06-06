'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GenericModal from './GenericModal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    name: string; 
    clientName: string; 
    budget: number; 
    description: string; 
    color: string;
    deadline?: Date;
  }) => Promise<void>;
  initialData?: {
    id?: string;
    name: string;
    clientName?: string | null;
    budget?: number | null;
    description?: string | null;
    color: string;
    deadline?: Date | null;
  };
  title: string;
}

export default function ProjectModal({ isOpen, onClose, onSave, initialData, title }: ProjectModalProps) {
  const t = useTranslations('Projects');
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    budget: 0,
    description: '',
    color: '#6366f1',
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        clientName: initialData.clientName || '',
        budget: initialData.budget || 0,
        description: initialData.description || '',
        color: initialData.color || '#6366f1',
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
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
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.name')}</label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('form.namePlaceholder')}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.client')}</label>
            <input
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder={t('form.clientPlaceholder')}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.budget')}</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm"
            />
          </div>
        </div>

        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('form.descriptionPlaceholder')}
            rows={3}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors resize-none text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.deadline')}</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm"
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.color')}</label>
            <div className="flex items-center gap-xxs border border-hairline bg-canvas p-xxs">
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 transition-all transform hover:scale-110 ${formData.color === c ? 'border-2 border-ink scale-110' : 'opacity-60'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-xs flex gap-xxs">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-transparent border border-hairline text-ink px-xs py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-canvas transition-colors"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] bg-primary text-on-primary px-xs py-xxs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 uppercase tracking-wider text-xs"
          >
            {isSubmitting ? t('form.saving') : t('form.save')}
          </button>
        </div>
      </form>
    </GenericModal>
  );
}
