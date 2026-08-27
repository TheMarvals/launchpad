'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { deletePitch, duplicatePitch } from '@/app/actions/pitches';
import { useTranslations, useLocale } from 'next-intl';

interface PitchActionsProps {
  pitchId: string;
}

export default function PitchActions({ pitchId }: PitchActionsProps) {
  const t = useTranslations('Dashboard.recentQuotes');
  const tPitch = useTranslations('Pitches');
  const locale = useLocale();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePitch(pitchId);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el Pitch.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${locale}/pitches/${pitchId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-end space-x-2 relative">
      <Link 
        href={`/pitches/${pitchId}`}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary transition-colors"
        title="Ver Presentación"
        target="_blank"
      >
        <span className="material-icons text-[18px]">slideshow</span>
      </Link>

      <a
        href={`/api/pitches/${pitchId}/pdf`}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary transition-colors"
        title="Descargar PDF"
        target="_blank"
        rel="noreferrer"
        download
      >
        <span className="material-icons text-[18px]">picture_as_pdf</span>
      </a>

      <button
        onClick={handleCopyLink}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors"
        title={copied ? '¡Enlace copiado!' : 'Copiar enlace público'}
      >
        <span className="material-icons text-[18px]">{copied ? 'check' : 'link'}</span>
      </button>

      <Link 
        href={`/dashboard/pitches/edit/${pitchId}`}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors"
        title={t('edit')}
      >
        <span className="material-icons text-[18px]">edit</span>
      </Link>

      <button
        onClick={async () => {
          if (isDuplicating) return;
          setIsDuplicating(true);
          try {
            const newPitch = await duplicatePitch(pitchId);
            router.push(`/dashboard/pitches/edit/${newPitch.id}`);
            router.refresh();
          } catch (error) {
            console.error(error);
            alert(tPitch('duplicateError') || 'Error al duplicar el Pitch.');
            setIsDuplicating(false);
          }
        }}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-amber-500 transition-colors"
        title={tPitch('duplicate') || 'Duplicar'}
        disabled={isDuplicating}
      >
        <span className="material-icons text-[18px]">
          {isDuplicating ? 'sync' : 'content_copy'}
        </span>
      </button>

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
