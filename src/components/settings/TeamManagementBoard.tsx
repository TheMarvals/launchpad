'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createAdmin, deleteAdmin, updateAdmin, resetAdminPassword } from '@/app/actions/settings';
import EmptyState from '@/components/EmptyState';
import { PERMISSION_GROUPS, ALL_PERMISSIONS, type Permission } from '@/lib/permissions';
import Swal from 'sweetalert2';
import { swalTheme } from '@/lib/swal-theme';
import GenericModal from '../productivity/GenericModal';

interface TeamManagementBoardProps {
  initialAdmins: any[];
  currentUserId?: string;
}

export default function TeamManagementBoard({ initialAdmins, currentUserId }: TeamManagementBoardProps) {
  const t = useTranslations('Settings.team');
  const locale = useLocale();
  const [admins, setAdmins] = useState(initialAdmins);
  
  // Add Admin / Edit Admin Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Password Reset Modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetAdmin, setResetAdmin] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [showCopySelector, setShowCopySelector] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(PERMISSION_GROUPS.map((g) => g.label)));

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    if (!permissionSearch.trim()) return PERMISSION_GROUPS;
    const q = permissionSearch.toLowerCase();
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter((p) =>
        p.labelKey.toLowerCase().includes(q)
      ),
    })).filter((g) => g.permissions.length > 0);
  }, [permissionSearch]);

  const isEditingSelf = editingAdmin && currentUserId && editingAdmin.id === currentUserId;

  // Toast notification for non-blocking feedback
  const showToast = (icon: 'success' | 'error', title: string) => {
    Swal.fire({
      icon,
      title,
      toast: true,
      position: 'top-end',
      timer: 2500,
      showConfirmButton: false,
      showClass: {
        popup: 'animate-in fade-in zoom-in-95 duration-200',
      },
      hideClass: {
        popup: 'animate-out fade-out zoom-out-95 duration-150',
      },
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
      },
    });
  };

  const handleSaveAdmin = async () => {
    if (!formData.name || !formData.email) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('requiredFields') });
      return;
    }

    // Warn if removing own access to critical permissions
    const CRITICAL_PERMISSIONS = ['settings', 'dashboard', 'clients', 'quotes'] as const;
    const removedCritical = CRITICAL_PERMISSIONS.filter(
      (p) => editingAdmin?.permissions?.includes(p) && !selectedPermissions.includes(p)
    );
    if (isEditingSelf && removedCritical.length > 0) {
      const warningText = removedCritical.map((p) => {
        const key = `${p}Warning` as const;
        return t(`form.${key}`);
      }).filter(Boolean).join('\n\n') ||
        'Te quitarás acceso a funciones críticas. ¿Estás seguro?';

      const confirm = await Swal.fire({
        title: t('form.warning') || 'Advertencia',
        text: warningText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('form.continue') || 'Continuar',
        cancelButtonText: t('form.cancel') || 'Cancelar',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
          confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
          cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas'
        }
      });
      if (!confirm.isConfirmed) return;
    }
    
    setIsSaving(true);
    try {
      if (editingAdmin) {
        const updated = await updateAdmin(editingAdmin.id, {
          name: formData.name,
          email: formData.email,
          permissions: selectedPermissions,
        });
        setAdmins(admins.map(a => a.id === editingAdmin.id ? updated : a));
        setIsModalOpen(false);
        setEditingAdmin(null);
        setFormData({ name: '', email: '', password: '' });
        setSelectedPermissions([]);
        showToast('success', t('updateSuccess') || 'Admin updated successfully');
      } else {
        const newAdmin = await createAdmin({ ...formData, permissions: selectedPermissions });
        setAdmins([newAdmin, ...admins]);
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '' });
        setSelectedPermissions([]);
        showToast('success', t('createSuccess'));
      }
    } catch (error: any) {
      showToast('error', error.message || (editingAdmin ? t('updateError') || 'Error updating admin' : t('createError')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('passwordRequired') || 'Password is required' });
      return;
    }
    setIsSaving(true);
    try {
      await resetAdminPassword(resetAdmin.id, newPassword);
      setIsResetOpen(false);
      setResetAdmin(null);
      setNewPassword('');        showToast('success', t('passwordResetSuccess') || 'Password reset successfully');
      } catch (error: any) {
        showToast('error', error.message || t('passwordResetError') || 'Error resetting password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isSelf = currentUserId === id;
    const result = await Swal.fire({
      title: isSelf ? (t('deleteSelfTitle') || '¿Eliminarte a ti mismo?') : t('deleteTitle'),
      text: isSelf ? (t('deleteSelfText') || 'Te eliminarás a ti mismo del sistema. Esta acción es irreversible y perderás el acceso inmediatamente.') : t('deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: isSelf ? (t('deleteSelfConfirm') || 'Sí, eliminarme') : t('deleteConfirm'),
      cancelButtonText: t('deleteCancel'),
      focusCancel: isSelf,
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: isSelf
          ? 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-warning text-white'
          : 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteAdmin(id);
        setAdmins(admins.filter(a => a.id !== id));
        showToast('success', isSelf ? (t('deleteSelfSuccess') || 'Te has eliminado') : t('deleteSuccess'));
      } catch (error: any) {
        showToast('error', error.message || t('deleteError'));
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
            setSelectedPermissions(ALL_PERMISSIONS);
            setShowCopySelector(false);
            setIsModalOpen(true);
          }}
          className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center justify-center border border-transparent"
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
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs">{t('table.access') || 'Acceso'}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs">{t('table.joined')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-xs text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    <EmptyState variant="people" message={t('empty')} compact />
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const perms = admin.permissions || [];
                  return (
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
                    <td className="px-sm py-xs">
                      <div className="flex items-center gap-[2px]">
                        {PERMISSION_GROUPS.map((group) => {
                          const groupPerms = group.permissions.map((p) => p.key);
                          const hasGroup = perms.length === 0 || groupPerms.every((k: string) => perms.includes(k));
                          const hasPartial = groupPerms.some((k: string) => perms.includes(k));
                          const enabledPerms = group.permissions.filter((p) => perms.includes(p.key));
                          const tooltipParts = enabledPerms.map((p) => t(`form.permissionLabels.${p.labelKey}`));
                          const tooltipText = perms.length === 0
                            ? `${t(`form.permissionGroups.${group.label.toLowerCase()}`)}: Todo`
                            : `${t(`form.permissionGroups.${group.label.toLowerCase()}`)}: ${tooltipParts.length > 0 ? tooltipParts.join(', ') : '—'}`;
                          return (
                            <span
                              key={group.label}
                              className={`w-[6px] h-[6px] rounded-full ${hasGroup ? 'bg-semantic-success' : hasPartial ? 'bg-accent-yellow' : 'bg-hairline'}`}
                              title={tooltipText}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-sm py-xs text-muted text-sm">
                      {new Date(admin.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td className="px-sm py-xs text-right space-x-xxs">
                      <button 
                        onClick={() => {
                          setEditingAdmin(admin);
                          setFormData({ name: admin.name, email: admin.email, password: '' });
                          setSelectedPermissions(admin.permissions || ALL_PERMISSIONS);
                          setShowCopySelector(false);
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
                  );
                })
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
          setSelectedPermissions([]);
          setShowCopySelector(false);
        }}
        title={
          <div className="flex items-center gap-xxs">
            <span>{editingAdmin ? (t('editAdmin') || 'Editar Administrador') : t('newAdmin')}</span>
            {editingAdmin && currentUserId && editingAdmin.id === currentUserId && (
              <span className="text-[9px] font-bold uppercase tracking-widest bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 px-xxs py-[1px]">
                {t('form.you') || 'TÚ'}
              </span>
            )}
          </div>
        }
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

          {/* Copy permissions from another admin */}
          {admins.length > 0 && (
            <div className="space-y-xxs">
              <div className="flex items-center justify-between">
                <label className="block text-caption-uppercase text-ink font-semibold">
                  {t('form.copyFrom') || 'Copiar permisos de'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCopySelector(!showCopySelector)}
                  className="text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary-hover transition-colors cursor-pointer"
                >
                  {showCopySelector ? (t('form.cancel') || 'Cancelar') : (t('form.copyFromBtn') || 'Copiar desde...')}
                </button>
              </div>
              {showCopySelector && (
                <div className="max-h-[160px] overflow-y-auto border border-hairline bg-canvas p-xs space-y-[2px]">
                  {admins
                    .filter((a) => !editingAdmin || a.id !== editingAdmin.id)
                    .map((admin) => (
                      <button
                        key={admin.id}
                        type="button"
                        onClick={() => {
                          setSelectedPermissions(admin.permissions || ALL_PERMISSIONS);
                          setShowCopySelector(false);
                          showToast('success', t('form.permissionsCopied') || 'Permisos copiados');
                        }}
                        className="w-full text-left px-xs py-xxs text-xs text-muted hover:text-ink hover:bg-canvas-elevated transition-colors cursor-pointer border-b border-hairline/50 last:border-0"
                      >
                        <span className="font-semibold uppercase tracking-wider">{admin.name}</span>
                        <span className="ml-xxs opacity-60">{admin.email}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <label className="block text-caption-uppercase text-ink font-semibold">
                {t('form.permissions')}
              </label>
              <div className="flex gap-xxs">
                <button
                  type="button"
                  onClick={() => setSelectedPermissions(ALL_PERMISSIONS)}
                  className="text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary-hover transition-colors cursor-pointer"
                >
                  {t('form.selectAllGlobal') || 'Todo'}
                </button>
                <span className="text-[9px] text-muted/30">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedPermissions([])}
                  className="text-[9px] font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {t('form.deselectAllGlobal') || 'Ninguno'}
                </button>
              </div>
            </div>
            {/* Search filter */}
            <div className="relative mb-xxs">
              <span className="material-icons absolute left-xxs top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">search</span>
              <input
                type="text"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                placeholder={t('form.searchPermissions') || 'Buscar permisos...'}
                className="w-full pl-lg pr-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-xs"
              />
            </div>
            <div className="space-y-xxs">
              {filteredGroups.map((group) => {
                const groupKeys = group.permissions.map((p) => p.key);
                const isExpanded = expandedGroups.has(group.label);
                const allSelected = groupKeys.every((k) => selectedPermissions.includes(k));
                const someSelected = groupKeys.some((k) => selectedPermissions.includes(k));
                return (
                  <div key={group.label} className="border border-hairline bg-canvas p-xs">
                    <div className="flex items-center justify-between gap-xxs">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.label)}
                        className="flex items-center gap-[2px] cursor-pointer group"
                      >
                        <span className={`material-icons text-sm text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                        <p className="text-[9px] uppercase tracking-widest text-muted font-bold group-hover:text-ink transition-colors">
                          {t(`form.permissionGroups.${group.label.toLowerCase()}`)}
                        </p>
                      </button>
                      <label className="flex items-center gap-[2px] cursor-pointer group text-[9px] uppercase tracking-widest text-muted hover:text-ink transition-colors">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...new Set([...selectedPermissions, ...groupKeys])]);
                            } else {
                              const groupKeysStr = groupKeys as string[];
                              setSelectedPermissions(selectedPermissions.filter((p) => !groupKeysStr.includes(p)));
                            }
                          }}
                          className="w-3 h-3 rounded-sm border-hairline bg-canvas text-primary focus:ring-primary/30 cursor-pointer"
                        />
                        <span>{t('form.selectAll') || 'Todo'}</span>
                        <span className="text-muted/60 ml-[1px]">
                          {groupKeys.filter((k) => selectedPermissions.includes(k)).length}/{groupKeys.length}
                        </span>
                      </label>
                    </div>
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-xxs mt-xxs">
                        {group.permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-xxs cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermissions([...selectedPermissions, perm.key]);
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(p => p !== perm.key));
                                }
                              }}
                              className="w-4 h-4 rounded-sm border-hairline bg-canvas text-primary focus:ring-primary/30 cursor-pointer"
                            />
                            <span className="text-xs text-ink group-hover:text-primary transition-colors">
                              {t(`form.permissionLabels.${perm.labelKey}`)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-xs border-t border-hairline flex justify-end gap-xxs">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingAdmin(null);
                setFormData({ name: '', email: '', password: '' });
                setSelectedPermissions([]);
                setShowCopySelector(false);
              }}
              className="px-sm py-xs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {t('form.cancel')}
            </button>
            <button
              onClick={handleSaveAdmin}
              disabled={isSaving}
              className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
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
              className="px-sm py-xs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {t('form.cancel')}
            </button>
            <button
              onClick={handleResetPassword}
              disabled={isSaving}
              className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? t('form.saving') : (t('form.save') || 'Guardar')}
            </button>
          </div>
        </div>
      </GenericModal>
    </div>
  );
}
