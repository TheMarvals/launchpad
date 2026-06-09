'use client';

import React from 'react';
import { useMobileNav } from './MobileNavProvider';

export function MobileNavTrigger() {
  const { toggle } = useMobileNav();

  return (
    <button
      onClick={toggle}
      className="md:hidden text-muted hover:text-ink transition-colors mr-xs"
      title="Menú"
    >
      <span className="material-icons text-[22px]">menu</span>
    </button>
  );
}

export default function DashboardMobileNav({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useMobileNav();

  return (
    <>
      {/* Overlay with fade transition (backdrop-blur stays on to avoid animation glitch) */}
      <div
        className={`fixed inset-0 z-[60] md:hidden backdrop-blur-sm transition-all duration-300 ease-out ${
          isOpen
            ? 'bg-black/60 opacity-100 visible'
            : 'bg-black/0 opacity-0 invisible'
        }`}
        onClick={close}
      />

      {/* Sidebar Panel with slide + shadow transition */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-canvas border-r border-hairline z-[70] md:hidden flex flex-col transition-all duration-300 ease-out ${
          isOpen
            ? 'translate-x-0 shadow-2xl shadow-black/40'
            : '-translate-x-full shadow-none'
        }`}
      >
        <div className="p-sm flex items-center justify-between border-b border-hairline shrink-0">
          <h1 className="text-xl font-black tracking-tighter stroke-text">LAUNCHPAD</h1>
          <button
            onClick={close}
            className="text-muted hover:text-ink bg-canvas-elevated p-[4px]"
          >
            <span className="material-icons text-[20px]">close</span>
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto" onClick={close}>
          {children}
        </nav>

        <div className="p-sm border-t border-hairline text-caption-uppercase text-muted text-center tracking-[0.1em] shrink-0">
          © 2026 Launchpad
        </div>
      </div>
    </>
  );
}
