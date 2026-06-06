'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { submitContactForm } from '@/app/actions/contact';

export default function ContactForm() {
  const t = useTranslations('Contact');
  const [form, setForm] = useState({ name: '', email: '', company: '', challenge: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const res = await submitContactForm(form);
    if (res.success) {
      setStatus('success');
      setForm({ name: '', email: '', company: '', challenge: '' });
    } else {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[560px] mx-auto space-y-sm">
      <div className="relative">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t('namePlaceholder')}
          required
          className="w-full bg-canvas border border-hairline text-ink text-sm h-[48px] px-sm placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all duration-300 rounded-sm"
        />
      </div>
      <div className="relative">
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder={t('emailPlaceholder')}
          required
          className="w-full bg-canvas border border-hairline text-ink text-sm h-[48px] px-sm placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all duration-300 rounded-sm"
        />
      </div>
      <div className="relative">
        <input
          type="text"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder={t('companyPlaceholder')}
          required
          className="w-full bg-canvas border border-hairline text-ink text-sm h-[48px] px-sm placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all duration-300 rounded-sm"
        />
      </div>
      <div className="relative">
        <textarea
          value={form.challenge}
          onChange={(e) => setForm({ ...form, challenge: e.target.value })}
          placeholder={t('challengePlaceholder')}
          required
          rows={5}
          className="w-full bg-canvas border border-hairline text-ink text-sm px-sm py-xs placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_2px_rgba(0,98,255,0.15)] outline-none transition-all duration-300 resize-none rounded-sm"
        />
      </div>
      
      {status === 'success' && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-sm font-medium px-sm py-xs rounded-sm flex items-center gap-xxs">
          <span className="material-icons text-[18px]">check_circle</span>
          {t('success')}
        </div>
      )}
      {status === 'error' && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm font-medium px-sm py-xs rounded-sm flex items-center gap-xxs">
          <span className="material-icons text-[18px]">error_outline</span>
          {t('error')}
        </div>
      )}

      <div className="text-center pt-xs">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="group inline-flex items-center gap-xxs bg-secondary hover:bg-secondary-hover text-white px-lg h-[48px] rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.12)] hover:shadow-[0_0_16px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
        >
          {status === 'loading' ? (
            <span className="material-icons animate-spin text-[18px]">sync</span>
          ) : (
            <>
              <span className="material-icons text-[16px] group-hover:translate-x-0.5 transition-transform">assignment</span>
              {t('submit')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
