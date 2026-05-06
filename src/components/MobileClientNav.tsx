'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';

export function MobileClientNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-white hover:text-blue-400 transition-colors mr-4"
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
        className={`fixed inset-y-0 left-0 w-64 bg-[#0a041a] shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
          <h1 className="text-xl font-black tracking-tighter" style={{ WebkitTextStroke: '1px white', color: 'transparent' }}>MARVAL</h1>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1">
            <span className="material-icons">close</span>
          </button>
        </div>

        <nav className="flex-grow mt-6 px-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link href="/client-portal" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white">
                <span className="material-icons mr-3 text-[18px] text-blue-400">dashboard</span> Resumen
              </Link>
            </li>
            <li>
              <Link href="/client-portal/servers" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white">
                <span className="material-icons mr-3 text-[18px] text-blue-400">dns</span> Mis Servidores
              </Link>
            </li>
            <li>
              <Link href="/client-portal/quotes" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white">
                <span className="material-icons mr-3 text-[18px] text-blue-400">description</span> Mis Cotizaciones
              </Link>
            </li>
            <li>
              <Link href="/client-portal/invoices" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white">
                <span className="material-icons mr-3 text-[18px] text-blue-400">receipt_long</span> Mis Facturas
              </Link>
            </li>
            <li>
              <Link href="/client-portal/tickets" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white">
                <span className="material-icons mr-3 text-[18px] text-blue-400">support_agent</span> Soporte Técnico
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
