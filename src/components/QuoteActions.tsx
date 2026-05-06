'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { deleteQuote } from '@/app/actions/quotes';
import { useTranslations } from 'next-intl';

interface QuoteActionsProps {
  quoteId: string;
}

export default function QuoteActions({ quoteId }: QuoteActionsProps) {
  const t = useTranslations('Dashboard.recentQuotes');
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteQuote(quoteId);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la cotización.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-3 relative">
      <Link 
        href={`/dashboard/quotes/edit/${quoteId}`}
        className="text-slate-500 hover:text-blue-600 transition-colors"
        title={t('edit')}
      >
        <span className="material-icons text-[18px]">edit</span>
      </Link>
      <Link 
        href={`/api/quotes/${quoteId}/pdf`} 
        className="text-slate-500 hover:text-blue-600 transition-colors"
        title={t('download')}
      >
        <span className="material-icons text-[18px]">picture_as_pdf</span>
      </Link>

      <button
        onClick={async () => {
          if (confirm('¿Convertir esta cotización en una factura?')) {
            const { convertQuoteToInvoice } = await import('@/app/actions/invoices');
            await convertQuoteToInvoice(quoteId);
            router.push('/dashboard/invoices');
          }
        }}
        className="text-slate-500 hover:text-green-600 transition-colors"
        title="Convertir a Factura"
      >
        <span className="material-icons text-[18px]">receipt_long</span>
      </button>
      
      {showConfirm ? (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 absolute right-0 -top-1 shadow-lg z-10">
          <span className="text-xs font-bold text-red-600 whitespace-nowrap">{t('confirmDelete')}</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            {isDeleting ? '...' : t('yes')}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-xs font-bold text-red-400 hover:text-red-600 px-2 py-1 transition-colors"
          >
            {t('no')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-slate-400 hover:text-red-500 transition-colors"
          title={t('delete')}
        >
          <span className="material-icons text-[18px]">delete_outline</span>
        </button>
      )}
    </div>
  );
}
