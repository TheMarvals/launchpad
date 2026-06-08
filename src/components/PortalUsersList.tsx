'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import EmptyState from '@/components/EmptyState';
import { toggleUserAccess, deleteClientUser, updateClientUser } from '@/app/actions/portal';
import Swal from 'sweetalert2';

function showToast(icon: 'success' | 'error', title: string) {
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
}

const ITEMS_PER_PAGE = 10;

interface PortalUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export default function PortalUsersList({ users: initialUsers, clientId }: { users: PortalUser[]; clientId: string }) {
  const t = useTranslations('ClientDetails');
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const filteredUsers = search.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleToggle = async (user: PortalUser) => {
    const newStatus = !user.isActive;
    const res = await toggleUserAccess(user.id, newStatus);
    if (res.error) {
      showToast('error', 'Error: ' + res.error);
    } else {
      setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u)));
      showToast('success', newStatus ? t('accessActivated') : t('accessDeactivated'));
    }
  };

  const handleDelete = async (user: PortalUser) => {
    const result = await Swal.fire({
      title: t('deleteUserTitle') || '¿Eliminar usuario?',
      text: `${t('deleteUserText') || 'Se eliminará del portal. Esta acción no se puede deshacer.'}\n"${user.name}" (${user.email})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t('deleteUserConfirm') || 'Sí, eliminar',
      cancelButtonText: t('cancel') || 'Cancelar',
      focusCancel: true,
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-warning text-white',
        cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas',
      },
    });

    if (result.isConfirmed) {
      const res = await deleteClientUser(user.id);
      if (res.error) {
        showToast('error', 'Error: ' + res.error);
      } else {
        setUsers(users.filter((u) => u.id !== user.id));
        showToast('success', t('deleteUserSuccess') || 'Usuario eliminado');
        router.refresh();
      }
    }
  };

  const openEditModal = (user: PortalUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
  };

  const handleEditSave = async () => {
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;
    setEditLoading(true);
    const res = await updateClientUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      password: editPassword || undefined,
    });
    setEditLoading(false);
    if (res.error) {
      showToast('error', 'Error: ' + res.error);
    } else {
      setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, name: editName.trim(), email: editEmail.trim() } : u)));
      setEditingUser(null);
      showToast('success', t('updateSuccess') || 'Usuario actualizado');
      router.refresh();
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-xs">
        <span className="material-icons absolute left-xxs top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('searchUsers') || 'Buscar usuarios...'}
          className="w-full pl-lg pr-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-xs"
        />
      </div>

      {paginatedUsers.length > 0 ? (
        <>
          <ul className="space-y-xs">
            {paginatedUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between py-xs border-b border-hairline last:border-0 group">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink truncate">{user.name}</div>
                  <div className="text-xs text-muted mt-xxs truncate">{user.email}</div>
                </div>
                <div className="flex items-center gap-xxs shrink-0">
                  {/* Edit button */}
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-muted/40 hover:text-primary transition-colors p-xxs opacity-0 group-hover:opacity-100 cursor-pointer"
                    title={t('editUser') || 'Editar'}
                  >
                    <span className="material-icons text-sm">edit</span>
                  </button>
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(user)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                      user.isActive ? 'bg-semantic-success' : 'bg-hairline'
                    }`}
                    title={user.isActive ? (t('accessDeactivated') || 'Desactivar') : (t('accessActivated') || 'Activar')}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        user.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(user)}
                    className="text-muted/40 hover:text-semantic-warning transition-colors p-xxs opacity-0 group-hover:opacity-100 cursor-pointer"
                    title={t('deleteUserTitle') || 'Eliminar'}
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-xs mt-xs border-t border-hairline/50">
              <span className="text-[10px] text-muted/60">
                {filteredUsers.length > 0
                  ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredUsers.length)} ${t('of') || 'de'} ${filteredUsers.length}`
                  : ''}
              </span>
              <div className="flex items-center gap-[2px]">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="w-[24px] h-[24px] flex items-center justify-center text-muted hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span className="material-icons text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-[24px] h-[24px] flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${
                      p === page ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink hover:bg-hairline'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="w-[24px] h-[24px] flex items-center justify-center text-muted hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span className="material-icons text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          variant={search ? 'search' : 'people'}
          message={search ? (t('noSearchResults') || 'No se encontraron usuarios.') : t('noUsers')}
          compact
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-xxs" onClick={(e) => { if (e.target === e.currentTarget) setEditingUser(null); }}>
          <div className="bg-canvas-elevated border border-hairline w-[400px] max-w-full overflow-hidden">
            <div className="p-sm border-b border-hairline">
              <h3 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
                <span className="material-icons mr-xxs text-primary">person</span>
                {t('editUserTitle') || 'Editar Usuario del Portal'}
              </h3>
            </div>

            <div className="p-sm space-y-xxs">
              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">{t('name')}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                />
              </div>
              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">{t('email')}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                />
              </div>
              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">
                  {t('password')} <span className="text-muted/60 font-normal">({t('optional') || 'opcional'})</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder') || 'Dejar en blanco para mantener'}
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-xxs p-sm border-t border-hairline bg-canvas">
              <button
                onClick={() => setEditingUser(null)}
                className="px-sm py-xxs font-semibold text-xs uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer"
              >
                {t('cancel') || 'Cancelar'}
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading || !editName.trim() || !editEmail.trim()}
                className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all disabled:opacity-50 border border-transparent flex items-center cursor-pointer"
              >
                {editLoading ? (
                  <span className="material-icons animate-spin text-[18px]">sync</span>
                ) : (
                  t('save') || 'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
