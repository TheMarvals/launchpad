'use client';

import { useState } from 'react';
import type { EmailSenderIdentity } from '@prisma/client';
import { useTranslations } from 'next-intl';
import Swal from 'sweetalert2';
import {
  createEmailSenderIdentity,
  deleteEmailSenderIdentity,
  updateEmailSenderIdentity,
} from '@/app/actions/settings';

interface IdentityForm {
  email: string;
  displayName: string;
  signature: string;
  isActive: boolean;
}

const EMPTY_FORM: IdentityForm = {
  email: '',
  displayName: '',
  signature: '',
  isActive: true,
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function EmailSenderIdentitiesBoard({
  initialIdentities,
}: {
  initialIdentities: EmailSenderIdentity[];
}) {
  const t = useTranslations('Settings.emailSenders');
  const [identities, setIdentities] = useState(initialIdentities);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IdentityForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (identity: EmailSenderIdentity) => {
    setEditingId(identity.id);
    setForm({
      email: identity.email,
      displayName: identity.displayName,
      signature: identity.signature,
      isActive: identity.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const savedIdentity = editingId
        ? await updateEmailSenderIdentity(editingId, form)
        : await createEmailSenderIdentity(form);

      setIdentities((current) => {
        const next = editingId
          ? current.map((identity) => identity.id === savedIdentity.id ? savedIdentity : identity)
          : [...current, savedIdentity];
        return next.sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.email.localeCompare(b.email));
      });
      closeForm();
      await Swal.fire({
        icon: 'success',
        title: t('saved'),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: t('saveError'),
        text: errorMessage(error, t('saveError')),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (identity: EmailSenderIdentity) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: t('deleteTitle'),
      text: t('deleteText', { email: identity.email }),
      showCancelButton: true,
      confirmButtonText: t('delete'),
      cancelButtonText: t('cancel'),
      confirmButtonColor: '#da291c',
    });

    if (!confirmation.isConfirmed) return;

    try {
      await deleteEmailSenderIdentity(identity.id);
      setIdentities((current) => current.filter((item) => item.id !== identity.id));
      if (editingId === identity.id) closeForm();
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: t('deleteError'),
        text: errorMessage(error, t('deleteError')),
      });
    }
  };

  return (
    <div className="max-w-[64rem] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h2>
          <p className="text-body text-muted text-sm mt-[2px] max-w-2xl">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors shrink-0"
        >
          <span className="material-icons text-sm align-middle mr-1">add</span>
          {t('new')}
        </button>
      </div>

      <div className="border border-hairline bg-canvas-elevated p-sm text-xs text-muted">
        <span className="material-icons text-[16px] align-middle mr-2 text-primary">verified_user</span>
        {t('securityNote')}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="border border-primary/40 bg-canvas-elevated p-sm space-y-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            <label className="space-y-xxs">
              <span className="block text-caption-uppercase text-ink font-semibold">{t('email')}</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="contact@thelaunchpad.help"
                className="w-full border border-hairline bg-canvas px-xs py-xxs text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-xxs">
              <span className="block text-caption-uppercase text-ink font-semibold">{t('displayName')}</span>
              <input
                type="text"
                required
                maxLength={100}
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="LAUNCHPAD Contacto"
                className="w-full border border-hairline bg-canvas px-xs py-xxs text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="block space-y-xxs">
            <span className="block text-caption-uppercase text-ink font-semibold">{t('signature')}</span>
            <textarea
              rows={5}
              maxLength={2000}
              value={form.signature}
              onChange={(event) => setForm((current) => ({ ...current, signature: event.target.value }))}
              placeholder={t('signaturePlaceholder')}
              className="w-full border border-hairline bg-canvas px-xs py-xxs text-sm outline-none focus:border-primary resize-y"
            />
            <span className="block text-[10px] text-muted">{t('signatureHelp')}</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="accent-primary"
            />
            {t('active')}
          </label>

          <div className="flex justify-end gap-2 pt-xs border-t border-hairline">
            <button type="button" onClick={closeForm} className="px-sm py-xs text-xs font-semibold uppercase text-muted hover:text-ink">
              {t('cancel')}
            </button>
            <button type="submit" disabled={saving} className="bg-primary text-on-primary px-sm py-xs text-xs font-semibold uppercase disabled:opacity-50">
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      )}

      {identities.length === 0 ? (
        <div className="border border-dashed border-hairline p-lg text-center text-muted text-sm">{t('empty')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-sm">
          {identities.map((identity) => (
            <article key={identity.id} className={`border p-sm space-y-sm ${identity.isActive ? 'border-hairline bg-canvas-elevated' : 'border-hairline bg-canvas opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink truncate">{identity.displayName}</h3>
                  <p className="text-xs text-primary truncate">{identity.email}</p>
                </div>
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 border ${identity.isActive ? 'text-emerald-400 border-emerald-400/30' : 'text-muted border-hairline'}`}>
                  {identity.isActive ? t('enabled') : t('disabled')}
                </span>
              </div>

              <pre className="min-h-16 whitespace-pre-wrap font-sans text-xs text-muted border-l-2 border-hairline pl-3">
                {identity.signature || t('noSignature')}
              </pre>

              <div className="flex justify-end gap-2 pt-xs border-t border-hairline">
                <button type="button" onClick={() => openEditForm(identity)} className="text-xs font-semibold uppercase text-muted hover:text-primary">
                  {t('edit')}
                </button>
                <button type="button" onClick={() => void handleDelete(identity)} className="text-xs font-semibold uppercase text-red-400 hover:text-red-300">
                  {t('delete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
