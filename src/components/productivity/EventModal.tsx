'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GenericModal from './GenericModal';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string; start: Date; end: Date; allDay: boolean; color: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: {
    id?: string;
    title: string;
    description?: string | null;
    start: Date;
    end: Date;
    allDay: boolean;
    color: string;
  };
  title: string;
}

export default function EventModal({ isOpen, onClose, onSave, onDelete, initialData, title }: EventModalProps) {
  const t = useTranslations('Calendar');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    color: '#3b82f6',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      // Adjustment for local time strings for input type="datetime-local"
      const formatDate = (date: Date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        start: formatDate(initialData.start),
        end: formatDate(initialData.end),
        allDay: initialData.allDay || false,
        color: initialData.color || '#3b82f6',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        start: new Date(formData.start),
        end: new Date(formData.end),
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
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.start')}</label>
            <input
              required
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm"
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.end')}</label>
            <input
              required
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
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

        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.color')}</label>
          <div className="flex items-center gap-xxs border border-hairline bg-canvas p-xxs">
            {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1', '#ec4899'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({ ...formData, color: c })}className={`w-10 h-10 md:w-8 md:h-8 transition-all transform hover:scale-110 ${formData.color === c ? 'border-2 border-ink scale-110' : 'opacity-60'}`}
                  style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="pt-xs flex items-center justify-between gap-xxs">
          {initialData?.id && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-xs py-xs font-semibold text-semantic-warning hover:bg-semantic-warning/10 transition-colors flex items-center uppercase tracking-wider text-xs border border-transparent"
            >
              <span className="material-icons mr-xxs text-sm">delete</span> {t('form.delete')}
            </button>
          )}
          
          <div className="flex-1 flex gap-xxs">
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
        </div>
      </form>
    </GenericModal>
  );
}
