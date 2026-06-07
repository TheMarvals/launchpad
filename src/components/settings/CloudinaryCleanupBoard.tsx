'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { getOrphanedCloudinaryImages, deleteOrphanedImage, deleteAllOrphanedImages } from '@/app/actions/cleanup';
import { sendTestEmail } from '@/app/actions/test-email';
import Swal from 'sweetalert2';

interface OrphanedImage {
  publicId: string;
  url: string;
  createdAt: string;
}

export default function CloudinaryCleanupBoard() {
  const t = useTranslations('Settings.cloudinary');
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [orphaned, setOrphaned] = useState<OrphanedImage[]>([]);
  const [stats, setStats] = useState<{
    totalInCloudinary: number;
    totalInDatabase: number;
    orphanedCount: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    setError('');
    try {
      const result = await getOrphanedCloudinaryImages();
      if (result.error) {
        setError(result.error);
        return;
      }
      setOrphaned(result.orphaned);
      setStats({
        totalInCloudinary: result.totalInCloudinary,
        totalInDatabase: result.totalInDatabase,
        orphanedCount: result.orphanedCount,
      });
      setScanned(true);
    } catch (err: any) {
      setError(err.message || 'Error scanning Cloudinary');
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteOne = async (publicId: string) => {
    const confirm = await Swal.fire({
      title: t('deleteConfirm'),
      text: t('deleteConfirmText', { publicId }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('deleteYes'),
      cancelButtonText: t('cancel'),
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-danger text-white',
        cancelButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-hairline text-ink',
      },
    });

    if (!confirm.isConfirmed) return;

    const result = await deleteOrphanedImage(publicId);
    if (result.success) {
      setOrphaned(prev => prev.filter(img => img.publicId !== publicId));
      Swal.fire({
        title: t('deleted'),
        text: t('deletedText'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
      });
    } else {
      Swal.fire({
        title: t('error'),
        text: result.error || t('error'),
        icon: 'error',
        customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
      });
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.includes('@')) return;
    setSendingTest(true);
    try {
      const result = await sendTestEmail(testEmail);
      if (result.success) {
        Swal.fire({
          title: t('testEmailSent'),
          text: t('testEmailSentText', { email: testEmail }),
          icon: 'success',
          timer: 4000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
        });
        setTestEmail('');
      } else {
        Swal.fire({
          title: t('error'),
          text: result.error || t('testEmailError'),
          icon: 'error',
          customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
        });
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleDeleteAll = async () => {
    if (orphaned.length === 0) return;

    const confirm = await Swal.fire({
      title: t('deleteAllConfirm', { count: orphaned.length }),
      text: t('deleteAllConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('deleteYes'),
      cancelButtonText: t('cancel'),
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-danger text-white',
        cancelButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-hairline text-ink',
      },
    });

    if (!confirm.isConfirmed) return;

    setDeleting(true);
    try {
      const publicIds = orphaned.map(img => img.publicId);
      const result = await deleteAllOrphanedImages(publicIds);

      const failed = result.results.filter(r => r.error);
      if (failed.length > 0) {
        Swal.fire({
          title: t('partialClean'),
          text: t('partialCleanText', { success: result.results.length - failed.length, failed: failed.length }),
          icon: 'warning',
          customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
        });
      } else {
        Swal.fire({
          title: t('cleanComplete'),
          text: t('cleanCompleteText', { count: result.results.length }),
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
        });
      }

      setOrphaned([]);
      setStats(null);
      setScanned(false);
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink' },
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[56rem] space-y-6">
      <div>
        <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h1>
        <p className="text-body text-muted text-sm mt-[2px]">{t('subtitle')}</p>
      </div>

      {/* Scan button */}
      <div className="flex items-center gap-sm">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="bg-primary text-on-primary px-sm h-[40px] text-xs font-bold uppercase tracking-wider border border-transparent hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-xxs cursor-pointer"
        >
          {scanning ? (
            <span className="material-icons animate-spin text-sm">sync</span>
          ) : (
            <span className="material-icons text-sm">search</span>
          )}
          {scanning ? t('scanning') : t('scan')}
        </button>

        {orphaned.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={deleting}
            className="bg-semantic-danger text-white px-sm h-[40px] text-xs font-bold uppercase tracking-wider border border-transparent hover:opacity-80 transition-colors disabled:opacity-50 flex items-center gap-xxs cursor-pointer"
          >
            {deleting ? (
              <span className="material-icons animate-spin text-sm">sync</span>
            ) : (
              <span className="material-icons text-sm">delete_sweep</span>
            )}
            {deleting ? t('deleting') : t('deleteAll', { count: orphaned.length })}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-semantic-danger/10 border border-semantic-danger/30 text-semantic-danger text-sm p-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-sm">
          <div className="bg-canvas-elevated border border-hairline p-sm text-center">
            <div className="text-2xl font-bold text-ink">{stats.totalInCloudinary}</div>
            <div className="text-caption-uppercase text-muted font-semibold mt-xxs">{t('inCloudinary')}</div>
          </div>
          <div className="bg-canvas-elevated border border-hairline p-sm text-center">
            <div className="text-2xl font-bold text-ink">{stats.totalInDatabase}</div>
            <div className="text-caption-uppercase text-muted font-semibold mt-xxs">{t('inDatabase')}</div>
          </div>
          <div className="bg-canvas-elevated border border-hairline p-sm text-center">
            <div className={`text-2xl font-bold ${stats.orphanedCount > 0 ? 'text-semantic-danger' : 'text-semantic-success'}`}>
              {stats.orphanedCount}
            </div>
            <div className="text-caption-uppercase text-muted font-semibold mt-xxs">{t('orphaned')}</div>
          </div>
        </div>
      )}

      {/* Orphaned images list */}
      {scanned && orphaned.length === 0 && !error && (
        <div className="bg-canvas-elevated border border-hairline p-lg text-center">
          <span className="material-icons text-4xl text-semantic-success mb-xs">check_circle</span>
          <p className="text-sm text-muted">{t('noOrphaned')}</p>
        </div>
      )}

      {orphaned.length > 0 && (
        <div className="bg-canvas-elevated border border-hairline overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] gap-0 divide-y divide-hairline">
            {orphaned.map((img) => (
              <div key={img.publicId} className="contents">
                <div className="flex items-center gap-xs p-sm">
                  <img
                    src={img.url}
                    alt={img.publicId}
                    className="w-[48px] h-[48px] object-cover border border-hairline bg-canvas shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-ink truncate">{img.publicId}</div>
                    <div className="text-[10px] text-muted mt-[2px]">
                      {t('uploaded')}: {new Date(img.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center pr-sm">
                  <button
                    onClick={() => handleDeleteOne(img.publicId)}
                    disabled={deleting}
                    className="w-[32px] h-[32px] flex items-center justify-center text-muted hover:text-semantic-danger hover:bg-semantic-danger/10 transition-colors cursor-pointer disabled:opacity-50"
                    title="Eliminar"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Email Section */}
      <div className="border-t border-hairline pt-sm">
        <h2 className="text-caption-uppercase text-ink font-semibold mb-xs">{t('testEmailTitle')}</h2>
        <p className="text-body text-muted text-xs mb-sm">{t('testEmailSubtitle')}</p>
        <div className="flex gap-xxs max-w-md">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t('testEmailPlaceholder')}
            className="flex-grow border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendTest(); } }}
          />
          <button
            onClick={handleSendTest}
            disabled={sendingTest || !testEmail.includes('@')}
            className="bg-primary text-on-primary px-sm h-[40px] text-xs font-bold uppercase tracking-wider border border-transparent hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-xxs cursor-pointer shrink-0"
          >
            {sendingTest ? (
              <span className="material-icons animate-spin text-sm">sync</span>
            ) : (
              <span className="material-icons text-sm">send</span>
            )}
            {sendingTest ? t('testEmailSending') : t('testEmailSend')}
          </button>
        </div>
      </div>
    </div>
  );
}
