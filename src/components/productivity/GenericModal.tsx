'use client';

import { ReactNode } from 'react';

interface GenericModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function GenericModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'max-w-[32rem]'
}: GenericModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#181818]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative bg-canvas-elevated w-full ${maxWidth} border border-hairline flex flex-col min-h-0 overflow-hidden max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]`}>
        {/* Header */}
        <div className="px-sm pt-sm pb-xs border-b border-hairline shrink-0 flex justify-between items-center">
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider">{title}</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink transition-all"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-sm overflow-y-auto flex-1 min-h-0 space-y-sm [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-hairline [&::-webkit-scrollbar-thumb]:rounded-full [-ms-overflow-style:none] [scrollbar-width:thin]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-sm pb-sm pt-4 shrink-0 flex space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
