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
      <div className={`relative bg-canvas-elevated w-full ${maxWidth} border border-hairline overflow-hidden`}>
        <div className="p-sm">
          <div className="flex justify-between items-center pb-xs border-b border-hairline">
            <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider">{title}</h2>
            <button 
              onClick={onClose}
              className="text-muted hover:text-ink transition-all"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          <div className="pt-sm space-y-sm">
            {children}
          </div>

          {footer && (
            <div className="pt-4 flex space-x-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
