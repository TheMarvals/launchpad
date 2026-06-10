'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { checkAccessEmail } from '@/app/actions/login-otp';

interface AccessGateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessGateModal({ isOpen, onClose }: AccessGateModalProps) {
  const t = useTranslations('Gate');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) onClose();
  }, [isLoading, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await checkAccessEmail(email);

      if (res.exists && res.token) {
        // Full page navigation with signed token — next-intl middleware handles locale prefix
        window.location.href = `/login?token=${encodeURIComponent(res.token)}`;
      } else if (res.error === 'RATE_LIMITED') {
        setError(t('rateLimited'));
        setIsLoading(false);
      } else {
        setError(res.error === 'SERVER_ERROR' ? t('serverError') : t('notFound'));
        setIsLoading(false);
      }
    } catch {
      setError(t('serverError'));
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-xxs"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-card border border-hairline rounded-lg w-[400px] max-w-full shadow-medium overflow-hidden">
        <div className="p-sm">
          <div className="flex items-center justify-between mb-xxs">
            <h3 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
              <span className="material-icons mr-xxxs text-primary">lock</span>
              {t('title')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-muted hover:text-ink transition-colors disabled:opacity-30 cursor-pointer -mr-xxxs w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons text-[20px]">close</span>
            </button>
          </div>

          <p className="text-body text-muted text-sm leading-relaxed mb-xxs">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-sm pb-sm space-y-xxs">
            {error && (
              <div className="bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-xs font-medium px-xxs py-xxxs rounded-sm flex items-start gap-xxs">
                <span className="material-icons text-[16px] shrink-0 mt-[1px]">error_outline</span>
                <span>{error}</span>
              </div>
            )}

            {isLoading && (
              <div className="bg-semantic-info/10 border border-semantic-info/20 text-semantic-info text-xs font-medium px-xxs py-xxxs rounded-sm flex items-center gap-xxs">
                <span className="material-icons animate-spin text-[16px]">sync</span>
                <span>{t('checking')}</span>
              </div>
            )}

            <div className="space-y-xxxs">
              <div className="relative">
                <span className="material-icons absolute left-xxs top-1/2 -translate-y-1/2 text-muted text-sm">email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-canvas border border-hairline rounded-sm p-xxs pl-[40px] text-ink text-sm focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all placeholder:text-muted h-[44px]"
                  placeholder="mail@example.com"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-xxs px-sm py-xxs border-t border-hairline bg-canvas">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-sm py-xs font-bold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors disabled:opacity-30 cursor-pointer rounded-sm"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="bg-primary text-on-primary px-sm py-xs rounded-sm font-bold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all disabled:opacity-50 border border-transparent flex items-center cursor-pointer"
            >
              {isLoading ? (
                <span className="material-icons animate-spin text-[18px]">sync</span>
              ) : (
                <>
                  <span className="material-icons mr-xxs text-[14px]">arrow_forward</span>
                  {t('continue')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
