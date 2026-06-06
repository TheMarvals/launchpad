'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createAdmin, deleteAdmin, updateAdmin, resetAdminPassword } from '@/app/actions/settings';
import Swal from 'sweetalert2';
import GenericModal from '../productivity/GenericModal';

interface TeamManagementBoardProps {
  initialAdmins: any[];
}

export default function TeamManagementBoard({ initialAdmins }: TeamManagementBoardProps) {
  const t = useTranslations('Settings.team');
  const locale = useLocale();
  const [admins, setAdmins] = useState(initialAdmins);
  
  // Add Admin / Edit Admin Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  // Password Reset Modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetAdmin, setResetAdmin] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAdmin = async () => {
    if (!formData.name || !formData.email) {
      Swal.fire('Error', t('requiredFields'), 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      if (editingAdmin) {
        const updated = await updateAdmin(editingAdmin.id, { name: formData.name, email: formData.email });
        setAdmins(admins.map(a => a.id === editingAdmin.id ? updated : a));
        setIsModalOpen(false);
        setEditingAdmin(null);
        setFormData({ name: '', email: '', password: '' });
        Swal.fire('Success', t('updateSuccess') || 'Admin updated successfully', 'success');
      } else {
        const newAdmin = await createAdmin(formData);
        setAdmins([newAdmin, ...admins]);
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '' });
        Swal.fire('Success', t('createSuccess'), 'success');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || (editingAdmin ? t('updateError') || 'Error updating admin' : t('createError')), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Swal.fire('Error', t('passwordRequired') || 'Password is required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await resetAdminPassword(resetAdmin.id, newPassword);
      setIsResetOpen(false);
      setResetAdmin(null);
      setNewPassword('');
      Swal.fire('Success', t('passwordResetSuccess') || 'Password reset successfully', 'success');
    } catch (error: any) {
      Swal.fire('Error', error.message || t('passwordResetError') || 'Error resetting password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: t('deleteTitle'),
      text: t('deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('deleteCancel'),
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteAdmin(id);
        setAdmins(admins.filter(a => a.id !== id));
        Swal.fire('Deleted!', t('deleteSuccess'), 'success');
      } catch (error: any) {
        Swal.fire('Error', error.message || t('deleteError'), 'error');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm">
        <div>
          <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h1>
          <p className="text-body text-muted text-sm mt-[2px]">{t('subtitle')}</p>
        </div>
        <button 
          onClick={() => {
            setEditingAdmin(null);
            setFormData({ name: '', email: '', password: '' });
            setIsModalOpen(true);
          }}
          className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center justify-center border border-transparent"
        >
          <span className="material-icons mr-xxs text-sm">person_add</span> {t('newAdmin')}
        </button>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-hairline">
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs">{t('table.name')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs">{t('table.email')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs">{t('table.status')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs">{t('table.joined')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-sm py-lg text-center text-muted text-sm">
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-hairline hover:bg-canvas transition-colors">
                    <td className="px-sm py-xs">
                      <div className="font-semibold text-ink text-sm uppercase tracking-wider">{admin.name}</div>
                    </td>
                    <td className="px-sm py-xs text-muted text-sm">{admin.email}</td>
                    <td className="px-sm py-xs">
                      <span className={`text-[10px] font-semibold px-xxs py-[1px] uppercase tracking-widest ${admin.isActive ? 'bg-semantic-success/10 text-semantic-success' : 'bg-semantic-danger/10 text-semantic-danger'}`}>
                        {admin.isActive ? t('status.active') : t('status.inactive')}
                      </span>
                    </td>
                    <td className="px-sm py-xs text-muted text-sm">
                      {new Date(admin.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td className="px-sm py-xs text-right space-x-xxs">
                      <button 
                        onClick={() => {
                          setEditingAdmin(admin);
                          setFormData({ name: admin.name, email: admin.email, password: '' });
                          setIsModalOpen(true);
                        }}
                        className="text-muted hover:text-ink transition-colors p-xxs cursor-pointer"
                        title={t('editAdmin') || 'Edit Admin'}
                      >
                        <span className="material-icons text-sm">edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          setResetAdmin(admin);
                          setNewPassword('');
                          setIsResetOpen(true);
                        }}
                        className="text-muted hover:text-ink transition-colors p-xxs cursor-pointer"
                        title={t('resetPassword') || 'Reset Password'}
                      >
                        <span className="material-icons text-sm">key</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(admin.id)}
                        className="text-muted hover:text-semantic-warning transition-colors p-xxs cursor-pointer"
                        title={t('deleteAdmin')}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Admin Modal */}
      <GenericModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAdmin(null);
          setFormData({ name: '', email: '', password: '' });
        }}
        title={editingAdmin ? (t('editAdmin') || 'Editar Administrador') : t('newAdmin')}
      >
        <div className="space-y-sm">
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('form.name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
              placeholder={t('form.namePlaceholder')}
            />
          </div>
          
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('form.email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
              placeholder={t('form.emailPlaceholder')}
            />
          </div>

          {!editingAdmin && (
            <div className="space-y-xxs">
              <label className="block text-caption-uppercase text-ink font-semibold">{t('form.password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
                placeholder={t('form.passwordPlaceholder')}
              />
              <p className="text-xs text-muted mt-xxs">{t('form.passwordHelp')}</p>
            </div>
          )}

          <div className="pt-xs border-t border-hairline flex justify-end gap-xxs">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingAdmin(null);
                setFormData({ name: '', email: '', password: '' });
              }}
              className="px-sm py-xxs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {t('form.cancel')}
            </button>
            <button
              onClick={handleSaveAdmin}
              disabled={isSaving}
              className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? t('form.saving') : t('form.save')}
            </button>
          </div>
        </div>
      </GenericModal>

      {/* Manual Password Reset Modal */}
      <GenericModal
        isOpen={isResetOpen}
        onClose={() => {
          setIsResetOpen(false);
          setResetAdmin(null);
          setNewPassword('');
        }}
        title={t('resetPassword') || 'Restablecer Contraseña'}
      >
        <div className="space-y-sm">
          <p className="text-sm text-muted">
            {t('resetPasswordHelp') || 'Introduce una nueva contraseña para'} <strong className="text-ink">{resetAdmin?.name}</strong>.
          </p>
          
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('form.password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
              placeholder={t('form.newPasswordPlaceholder') || 'Nueva Contraseña'}
              required
            />
          </div>

          <div className="pt-xs border-t border-hairline flex justify-end gap-xxs">
            <button
              onClick={() => {
                setIsResetOpen(false);
                setResetAdmin(null);
                setNewPassword('');
              }}
              className="px-sm py-xxs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {t('form.cancel')}
            </button>
            <button
              onClick={handleResetPassword}
              disabled={isSaving}
              className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? t('form.saving') : (t('form.save') || 'Guardar')}
            </button>
          </div>
        </div>
      </GenericModal>
    </div>
  );
}
