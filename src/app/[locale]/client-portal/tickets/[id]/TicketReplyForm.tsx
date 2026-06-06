'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendTicketMessage } from '@/app/actions/tickets';
import { useTranslations } from 'next-intl';

export default function TicketReplyForm({ ticketId, buttonText }: { ticketId: string, buttonText?: string }) {
  const t = useTranslations('ClientPortal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [message]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError('');

    const res = await sendTicketMessage(ticketId, message);

    if (res.error) {
      setError(res.error);
    } else {
      setMessage('');
    }
    setLoading(false);
  }, [message, loading, ticketId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-xxs px-xxs py-[6px] bg-semantic-warning/10 text-semantic-warning text-xs font-medium flex items-center gap-xxxs">
          <span className="material-icons text-[14px]">error_outline</span>
          {error}
        </div>
      )}
      
      {buttonText ? (
        <div className="space-y-xxs">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            required
            rows={3}
            placeholder={t('tickets.detail.replyPlaceholder')}
            className="w-full px-xs py-xxs bg-canvas border border-hairline text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none resize-none text-sm leading-relaxed"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full py-xxs bg-primary text-on-primary font-semibold hover:bg-primary-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center gap-[2px]"
          >
            {loading ? (
              <span className="material-icons text-[16px] animate-spin">sync</span>
            ) : (
              <span className="material-icons text-[16px]">send</span>
            )}
            <span className="text-xs uppercase tracking-wider leading-snug">{buttonText}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-xxs bg-canvas border border-hairline focus-within:border-primary/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              rows={1}
              placeholder={t('tickets.detail.replyPlaceholder')}
              className="flex-1 px-xs py-[10px] bg-transparent text-ink placeholder:text-muted focus:outline-none resize-none text-sm leading-relaxed max-h-[160px]"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="shrink-0 mb-[6px] mr-[6px] w-[36px] h-[36px] flex items-center justify-center bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('tickets.detail.replyButton')}
            >
              {loading ? (
                <span className="material-icons text-[18px] animate-spin">sync</span>
              ) : (
                <span className="material-icons text-[18px]">send</span>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-[4px]">
            <span className="text-caption text-muted/60">{t('tickets.detail.you')}</span>
            <span className="text-caption text-muted/40">Enter ↵</span>
          </div>
        </>
      )}
    </form>
  );
}
