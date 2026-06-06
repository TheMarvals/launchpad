'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { createClientUser, bindVpsServer } from '@/app/actions/portal';

export function AddUserModal({ clientId, onClose }: { clientId: string, onClose: () => void }) {
  const t = useTranslations('ClientDetails');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await createClientUser(clientId, { name, email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-xxs" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-canvas-elevated border border-hairline w-[400px] max-w-full overflow-hidden">
        <div className="p-sm border-b border-hairline">
          <h3 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
            <span className="material-icons mr-xxs text-primary">person_add</span>
            {t('modalUserTitle')}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-sm space-y-xxs">
            {error && (
              <div className="text-xs font-semibold text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/30 p-xxs">
                {error}
              </div>
            )}

            <div className="space-y-xxs">
              <label className="block text-caption-uppercase text-ink font-semibold">{t('name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              />
            </div>
            <div className="space-y-xxs">
              <label className="block text-caption-uppercase text-ink font-semibold">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              />
            </div>
            <div className="space-y-xxs">
              <label className="block text-caption-uppercase text-ink font-semibold">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-xxs p-sm border-t border-hairline bg-canvas">
            <button
              type="button"
              onClick={onClose}
              className="px-sm py-xxs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all disabled:opacity-50 border border-transparent flex items-center cursor-pointer"
            >
              {loading ? (
                <span className="material-icons animate-spin text-[18px]">sync</span>
              ) : (
                t('save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddVpsModal({ clientId, onClose }: { clientId: string, onClose: () => void }) {
  const t = useTranslations('ClientDetails');
  const router = useRouter();
  const [name, setName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await bindVpsServer(clientId, { name, providerId, ipAddress });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-xxs" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-canvas-elevated border border-hairline w-[400px] max-w-full overflow-hidden">
        <div className="p-sm border-b border-hairline">
          <h3 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
            <span className="material-icons mr-xxs text-primary">dns</span>
            {t('modalServerTitle')}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-sm space-y-xxs">
            {error && (
              <div className="text-xs font-semibold text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/30 p-xxs">
                {error}
              </div>
            )}

            <div className="space-y-xxs">
              <label className="block text-caption-uppercase text-ink font-semibold">{t('friendlyName')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Hosting Liceo"
                required
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              />
            </div>
            <div className="space-y-xxs">
              <label className="block text-caption-uppercase text-ink font-semibold">{t('providerId')}</label>
              <input
                type="text"
                value={providerId}
                onChange={e => setProviderId(e.target.value)}
                placeholder="Ej: 123456"
                required
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              />
            </div>
            <div className="space-y-xxs">
              <label className="block text-caption-uppercase text-ink font-semibold">{t('ipAddress')}</label>
              <input
                type="text"
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
                placeholder="Ej: 192.168.1.1"
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-xxs p-sm border-t border-hairline bg-canvas">
            <button
              type="button"
              onClick={onClose}
              className="px-sm py-xxs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all disabled:opacity-50 border border-transparent flex items-center cursor-pointer"
            >
              {loading ? (
                <span className="material-icons animate-spin text-[18px]">sync</span>
              ) : (
                t('link')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PortalManagerButtons({ clientId }: { clientId: string }) {
  const t = useTranslations('ClientDetails');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showVpsModal, setShowVpsModal] = useState(false);

  return (
    <>
      <div className="flex flex-row gap-xxs w-full sm:w-auto">
        <button
          onClick={() => setShowUserModal(true)}
          className="flex-1 sm:flex-initial bg-primary hover:bg-primary-active text-white px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-icons mr-xxs text-[16px]">person_add</span>
          {t('addUser')}
        </button>
        <button
          onClick={() => setShowVpsModal(true)}
          className="flex-1 sm:flex-initial bg-transparent border border-ink text-ink hover:bg-ink/10 px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-icons mr-xxs text-[16px]">dns</span>
          {t('addServer')}
        </button>
      </div>

      {showUserModal && <AddUserModal clientId={clientId} onClose={() => setShowUserModal(false)} />}
      {showVpsModal && <AddVpsModal clientId={clientId} onClose={() => setShowVpsModal(false)} />}
    </>
  );
}
