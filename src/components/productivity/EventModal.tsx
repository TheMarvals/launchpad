'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GenericModal from './GenericModal';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    title: string; 
    description: string; 
    start: Date; 
    end: Date; 
    allDay: boolean; 
    color: string;
    recurrenceRule?: string | null;
    recurrenceEnd?: Date | null;
  }, editMode?: 'this' | 'all') => Promise<void>;
  onDelete?: (deleteMode?: 'this' | 'thisAndFuture' | 'all') => Promise<void>;
  onShare?: (email: string) => Promise<void>;
  onUnshare?: (userId: string) => Promise<void>;
  initialData?: {
    id?: string;
    title: string;
    description?: string | null;
    start: Date;
    end: Date;
    allDay: boolean;
    color: string;
    recurrenceRule?: string | null;
    recurrenceEnd?: Date | null;
    isRecurring?: boolean;
    isShared?: boolean;
    sharedBy?: string;
    shares?: Array<{ id: string; user: { id: string; name: string; email: string } }>;
  };
  title: string;
}

export default function EventModal({ isOpen, onClose, onSave, onDelete, onShare, onUnshare, initialData, title }: EventModalProps) {
  const t = useTranslations('Calendar');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    color: '#3b82f6',
    recurrenceMode: 'none', // none, daily, weekly, monthly, yearly
    recurrenceInterval: 1,
    recurrenceDays: [] as number[],
    recurrenceEndDate: '',
  });
  const [shareEmail, setShareEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // States for edit/delete mode of recurring events
  const [editMode, setEditMode] = useState<'this' | 'all'>('all');
  const [deleteMode, setDeleteMode] = useState<'this' | 'thisAndFuture' | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      // Adjustment for local time strings for input type="datetime-local"
      const formatDate = (date: Date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };

      // Parse recurrence rule if exists
      let recMode = 'none';
      let recInterval = 1;
      let recDays: number[] = [];
      
      if (initialData.recurrenceRule) {
        if (initialData.recurrenceRule.includes('FREQ=DAILY')) recMode = 'daily';
        if (initialData.recurrenceRule.includes('FREQ=WEEKLY')) recMode = 'weekly';
        if (initialData.recurrenceRule.includes('FREQ=MONTHLY')) recMode = 'monthly';
        if (initialData.recurrenceRule.includes('FREQ=YEARLY')) recMode = 'yearly';
        
        const intervalMatch = initialData.recurrenceRule.match(/INTERVAL=(\d+)/);
        if (intervalMatch) recInterval = parseInt(intervalMatch[1]);
        
        const daysMatch = initialData.recurrenceRule.match(/BYDAY=([^;]+)/);
        if (daysMatch) {
          const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
          recDays = daysMatch[1].split(',').map(d => dayMap[d]).filter(d => d !== undefined);
        }
      }

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        start: formatDate(initialData.start),
        end: formatDate(initialData.end),
        allDay: initialData.allDay || false,
        color: initialData.color || '#3b82f6',
        recurrenceMode: recMode,
        recurrenceInterval: recInterval,
        recurrenceDays: recDays,
        recurrenceEndDate: initialData.recurrenceEnd ? formatDate(initialData.recurrenceEnd).slice(0, 10) : '',
      });
      
      setEditMode('all');
      setDeleteMode('all');
      setShowDeleteConfirm(false);
    }
  }, [initialData, isOpen]);

  const generateRRule = () => {
    if (formData.recurrenceMode === 'none') return null;
    
    let rrule = `FREQ=${formData.recurrenceMode.toUpperCase()}`;
    if (formData.recurrenceInterval > 1) {
      rrule += `;INTERVAL=${formData.recurrenceInterval}`;
    }
    if (formData.recurrenceMode === 'weekly' && formData.recurrenceDays.length > 0) {
      const dayStrings = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const selectedDays = formData.recurrenceDays.map(d => dayStrings[d]).join(',');
      rrule += `;BYDAY=${selectedDays}`;
    }
    return rrule;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const rrule = generateRRule();
      
      await onSave({
        title: formData.title,
        description: formData.description,
        start: new Date(formData.start),
        end: new Date(formData.end),
        allDay: formData.allDay,
        color: formData.color,
        recurrenceRule: rrule,
        recurrenceEnd: formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate + 'T23:59:59') : null,
      }, editMode);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!shareEmail || !onShare) return;
    setIsSharing(true);
    try {
      await onShare(shareEmail);
      setShareEmail('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  };

  const isShared = initialData?.isShared;

  return (
    <GenericModal isOpen={isOpen} onClose={onClose} title={isShared ? `${title} (Solo Lectura)` : title}>
      <form onSubmit={handleSubmit} className="space-y-sm">
        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.title')}</label>
          <input
            required
            readOnly={isShared}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('form.titlePlaceholder')}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.start')}</label>
            <input
              required
              type="datetime-local"
              readOnly={isShared}
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm disabled:opacity-50"
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('form.end')}</label>
            <input
              required
              type="datetime-local"
              readOnly={isShared}
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm disabled:opacity-50"
            />
          </div>
        </div>

        {/* RECURRENCE SECTION */}
        {!isShared && (
          <div className="space-y-xs border border-hairline p-xs bg-canvas/50">
            <div className="space-y-xxs">
              <label className="text-caption-uppercase text-ink font-semibold">{t('recurrence.label')}</label>
              <select
                value={formData.recurrenceMode}
                onChange={(e) => setFormData({ ...formData, recurrenceMode: e.target.value })}
                className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm"
              >
                <option value="none">{t('recurrence.none')}</option>
                <option value="daily">{t('recurrence.daily')}</option>
                <option value="weekly">{t('recurrence.weekly')}</option>
                <option value="monthly">{t('recurrence.monthly')}</option>
                <option value="yearly">{t('recurrence.yearly')}</option>
              </select>
            </div>

            {formData.recurrenceMode !== 'none' && (
              <div className="grid grid-cols-2 gap-sm pt-xxs">
                <div className="space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('recurrence.interval')}</label>
                  <div className="flex items-center gap-xxs">
                    <input
                      type="number"
                      min="1"
                      value={formData.recurrenceInterval}
                      onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                      className="w-16 px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm text-center"
                    />
                    <span className="text-sm text-muted">
                      {formData.recurrenceMode === 'daily' && t('recurrence.days')}
                      {formData.recurrenceMode === 'weekly' && t('recurrence.weeks')}
                      {formData.recurrenceMode === 'monthly' && t('recurrence.months')}
                      {formData.recurrenceMode === 'yearly' && t('recurrence.years')}
                    </span>
                  </div>
                </div>
                <div className="space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('recurrence.endDate')}</label>
                  <input
                    type="date"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                    className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-sm"
                    placeholder={t('recurrence.endDatePlaceholder')}
                  />
                </div>
              </div>
            )}
            
            {formData.recurrenceMode === 'weekly' && (
              <div className="space-y-xxs pt-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('recurrence.onDays')}</label>
                <div className="flex gap-1 flex-wrap">
                  {[1,2,3,4,5,6,0].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = formData.recurrenceDays.includes(day)
                          ? formData.recurrenceDays.filter(d => d !== day)
                          : [...formData.recurrenceDays, day];
                        setFormData({ ...formData, recurrenceDays: newDays });
                      }}
                      className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors border border-hairline
                        ${formData.recurrenceDays.includes(day) ? 'bg-primary text-on-primary border-primary' : 'bg-canvas text-ink hover:bg-canvas-elevated'}`}
                    >
                      {day === 1 ? t('recurrence.mon') : day === 2 ? t('recurrence.tue') : day === 3 ? t('recurrence.wed') : day === 4 ? t('recurrence.thu') : day === 5 ? t('recurrence.fri') : day === 6 ? t('recurrence.sat') : t('recurrence.dom')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {initialData?.isRecurring && (
              <div className="mt-xs pt-xs border-t border-hairline">
                <label className="text-caption-uppercase text-ink font-semibold">{t('recurring.editTitle')}</label>
                <div className="flex gap-2 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="editMode" value="this" checked={editMode === 'this'} onChange={() => setEditMode('this')} />
                    {t('recurring.editThis')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="editMode" value="all" checked={editMode === 'all'} onChange={() => setEditMode('all')} />
                    {t('recurring.editAll')}
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.description')}</label>
          <textarea
            readOnly={isShared}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('form.descriptionPlaceholder')}
            rows={3}
            className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors resize-none text-sm disabled:opacity-50"
          />
        </div>

        <div className="space-y-xxs">
          <label className="text-caption-uppercase text-ink font-semibold">{t('form.color')}</label>
          <div className="flex items-center gap-xxs border border-hairline bg-canvas p-xxs">
            {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1', '#ec4899'].map((c) => (
              <button
                key={c}
                type="button"
                disabled={isShared}
                onClick={() => setFormData({ ...formData, color: c })}className={`w-10 h-10 md:w-8 md:h-8 transition-all transform hover:scale-110 ${formData.color === c ? 'border-2 border-ink scale-110' : 'opacity-60'} ${isShared && 'cursor-default'}`}
                  style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* SHARING SECTION */}
        {initialData?.id && !isShared && onShare && (
          <div className="space-y-xs pt-xs border-t border-hairline">
            <label className="text-caption-uppercase text-ink font-semibold">{t('share.title')}</label>
            <div className="flex gap-2">
              <input 
                type="email"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                placeholder={t('share.emailPlaceholder')}
                className="flex-1 px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
              />
              <button 
                type="button"
                onClick={handleShare}
                disabled={isSharing || !shareEmail}
                className="px-sm py-xxs bg-canvas-elevated border border-hairline hover:bg-canvas text-xs uppercase font-semibold text-ink transition-colors disabled:opacity-50"
              >
                {isSharing ? '...' : t('share.add')}
              </button>
            </div>
            
            {initialData.shares && initialData.shares.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted">{t('share.sharedWith')}:</p>
                {initialData.shares.map(share => (
                  <div key={share.id} className="flex justify-between items-center bg-canvas p-2 border border-hairline">
                    <div>
                      <p className="text-sm font-medium text-ink">{share.user.name}</p>
                      <p className="text-xs text-muted">{share.user.email}</p>
                    </div>
                    {onUnshare && (
                      <button 
                        type="button"
                        onClick={() => onUnshare(share.user.id)}
                        className="text-semantic-warning hover:bg-semantic-warning/10 p-1 transition-colors"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isShared && (
          <div className="p-xs bg-primary/10 border border-primary/30 flex items-start gap-2">
            <span className="material-icons text-primary text-sm mt-0.5">info</span>
            <p className="text-xs text-ink">{t('share.sharedByOther', { name: initialData?.sharedBy || 'otro usuario' })}. {t('share.readOnly')}.</p>
          </div>
        )}

        <div className="pt-xs flex flex-col gap-2">
          {showDeleteConfirm && (
            <div className="bg-semantic-warning/10 border border-semantic-warning p-xs space-y-xs mb-xs">
              <p className="text-sm font-medium text-semantic-warning">{t('recurring.deleteTitle')}</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="deleteMode" value="this" checked={deleteMode === 'this'} onChange={() => setDeleteMode('this')} />
                  {t('recurring.deleteThis')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="deleteMode" value="thisAndFuture" checked={deleteMode === 'thisAndFuture'} onChange={() => setDeleteMode('thisAndFuture')} />
                  {t('recurring.deleteThisAndFuture')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="deleteMode" value="all" checked={deleteMode === 'all'} onChange={() => setDeleteMode('all')} />
                  {t('recurring.deleteAll')}
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 text-xs uppercase font-semibold text-ink border border-hairline">{t('form.cancel')}</button>
                <button type="button" onClick={() => onDelete && onDelete(deleteMode)} className="px-2 py-1 text-xs uppercase font-semibold bg-semantic-warning text-white">{t('form.delete')}</button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-xxs">
            {initialData?.id && onDelete && !isShared && (
              <button
                type="button"
                onClick={() => initialData.isRecurring ? setShowDeleteConfirm(true) : onDelete('all')}
                className="px-xs py-xs font-semibold text-semantic-warning hover:bg-semantic-warning/10 transition-colors flex items-center uppercase tracking-wider text-xs border border-transparent"
              >
                <span className="material-icons mr-xxs text-sm">delete</span> {t('form.delete')}
              </button>
            )}
            
            <div className="flex-1 flex justify-end gap-xxs">
              <button
                type="button"
                onClick={onClose}
                className="bg-transparent border border-hairline text-ink px-xs py-xs font-semibold text-xs uppercase tracking-wider hover:bg-canvas transition-colors"
              >
                {isShared ? t('form.cancel').replace('Cancelar', 'Cerrar').replace('Cancel', 'Close') : t('form.cancel')}
              </button>
              {!isShared && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-on-primary px-xs py-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 uppercase tracking-wider text-xs min-w-[120px]"
                >
                  {isSubmitting ? t('form.saving') : t('form.save')}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </GenericModal>
  );
}
