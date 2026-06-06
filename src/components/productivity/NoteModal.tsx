'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GenericModal from './GenericModal';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; category: string; color: string; isPublic: boolean }) => Promise<void>;
  initialData?: {
    title: string;
    content: string | null;
    category: string | null;
    color: string;
    isPublic: boolean;
  };
  title: string;
}

export default function NoteModal({ isOpen, onClose, onSave, initialData, title }: NoteModalProps) {
  const t = useTranslations('Notes');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    color: '#3b82f6',
    isPublic: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        category: initialData.category || 'General',
        color: initialData.color || '#3b82f6',
        isPublic: initialData.isPublic || false,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'General',
        color: '#3b82f6',
        isPublic: false,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
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

        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.content')}</label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder={t('form.contentPlaceholder')}
            rows={6}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors resize-none text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.category')}</label>
            <input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder={t('form.categoryPlaceholder')}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
            />
          </div>

          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.color')}</label>
            <div className="flex items-center gap-xxs border border-hairline bg-canvas p-xxs">
              {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1', '#ec4899'].map((c) => (
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

        <div className="border border-hairline p-xxs">
          <label className="flex items-center space-x-xxs cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 accent-primary border-hairline"
            />
            <span className="text-ink text-sm font-medium">Nota Pública (visible para todo el equipo)</span>
          </label>
        </div>

        <div className="pt-xs border-t border-hairline flex gap-xxs">
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
