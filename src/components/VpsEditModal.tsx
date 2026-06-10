'use client';

import React, { useState } from 'react';
import { updateVpsService } from '@/app/actions/portal';
import { useTranslations } from 'next-intl';
import Swal from 'sweetalert2';

export default function VpsEditModal({ server }: { server: any }) {
  const t = useTranslations('ClientDetails');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: server.name || '',
    hostname: server.hostname || '',
    ipAddress: server.ipAddress || '',
    providerId: server.providerId || '',
    dueDate: server.dueDate ? new Date(server.dueDate).toISOString().split('T')[0] : ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = {
      ...formData,
      dueDate: formData.dueDate || null,
    };

    const res = await updateVpsService(server.id, dataToSubmit);

    if (res.error) {
      Swal.fire({
        title: t('error') || 'Error',
        text: res.error,
        icon: 'error',
        customClass: {
          popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
          confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        }
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: t('saved') || 'Guardado',
        text: t('vpsUpdated') || 'Datos del VPS actualizados.',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          popup: 'border border-hairline bg-canvas-elevated text-ink',
        }
      });
      setIsOpen(false);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-muted hover:text-primary transition-colors"
        title={t('editVps') || 'Editar VPS'}
      >
        <span className="material-icons text-[18px]">edit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-ink/90 backdrop-blur-md z-50 flex items-center justify-center p-sm">
          <div className="bg-canvas-elevated border border-hairline w-full max-w-md">
            <div className="p-sm border-b border-hairline flex justify-between items-center">
              <h3 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
                <span className="material-icons mr-xxs text-primary">dns</span>
                {t('editVps') || 'Editar VPS'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink transition-colors">
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-sm space-y-sm">
              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">{t('friendlyName')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                  placeholder={t('friendlyNamePlaceholderVps') || 'Ej: Liceo A1 Web'}
                />
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">{t('hostnameLabel') || 'Hostname (Público)'}</label>
                <input
                  type="text"
                  name="hostname"
                  value={formData.hostname}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                  placeholder={t('hostnamePlaceholder') || 'Ej: srv1.launchpad.host'}
                />
                <p className="text-xs text-muted mt-[2px]">{t('hostnameHelp') || 'Este nombre se mostrará al cliente en lugar de la IP.'}</p>
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">{t('ipAssignedLabel') || 'IP Asignada'}</label>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                  placeholder={t('ipAddressPlaceholder') || 'Ej: 192.168.1.100'}
                />
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">{t('providerVpsLabel') || 'ID del Proveedor (VPS)'}</label>
                <input
                  type="text"
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  required
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                  placeholder={t('providerIdPlaceholderVps') || 'Ej: 893450'}
                />
                <p className="text-xs text-muted mt-[2px]">{t('providerIdHelp') || 'Este ID vincula las acciones (Start, Stop) con la API del proveedor cloud.'}</p>
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">{t('dueDateLabel') || 'Fecha de Vencimiento (Opcional)'}</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                />
              </div>

              <div className="flex justify-end gap-xs pt-sm border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-sm py-xs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center border border-transparent"
                >
                  {loading ? (
                    <span className="material-icons animate-spin text-[18px]">sync</span>
                  ) : (
                    t('saveChanges') || 'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
