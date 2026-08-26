'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { deleteRfi, duplicateRfi } from '@/app/actions/rfis';
import { useTranslations, useLocale } from 'next-intl';

interface RfiActionsProps {
  rfiId: string;
}

export default function RfiActions({ rfiId }: RfiActionsProps) {
  const t = useTranslations('Dashboard.recentQuotes');
  const tRfi = useTranslations('Rfis');
  const locale = useLocale();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRfi(rfiId);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(locale === 'es' ? 'Error al eliminar el RFI' : 'Error deleting RFI');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2 relative">
      <Link 
        href={`/rfis/${rfiId}/preview`}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors"
        title="Ver Preview"
        target="_blank"
      >
        <span className="material-icons text-[18px]">visibility</span>
      </Link>
      <Link 
        href={`/dashboard/rfis/edit/${rfiId}`}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary transition-colors"
        title={t('edit')}
      >
        <span className="material-icons text-[18px]">edit</span>
      </Link>
      <button
        onClick={async () => {
          if (isDuplicating) return;
          setIsDuplicating(true);
          try {
            const newRfi = await duplicateRfi(rfiId);
            router.push(`/dashboard/rfis/edit/${newRfi.id}`);
            router.refresh();
          } catch (error) {
            console.error(error);
            alert(tRfi('duplicateError') || 'Error al duplicar el RFI.');
            setIsDuplicating(false);
          }
        }}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-amber-500 transition-colors"
        title={tRfi('duplicate') || 'Duplicar'}
        disabled={isDuplicating}
      >
        <span className="material-icons text-[18px]">
          {isDuplicating ? 'sync' : 'content_copy'}
        </span>
      </button>
      <a 
        href={`/api/rfis/${rfiId}/pdf?locale=${locale}`} 
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary transition-colors"
        title={t('download')}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="material-icons text-[18px]">picture_as_pdf</span>
      </a>
      
      {showConfirm ? (
        <div className="flex items-center space-x-2 bg-semantic-error/10 border border-semantic-error/30 px-3 py-1 absolute right-0 -top-1 shadow-lg z-10">
          <span className="text-xs font-bold text-semantic-error whitespace-nowrap">{t('confirmDelete')}</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs font-bold text-black bg-semantic-error hover:bg-semantic-error/80 px-2 py-0.5 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '...' : t('yes')}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-xs font-bold text-muted hover:text-ink px-1 py-0.5 transition-colors"
          >
            {t('no')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-semantic-error transition-colors"
          title={t('delete')}
        >
          <span className="material-icons text-[18px]">delete_outline</span>
        </button>
      )}
    </div>
  );
}
