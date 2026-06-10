import React, { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Link, redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import CsvDownloadButton from '@/components/CsvDownloadButton';
import FilterPills from '@/components/FilterPills';
import DateRangeFilter from '@/components/DateRangeFilter';
import EmptyState from '@/components/EmptyState';

const ITEMS_PER_PAGE = 15;

export default async function AuditLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; desde?: string; hasta?: string; accion?: string; estado?: string; usuario?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  const t = await getTranslations('Audit');
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect({ href: '/', locale });
    return null;
  }

  const currentPage = Math.max(1, parseInt(search.page || '1'));
  const filterDesde = search.desde || '';
  const filterHasta = search.hasta || '';
  const filterAccion = search.accion || '';
  const filterEstado = search.estado || '';
  const filterUsuario = search.usuario || '';

  // Get distinct actions for filter pills
  const [distinctActionsResult, distinctUsersResult] = await Promise.all([
    prisma.actionLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
    prisma.actionLog.findMany({
      distinct: ['userId'],
      select: {
        userId: true,
        user: { select: { name: true } },
      },
      orderBy: { userId: 'asc' },
    }),
  ]);
  const distinctActions = distinctActionsResult.map((a) => a.action);
  const distinctUsers = distinctUsersResult.map((u) => ({
    id: u.userId,
    name: u.user.name,
  }));

  // Build where clause
  const where: any = {};
  if (filterAccion) where.action = filterAccion;
  if (filterEstado) where.status = filterEstado;
  if (filterUsuario) where.userId = filterUsuario;
  if (filterDesde) {
    where.createdAt = { ...where.createdAt, gte: new Date(filterDesde) };
  }
  if (filterHasta) {
    const hastaEnd = new Date(filterHasta);
    hastaEnd.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: hastaEnd };
  }

  const [logs, totalCount, allCount] = await Promise.all([
    prisma.actionLog.findMany({
      orderBy: { createdAt: 'desc' },
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        server: {
          select: { name: true, ipAddress: true, providerId: true },
        },
      },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.actionLog.count({ where }),
    prisma.actionLog.count(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Build export URL params
  const exportParams = new URLSearchParams();
  if (search.desde) exportParams.set('desde', search.desde);
  if (search.hasta) exportParams.set('hasta', search.hasta);
  if (search.accion) exportParams.set('accion', search.accion);
  if (search.estado) exportParams.set('estado', search.estado);
  if (search.usuario) exportParams.set('usuario', search.usuario);

  const hasFilters = filterEstado || filterAccion || filterUsuario || filterDesde || filterHasta;

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">
            {hasFilters
              ? `${totalCount} ${locale === 'es' ? 'de' : 'of'} ${allCount} ${locale === 'es' ? 'registros' : 'records'}`
              : t('subtitle')}
          </p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
          <CsvDownloadButton href={`/api/logs/export?${exportParams.toString()}`} locale={locale} />
        </div>
      </div>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <DateRangeFilter desde={filterDesde} hasta={filterHasta} locale={locale} />
      </Suspense>

      <FilterPills
        basePath="/dashboard/logs"
        filterKey="estado"
        options={[
          { value: '', label: locale === 'es' ? 'Todos' : 'All' },
          { value: 'SUCCESS', label: t('status.success') },
          { value: 'PENDING', label: t('status.pending') },
          { value: 'FAILED', label: t('status.failed') },
        ]}
        currentFilter={filterEstado}
        sortField=""
        sortDir=""
        locale={locale}
        extraParams={{ ...(filterAccion ? { accion: filterAccion } : {}), ...(filterUsuario ? { usuario: filterUsuario } : {}) }}
        totalCount={allCount}
        filteredCount={totalCount}
      />

      {distinctActions.length > 0 && (
        <FilterPills
          basePath="/dashboard/logs"
          filterKey="accion"
          options={[
            { value: '', label: locale === 'es' ? 'Todas' : 'All' },
            ...distinctActions.map((action) => ({ value: action, label: action })),
          ]}
          currentFilter={filterAccion}
          sortField=""
          sortDir=""
          locale={locale}
          extraParams={{ ...(filterEstado ? { estado: filterEstado } : {}), ...(filterUsuario ? { usuario: filterUsuario } : {}) }}
          totalCount={allCount}
          filteredCount={totalCount}
        />
      )}

      {distinctUsers.length > 1 && (
        <FilterPills
          basePath="/dashboard/logs"
          filterKey="usuario"
          options={[
            { value: '', label: locale === 'es' ? 'Todos' : 'All' },
            ...distinctUsers.map((u) => ({ value: u.id, label: u.name })),
          ]}
          currentFilter={filterUsuario}
          sortField=""
          sortDir=""
          locale={locale}
          extraParams={{ ...(filterEstado ? { estado: filterEstado } : {}), ...(filterAccion ? { accion: filterAccion } : {}) }}
          totalCount={allCount}
          filteredCount={totalCount}
        />
      )}

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {logs.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-hairline">
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.date')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.user')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.server')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.action')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('table.status')}</th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-center">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas/80 transition-colors group">
                      <td className="px-sm py-xs whitespace-nowrap text-body text-muted">
                        {new Date(log.createdAt).toLocaleString(locale, {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-sm py-xs">
                        <div className="font-medium text-ink text-sm">{log.user.name}</div>
                        <div className="text-xs text-muted">{log.user.email}</div>
                      </td>
                      <td className="px-sm py-xs">
                        <div className="font-medium text-ink text-sm">{log.server.name}</div>
                        <div className="text-xs text-muted">{log.server.ipAddress || log.server.providerId}</div>
                      </td>
                      <td className="px-sm py-xs">
                        <span className="px-xxs py-[2px] text-caption-uppercase font-semibold border bg-canvas-elevated text-muted border-hairline">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-sm py-xs text-right">
                        {log.status === 'SUCCESS' ? (
                          <span className="px-xxs py-[2px] text-caption-uppercase font-bold bg-semantic-success/10 text-semantic-success border border-semantic-success/30">
                            {t('status.success')}
                          </span>
                        ) : log.status === 'PENDING' ? (
                          <span className="px-xxs py-[2px] text-caption-uppercase font-bold bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30">
                            {t('status.pending')}
                          </span>
                        ) : (
                          <span className="px-xxs py-[2px] text-caption-uppercase font-bold bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/30" title={log.details || ''}>
                            {t('status.failed')}
                          </span>
                        )}
                      </td>
                      <td className="px-sm py-xs text-center">
                        <span className="inline-flex items-center justify-center p-xxs text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-icons text-[20px]">chevron_right</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-hairline">
              {logs.map((log, index) => (
                <div key={log.id} className="animate-fade-in px-sm py-xs space-y-xxs hover:bg-canvas/50 transition-colors" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start justify-between gap-xxs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink text-sm">{log.user.name}</p>
                      <p className="text-xs text-muted">{log.server.name}</p>
                    </div>
                    {log.status === 'SUCCESS' ? (
                      <span className="shrink-0 px-xxs py-[2px] text-caption-uppercase font-bold bg-semantic-success/10 text-semantic-success border border-semantic-success/30 text-[10px]">
                        {t('status.success')}
                      </span>
                    ) : log.status === 'PENDING' ? (
                      <span className="shrink-0 px-xxs py-[2px] text-caption-uppercase font-bold bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 text-[10px]">
                        {t('status.pending')}
                      </span>
                    ) : (
                      <span className="shrink-0 px-xxs py-[2px] text-caption-uppercase font-bold bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/30 text-[10px]" title={log.details || ''}>
                        {t('status.failed')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{log.user.email}</span>
                    <span className="px-xxs py-[2px] text-caption-uppercase font-semibold border bg-canvas-elevated text-muted border-hairline text-[10px]">
                      {log.action}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>{new Date(log.createdAt).toLocaleString(locale, {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}</span>
                    <span className="text-muted">{log.server.ipAddress || log.server.providerId}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-sm border-t border-hairline">
                <div className="text-xs text-muted">
                  {t('pagination.showing', {
                    start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                    end: Math.min(currentPage * ITEMS_PER_PAGE, totalCount),
                    total: totalCount,
                  })}
                </div>
                <div className="flex items-center gap-xxs">
                  {currentPage > 1 ? (
                    <Link
                      href={`/dashboard/logs?page=${currentPage - 1}${exportParams.toString() ? `&${exportParams.toString()}` : ''}`}
                      className="px-sm h-10 text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                    >
                      <span className="material-icons text-sm mr-1">chevron_left</span> {t('pagination.previous')}
                    </Link>
                  ) : (
                    <span className="px-sm h-10 text-xs font-bold text-muted bg-transparent border border-hairline/50 rounded-none cursor-not-allowed flex items-center uppercase tracking-wider">
                      <span className="material-icons text-sm mr-1">chevron_left</span> {t('pagination.previous')}
                    </span>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Link
                      key={page}
                      href={`/dashboard/logs?page=${page}${exportParams.toString() ? `&${exportParams.toString()}` : ''}`}
                      className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-none transition-colors border ${
                        page === currentPage
                          ? 'bg-ink text-canvas border-ink'
                          : 'text-ink bg-transparent border-hairline hover:bg-canvas'
                      }`}
                    >
                      {page}
                    </Link>
                  ))}

                  {currentPage < totalPages ? (
                    <Link
                      href={`/dashboard/logs?page=${currentPage + 1}${exportParams.toString() ? `&${exportParams.toString()}` : ''}`}
                      className="px-sm h-10 text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                    >
                      {t('pagination.next')} <span className="material-icons text-sm ml-1">chevron_right</span>
                    </Link>
                  ) : (
                    <span className="px-sm h-10 text-xs font-bold text-muted bg-transparent border border-hairline/50 rounded-none cursor-not-allowed flex items-center uppercase tracking-wider">
                      {t('pagination.next')} <span className="material-icons text-sm ml-1">chevron_right</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState variant="shield" message={t('noLogs')} />
        )}
      </div>
    </div>
  );
}
