'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export function MobileClientNav() {
  const t = useTranslations('ClientPortal');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-muted hover:text-ink transition-colors mr-xs"
        title="Menú"
      >
        <span className="material-icons">menu</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-canvas border-r border-hairline z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-sm flex items-center justify-between border-b border-hairline shrink-0">
          <h1 className="text-xl font-black tracking-tighter stroke-text">LAUNCHPAD</h1>
          <button onClick={() => setIsOpen(false)} className="text-muted hover:text-ink bg-canvas-elevated p-[4px]">
            <span className="material-icons">close</span>
          </button>
        </div>

        <nav className="flex-grow mt-xs overflow-y-auto">
          <ul className="space-y-[2px]">
            <li>
              <Link href="/client-portal" onClick={() => setIsOpen(false)} className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">dashboard</span> {t('dashboard.navLabel')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/servers" onClick={() => setIsOpen(false)} className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">dns</span> {t('servers.title')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/quotes" onClick={() => setIsOpen(false)} className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">description</span> {t('quotes.pageTitle')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/tickets" onClick={() => setIsOpen(false)} className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">support_agent</span> {t('tickets.title')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
