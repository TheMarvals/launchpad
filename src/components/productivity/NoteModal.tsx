'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GenericModal from './GenericModal';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; category: string; color: string }) => Promise<void>;
  initialData?: {
    title: string;
    content: string | null;
    category: string | null;
    color: string;
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        category: initialData.category || 'General',
        color: initialData.color || '#3b82f6',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'General',
        color: '#3b82f6',
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

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.content')}</label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder={t('form.contentPlaceholder')}
            rows={6}
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium placeholder:text-gray-300 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.category')}</label>
            <input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder={t('form.categoryPlaceholder')}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0a041a] transition-all text-gray-900 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('form.color')}</label>
            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-2xl">
              {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1', '#ec4899'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full transition-all transform hover:scale-110 ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'opacity-60'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
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
