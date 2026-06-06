'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import AccessGateModal from '@/components/AccessGateModal';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function LandingNav() {
  const t = useTranslations('Landing');
  const [showGate, setShowGate] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-hairline/40">
        <div className="max-w-[1200px] mx-auto px-lg h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-xxs no-underline">
            <span
              className="text-xl font-black tracking-tighter leading-none"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              LAUNCHPAD
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-sm">
            <LocaleSwitcher />
            <button
              onClick={() => setShowGate(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-primary-active transition-all duration-300 tracking-wider uppercase cursor-pointer group"
            >
              <span className="material-icons text-[14px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              {t('clientAccess')}
            </button>
          </div>
        </div>
      </nav>
      {/* Spacer */}
      <div className="h-16" />

      <AccessGateModal
        isOpen={showGate}
        onClose={() => setShowGate(false)}
      />
    </>
  );
}
