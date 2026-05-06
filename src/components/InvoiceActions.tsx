'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { deleteInvoice, updateInvoiceStatus } from '@/app/actions/invoices';
import { useTranslations } from 'next-intl';

interface InvoiceActionsProps {
  invoice: any;
}

export default function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const t = useTranslations('Dashboard.recentQuotes');
  const tInv = useTranslations('Invoices');
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoice(invoice.id);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la factura.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      setShowStatusMenu(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado.');
    }
  };

  return (
    <div className="flex items-center justify-end space-x-3 relative">
      <div className="relative">
        <button 
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="text-slate-500 hover:text-blue-600 transition-colors"
          title="Cambiar Estado"
        >
          <span className="material-icons text-[18px]">sync_alt</span>
        </button>

        {showStatusMenu && (
          <div className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 w-32 z-50 overflow-hidden">
            <button 
              onClick={() => handleStatusChange('Pendiente')}
              className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 transition-colors"
            >
              {tInv('status.Pendiente')}
            </button>
            <button 
              onClick={() => handleStatusChange('Pagada')}
              className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-50 transition-colors"
            >
              {tInv('status.Pagada')}
            </button>
            <button 
              onClick={() => handleStatusChange('Anulada')}
              className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
            >
              {tInv('status.Anulada')}
            </button>
          </div>
        )}
      </div>

      <Link 
        href={`/dashboard/invoices/edit/${invoice.id}`}
        className="text-slate-500 hover:text-blue-600 transition-colors"
        title={t('edit')}
      >
        <span className="material-icons text-[18px]">edit</span>
      </Link>
      <Link 
        href={`/api/invoices/${invoice.id}/pdf`} 
        className="text-slate-500 hover:text-blue-600 transition-colors"
        title={t('download')}
      >
        <span className="material-icons text-[18px]">picture_as_pdf</span>
      </Link>
      
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
