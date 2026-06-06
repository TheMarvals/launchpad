'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import AccessGateModal from '@/components/AccessGateModal';

interface LandingCtaProps {
  isAuthenticated: boolean;
  ctaLabel: string;
}

export default function LandingCta({ isAuthenticated, ctaLabel }: LandingCtaProps) {
  const [showGate, setShowGate] = useState(false);

  if (isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-xs">
        <Link
          href="/dashboard"
          className="bg-primary hover:bg-primary-active text-white px-lg h-[56px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors min-w-[200px]"
        >
          <span className="material-icons mr-xxs text-[18px]">dashboard</span>
          {ctaLabel}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <button
          onClick={() => setShowGate(true)}
          className="bg-primary hover:bg-primary-active text-white px-lg h-[56px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors min-w-[200px] cursor-pointer"
        >
          <span className="material-icons mr-xxs text-[18px]">lock</span>
          {ctaLabel}
        </button>
      </div>

      <AccessGateModal
        isOpen={showGate}
        onClose={() => setShowGate(false)}
      />
    </>
  );
}
