'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import EmptyState from '@/components/EmptyState';
import { deleteVpsService } from '@/app/actions/portal';
import VpsEditModal from './VpsEditModal';
import Swal from 'sweetalert2';
import { swalToastTheme } from '@/lib/swal-theme';

function showToast(icon: 'success' | 'error', title: string) {
  Swal.fire({
    ...swalToastTheme,
    icon,
    title,
  });
}

const ITEMS_PER_PAGE = 10;

interface VpsServer {
  id: string;
  name: string;
  hostname?: string | null;
  providerId: string | null;
  ipAddress?: string | null;
  status: string;
  dueDate?: Date | null;
  clientId?: string | null;
}

export default function PortalServersList({ servers: initialServers }: { servers: VpsServer[] }) {
  const t = useTranslations('ClientDetails');
  const router = useRouter();
  const [servers, setServers] = useState(initialServers);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredServers = search.trim()
    ? servers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.ipAddress || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.providerId || '').toLowerCase().includes(search.toLowerCase())
      )
    : servers;

  const totalPages = Math.max(1, Math.ceil(filteredServers.length / ITEMS_PER_PAGE));
  const paginatedServers = filteredServers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (server: VpsServer) => {
    const result = await Swal.fire({
      title: t('deleteServerTitle') || '¿Eliminar servidor?',
      text: `${t('deleteServerText') || 'Se eliminará del portal. Esta acción no se puede deshacer.'}\n"${server.name}" (ID: ${server.providerId || t('notFound') || '—'})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t('deleteServerConfirm') || 'Sí, eliminar',
      cancelButtonText: t('cancel') || 'Cancelar',
      focusCancel: true,
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-warning text-white',
        cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas',
      },
    });

    if (result.isConfirmed) {
      const res = await deleteVpsService(server.id);
      if (res.error) {
        showToast('error', 'Error: ' + res.error);
      } else {
        setServers(servers.filter((s) => s.id !== server.id));
        showToast('success', t('deleteServerSuccess') || 'Servidor eliminado');
        router.refresh();
      }
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
          placeholder={t('searchServers') || 'Buscar servidores...'}
          className="w-full pl-lg pr-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-xs"
        />
      </div>

      {paginatedServers.length > 0 ? (
        <>
          <ul className="space-y-xs">
            {paginatedServers.map((server) => (
              <li key={server.id} className="flex items-center justify-between py-xs border-b border-hairline last:border-0 group">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-ink flex items-center gap-xs">
                    {server.name}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-xxs py-[2px] rounded-full shrink-0 ${
                      server.status === 'active' ? 'bg-semantic-info/15 text-semantic-info' : 'bg-semantic-danger/15 text-semantic-danger'
                    }`}>
                      {server.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-xxs">
                    {t('ipLabel') || 'IP'}: {server.ipAddress || (t('noIpAssigned') || 'No asignada')} &bull; {t('providerId') || 'ID'}: {server.providerId || (t('notFound') || '—')}
                  </div>
                  {server.dueDate && (
                    <div className="text-xs text-muted mt-[2px]">
                      <span className="font-semibold text-ink">{t('dueDate') || 'Vencimiento'}:</span> {new Date(server.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-xxs shrink-0">
                  <VpsEditModal server={server} />
                  <button
                    onClick={() => handleDelete(server)}
                    className="text-muted/40 hover:text-semantic-warning transition-colors p-xxs opacity-0 group-hover:opacity-100 cursor-pointer"
                    title={t('deleteServerTitle') || 'Eliminar servidor'}
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
                {filteredServers.length > 0
                  ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredServers.length)} ${t('of') || 'de'} ${filteredServers.length}`
                  : ''}
              </span>
              <div className="flex items-center gap-[2px]">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="w-[40px] h-[40px] flex items-center justify-center text-muted hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span className="material-icons text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${
                      p === page ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink hover:bg-hairline'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="w-[40px] h-[40px] flex items-center justify-center text-muted hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span className="material-icons text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          variant={search ? 'search' : 'server'}
          message={search ? (t('noSearchResultsServers') || 'No se encontraron servidores.') : t('noServers')}
          compact
        />
      )}
    </div>
  );
}
