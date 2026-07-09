'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SidebarDropdown({
  title,
  icon,
  children,
  activePaths = [],
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  activePaths?: string[];
}) {
  const pathname = usePathname();
  // Check if current path matches any active paths
  const isPathActive = activePaths.some(path => pathname.includes(path));
  
  const [isOpen, setIsOpen] = useState(isPathActive);

  // Re-evaluate when pathname changes if it matches to auto-open
  useEffect(() => {
    if (activePaths.some(path => pathname.includes(path))) {
      setIsOpen(true);
    }
  }, [pathname, activePaths]);

  return (
    <li className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[48px] flex items-center justify-between px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink cursor-pointer"
      >
        <div className="flex items-center">
          <span className="material-icons mr-xxs text-sm opacity-70">{icon}</span>
          {title}
        </div>
        <span className={`material-icons text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <ul className="pl-6 mt-[2px] space-y-[2px]">
          {children}
        </ul>
      </div>
    </li>
  );
}
