'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateCompanyProfile } from '@/app/actions/settings';
import Swal from 'sweetalert2';

interface CompanyProfileBoardProps {
  initialProfile: any;
}

export default function CompanyProfileBoard({ initialProfile }: CompanyProfileBoardProps) {
  const t = useTranslations('Settings.companyProfile');
  const [profile, setProfile] = useState(initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCompanyProfile(profile);
      Swal.fire({
        title: 'Success',
        text: t('success'),
        icon: 'success',
        confirmButtonColor: '#da291c',
        customClass: {
          popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
          confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        }
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: t('error'),
        icon: 'error',
        customClass: {
          popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
          confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[56rem] space-y-8">
      <div>
        <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h1>
        <p className="text-body text-muted text-sm mt-[2px]">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSave} className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('name')}</label>
            <input
              type="text"
              value={profile?.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. EDUARDO MARVAL"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('role')}</label>
            <input
              type="text"
              value={profile?.role || ''}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. LEAD SOLUTION ARCHITECT"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('taxIdLabel')}</label>
            <input
              type="text"
              value={profile?.taxIdLabel || ''}
              onChange={(e) => setProfile({ ...profile, taxIdLabel: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. RUT, TAX ID, NIT"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('taxId')}</label>
            <input
              type="text"
              value={profile?.taxId || ''}
              onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. 27.087.979-9"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('phone')}</label>
            <input
              type="text"
              value={profile?.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. +569 94438833"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('email')}</label>
            <input
              type="email"
              value={profile?.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. e.marval@themarvals.com"
              required
            />
          </div>

          <div className="md:col-span-2 space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('address')}</label>
            <input
              type="text"
              value={profile?.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. ANTONIO BELLET 193 OF 1210 12P, PROVIDENCIA, RM"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('brandNameHeader')}</label>
            <input
              type="text"
              value={profile?.brandNameHeader || ''}
              onChange={(e) => setProfile({ ...profile, brandNameHeader: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. LAUNCHPAD"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('brandNameFooter')}</label>
            <input
              type="text"
              value={profile?.brandNameFooter || ''}
              onChange={(e) => setProfile({ ...profile, brandNameFooter: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. EDUARDO MARVAL"
              required
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('systemsTitle')}</label>
            <input
              type="text"
              value={profile?.systemsTitle || ''}
              onChange={(e) => setProfile({ ...profile, systemsTitle: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. SYSTEMS ARCHITECTURE"
            />
          </div>

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('systemsSubtitle')}</label>
            <input
              type="text"
              value={profile?.systemsSubtitle || ''}
              onChange={(e) => setProfile({ ...profile, systemsSubtitle: e.target.value })}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              placeholder="e.g. IT CONSULTING • SOFTWARE ENGINEERING"
            />
          </div>
        </div>

        <div className="pt-xs border-t border-hairline flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center border border-transparent"
          >
            {isSaving ? (
              <span className="material-icons animate-spin mr-xxs text-sm">sync</span>
            ) : (
              <span className="material-icons mr-xxs text-sm">save</span>
            )}
            {t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
