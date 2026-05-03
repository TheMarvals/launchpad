'use client';

import { ReactNode } from 'react';

interface GenericModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
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
  maxWidth = 'max-w-lg'
}: GenericModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0a041a]/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative bg-white w-full ${maxWidth} rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          <div className="space-y-6">
            {children}
          </div>

          {footer && (
            <div className="pt-8 flex space-x-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
