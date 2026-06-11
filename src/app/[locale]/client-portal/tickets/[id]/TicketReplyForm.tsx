'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendTicketMessage } from '@/app/actions/tickets';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function TicketReplyForm({ ticketId, buttonText }: { ticketId: string, buttonText?: string }) {
  const t = useTranslations('ClientPortal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

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
      router.refresh();
    }
    setLoading(false);
  }, [message, loading, ticketId, router]);

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
            className="w-full px-xs py-xs bg-canvas border border-hairline text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none resize-none text-sm leading-relaxed"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full py-xs bg-primary text-on-primary font-semibold hover:bg-primary-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center gap-[2px]"
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
          <div className="flex items-end gap-xs bg-canvas-elevated/50 border border-hairline rounded-2xl p-xs focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/40 transition-all shadow-sm hover:shadow-md">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              rows={1}
              placeholder={t('tickets.detail.replyPlaceholder')}
              className="flex-1 px-xs py-xxs bg-transparent text-ink placeholder:text-muted focus:outline-none resize-none text-sm leading-relaxed max-h-[160px]"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-on-primary hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-sm"
              title={t('tickets.detail.replyButton')}
            >
              {loading ? (
                <span className="material-icons text-[18px] animate-spin">sync</span>
              ) : (
                <span className="material-icons text-[18px] ml-[2px]">send</span>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-xs px-xs">
            <span className="text-[11px] font-medium text-muted/60 uppercase tracking-wider">{t('tickets.detail.you')}</span>
            <span className="text-[10px] text-muted/40 font-mono">Enter ↵</span>
          </div>
        </>
      )}
    </form>
  );
}
