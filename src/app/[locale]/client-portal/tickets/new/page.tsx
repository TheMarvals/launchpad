'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket } from '@/app/actions/tickets';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function NewTicketPage() {
  const router = useRouter();
  const t = useTranslations('ClientPortal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const priority = formData.get('priority') as string;
    const message = formData.get('message') as string;

    const res = await createTicket({ subject, priority, message });

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push(`/client-portal/tickets/${res.ticketId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-md">
      <div className="flex items-center space-x-xs mb-xxs">
        <Link href="/client-portal/tickets" className="w-[40px] h-[40px] bg-canvas-elevated border border-hairline flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">
          <span className="material-icons">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-title-md font-medium text-ink tracking-tight">{t('tickets.new.pageTitle')}</h1>
          <p className="text-body text-muted text-sm mt-[2px]">{t('tickets.new.pageSubtitle')}</p>
        </div>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        <div className="p-sm">
          {error && (
            <div className="mb-xs p-xs bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/30 flex items-start">
              <span className="material-icons mr-xxs text-[20px]">error_outline</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div className="space-y-xxs md:col-span-2">
                <label htmlFor="subject" className="block text-caption-uppercase text-ink font-semibold">
                  {t('tickets.new.subjectLabel')} <span className="text-semantic-warning">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  placeholder={t('tickets.new.subjectPlaceholder')}
                  className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary transition-all outline-none text-sm"
                />
              </div>

              <div className="space-y-xxs">
                <label htmlFor="priority" className="block text-caption-uppercase text-ink font-semibold">
                  {t('tickets.new.priorityLabel')} <span className="text-semantic-warning">*</span>
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    name="priority"
                    required
                    defaultValue="MEDIUM"
                    className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink focus:border-primary transition-all outline-none appearance-none text-sm"
                  >
                    <option value="LOW">{t('tickets.new.priorityLow')}</option>
                    <option value="MEDIUM">{t('tickets.new.priorityMedium')}</option>
                    <option value="HIGH">{t('tickets.new.priorityHigh')}</option>
                    <option value="URGENT">{t('tickets.new.priorityUrgent')}</option>
                  </select>
                  <span className="material-icons absolute right-xs top-1/2 -translate-y-1/2 text-muted pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-xxs border-t border-hairline pt-sm">
              <label htmlFor="message" className="block text-caption-uppercase text-ink font-semibold">
                {t('tickets.new.messageLabel')} <span className="text-semantic-warning">*</span>
              </label>
              <p className="text-caption text-muted mb-xxs">{t('tickets.new.messageHint')}</p>
              <textarea
                id="message"
                name="message"
                required
                rows={8}
                placeholder={t('tickets.new.messagePlaceholder')}
                className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary transition-all outline-none resize-y text-sm"
              ></textarea>
            </div>

            <div className="pt-xs flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-on-primary px-sm py-xxs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center min-w-[200px] text-xs uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin mr-xxs text-[18px]">sync</span>
                    {t('tickets.new.sending')}
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-xxs text-[18px]">send</span>
                    {t('tickets.new.submit')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
