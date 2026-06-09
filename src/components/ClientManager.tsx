'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, updateClient, deleteClient } from '@/app/actions/clients';
import { useTranslations, useLocale } from 'next-intl';
import EmptyState from '@/components/EmptyState';

interface Client {
  id: string;
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  email: string | null;
  telefono: string | null;
  _count: { quotes: number };
}

interface ClientManagerProps {
  clients: Client[];
}

const emptyForm = {
  rut: '',
  razonSocial: '',
  giro: '',
  direccion: '',
  comuna: '',
  ciudad: '',
  email: '',
  telefono: '',
};

export default function ClientManager({ clients }: ClientManagerProps) {
  const t = useTranslations('Clients');
  const tCommon = useTranslations('Dashboard.recentQuotes');
  const router = useRouter();
  const locale = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (client: Client) => {
    setForm({
      rut: client.rut,
      razonSocial: client.razonSocial,
      giro: client.giro,
      direccion: client.direccion,
      comuna: client.comuna,
      ciudad: client.ciudad,
      email: client.email || '',
      telefono: client.telefono || '',
    });
    setEditingId(client.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rut || !form.razonSocial || !form.giro || !form.direccion || !form.comuna || !form.ciudad) {
      setError(t('form.requiredFields'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await updateClient(editingId, form);
      } else {
        await createClient(form);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || t('form.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
      setDeletingId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || t('form.deleteError'));
      setDeletingId(null);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <div className="space-y-sm">
      {/* Action bar */}
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-active text-white px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-icons mr-xxs text-sm">add</span> {t('newClient')}
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-md">
          <form
            onSubmit={handleSubmit}
            className="bg-canvas-elevated border border-hairline w-full max-w-2xl p-sm space-y-sm max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-xs border-b border-hairline">
              <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
                <span className="material-icons mr-xxs text-primary">
                  {editingId ? 'edit' : 'person_add'}
                </span>
                {editingId ? t('editClient') : t('newClient')}
              </h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="text-muted hover:text-ink transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {error && (
              <div className="bg-semantic-warning/10 border border-semantic-warning/30 text-semantic-warning text-sm font-medium px-xs py-xxs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.rut')} *</label>
                <input
                  type="text"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.rut}
                  onChange={(e) => updateField('rut', e.target.value)}
                  placeholder={t('form.rutPlaceholder') || '76.543.210-K'}
                  required
                />
              </div>
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.razonSocial')} *</label>
                <input
                  type="text"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.razonSocial}
                  onChange={(e) => updateField('razonSocial', e.target.value)}
                  placeholder={t('form.razonSocialPlaceholder') || 'EMPRESA SPA'}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.giro')} *</label>
                <input
                  type="text"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.giro}
                  onChange={(e) => updateField('giro', e.target.value)}
                  placeholder={t('form.giroPlaceholder') || 'Servicios Informáticos'}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.direction')} *</label>
                <input
                  type="text"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.direccion}
                  onChange={(e) => updateField('direccion', e.target.value)}
                  placeholder={t('form.directionPlaceholder') || 'Av. Providencia 1234'}
                  required
                />
              </div>
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.commune')} *</label>
                <input
                  type="text"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.comuna}
                  onChange={(e) => updateField('comuna', e.target.value)}
                  placeholder={t('form.communePlaceholder') || 'Providencia'}
                  required
                />
              </div>
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.city')} *</label>
                <input
                  type="text"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.ciudad}
                  onChange={(e) => updateField('ciudad', e.target.value)}
                  placeholder={t('form.cityPlaceholder') || 'Santiago'}
                  required
                />
              </div>
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.email')}</label>
                <input
                  type="email"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('form.emailPlaceholder') || 'contacto@empresa.cl'}
                />
              </div>
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.phone')}</label>
                <input
                  type="text"
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={form.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder={t('form.phonePlaceholder') || '+56 9 1234 5678'}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-xxs pt-xs border-t border-hairline">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="bg-transparent border border-hairline text-ink h-[48px] px-sm font-semibold text-xs uppercase tracking-wider hover:bg-canvas transition-colors"
              >
                {tCommon('no')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-on-primary h-[48px] px-md font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><span className="material-icons animate-spin mr-xxs text-sm">sync</span> ...</>
                ) : (
                  <><span className="material-icons mr-xxs text-sm">{editingId ? 'save' : 'add'}</span> {editingId ? t('updateClient') : t('createClient')}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table / Mobile cards */}
      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {clients.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-hairline">
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.razonSocial')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.rut')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.giro')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.contact')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.quotes')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-canvas/80 transition-colors group">
                      <td className="px-sm py-xs font-medium text-ink text-sm">{client.razonSocial}</td>
                      <td className="px-sm py-xs text-body text-muted">{client.rut}</td>
                      <td className="px-sm py-xs text-body text-muted">{client.giro}</td>
                      <td className="px-sm py-xs">
                        <div className="text-sm text-ink">{client.email || '—'}</div>
                        <div className="text-xs text-muted">{client.telefono || ''}</div>
                      </td>
                        <td className="px-sm py-xs">
                        <span className="inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border border-hairline bg-canvas-elevated text-muted">
                          {client._count.quotes}
                        </span>
                      </td>
                      <td className="px-sm py-xs text-right">
                        <div className="flex items-center justify-end space-x-sm opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                            className="p-xxs text-muted hover:text-primary transition-colors"
                            title="Portal & VPS"
                          >
                            <span className="material-icons text-[18px]">cloud</span>
                          </button>
                          <button
                            onClick={() => openEdit(client)}
                            className="p-xxs text-muted hover:text-primary transition-colors"
                            title={tCommon('edit')}
                          >
                            <span className="material-icons text-[18px]">edit</span>
                          </button>

                          {deletingId === client.id ? (
                            <div className="flex items-center space-x-xxs bg-semantic-danger/10 border border-semantic-danger/20 rounded-none px-xxs py-xxs">
                              <span className="text-[10px] font-bold text-semantic-danger uppercase tracking-wider whitespace-nowrap">{tCommon('confirmDelete')}</span>
                              <button
                                onClick={() => handleDelete(client.id)}
                                className="text-[10px] font-bold text-white bg-semantic-danger hover:bg-semantic-danger/80 px-xxs py-[2px] rounded-none transition-colors"
                              >
                                {tCommon('yes')}
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-[10px] font-bold text-semantic-danger hover:text-semantic-danger/80 px-xxs py-[2px] transition-colors"
                              >
                                {tCommon('no')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(client.id)}
                              className="p-xxs text-muted hover:text-semantic-danger transition-colors"
                              title={tCommon('delete')}
                            >
                              <span className="material-icons text-[18px]">delete_outline</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-hairline">
              {clients.map((client, index) => (
                <div key={client.id} className="animate-fade-in px-sm py-xs space-y-xxs hover:bg-canvas/50 transition-colors" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start justify-between gap-xxs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink text-sm">{client.razonSocial}</p>
                      <p className="text-xs text-muted">{client.rut}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border border-hairline bg-canvas-elevated text-muted text-[10px]">
                      {client._count.quotes} {locale === 'es' ? 'cotiz.' : 'quotes'}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{client.giro}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-ink">{client.email || '—'}</p>
                      <p className="text-muted">{client.telefono || ''}</p>
                    </div>
                    <div className="flex items-center gap-xxs">
                      <button
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        className="p-xxs text-muted hover:text-primary transition-colors"
                        title="Portal & VPS"
                      >
                        <span className="material-icons text-[18px]">cloud</span>
                      </button>
                      <button
                        onClick={() => openEdit(client)}
                        className="p-xxs text-muted hover:text-primary transition-colors"
                      >
                        <span className="material-icons text-[18px]">edit</span>
                      </button>
                      {deletingId === client.id ? (
                        <div className="flex items-center gap-[2px]">
                          <button onClick={() => handleDelete(client.id)} className="text-[9px] font-bold text-semantic-danger uppercase tracking-wider">{tCommon('yes')}</button>
                          <button onClick={() => setDeletingId(null)} className="text-[9px] font-bold text-muted uppercase tracking-wider">{tCommon('no')}</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(client.id)} className="p-xxs text-muted hover:text-semantic-danger transition-colors">
                          <span className="material-icons text-[18px]">delete_outline</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState variant="people" message={t('noClients')} />
        )}
      </div>
    </div>
  );
}
