import React, { Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';
import SortableHeader from '@/components/SortableHeader';
import FilterPills from '@/components/FilterPills';
import TableSearch from '@/components/TableSearch';
import EmptyState from '@/components/EmptyState';

const ITEMS_PER_PAGE = 10;

export default async function ClientTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; sort?: string; dir?: string; estado?: string; prioridad?: string; q?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('ClientPortal');
  const session = await auth();
  const clientId = (session?.user as any)?.clientId;

  if (!clientId) return null;

  const search = await searchParams;
  const currentPage = Math.max(1, parseInt(search.page || '1'));
  const sortField = search.sort || 'updatedAt';
  const sortDir = search.dir === 'asc' ? 'asc' : 'desc';
  const filterEstado = search.estado || '';
  const filterPrioridad = search.prioridad || '';
  const searchQuery = search.q || '';

  // Build orderBy dynamically
  let orderBy: any = { updatedAt: sortDir };
  if (sortField === 'subject') orderBy = { subject: sortDir };
  else if (sortField === 'status') orderBy = { status: sortDir };
  else if (sortField === 'priority') orderBy = { priority: sortDir };
  else if (sortField === 'updatedAt') orderBy = { updatedAt: sortDir };

  // Build where clause
  const where: any = { clientId };
  if (filterEstado) where.status = filterEstado;
  if (filterPrioridad) where.priority = filterPrioridad;
  if (searchQuery) {
    where.subject = { contains: searchQuery, mode: 'insensitive' };
  }

  const [tickets, totalCount] = await Promise.all([
    prisma.ticket.findMany({
      orderBy,
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.ticket.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-semantic-success/10 text-semantic-success border-semantic-success/30';
      case 'IN_PROGRESS': return 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30';
      case 'CLOSED': return 'bg-canvas-elevated text-muted border-hairline';
      default: return 'bg-canvas-elevated text-muted border-hairline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return t('tickets.status.open');
      case 'IN_PROGRESS': return t('tickets.status.inProgress');
      case 'CLOSED': return t('tickets.status.closed');
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-muted border-hairline bg-canvas-elevated';
      case 'MEDIUM': return 'text-semantic-info border-semantic-info/30 bg-semantic-info/10';
      case 'HIGH': return 'text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10';
      case 'URGENT': return 'text-semantic-danger border-semantic-danger/30 bg-semantic-danger/10';
      default: return 'text-muted border-hairline bg-canvas-elevated';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT': return t('tickets.priority.urgent');
      case 'HIGH': return t('tickets.priority.high');
      case 'MEDIUM': return t('tickets.priority.medium');
      case 'LOW': return t('tickets.priority.low');
      default: return priority;
    }
  };

  const dateLocale = locale === 'es' ? es : enUS;

  return (
    <div className="max-w-6xl mx-auto space-y-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs bg-canvas-elevated border border-hairline p-sm">
        <div>
          <h1 className="text-title-md font-medium text-ink tracking-tight">{t('tickets.pageTitle')}</h1>
          <p className="text-body text-muted mt-[2px]">
            {totalCount} {locale === 'es' ? 'tickets' : 'tickets'}
          </p>
        </div>
        <Link
          href="/client-portal/tickets/new"
          className="bg-primary text-on-primary px-sm py-xxs font-semibold transition-colors flex items-center text-xs uppercase tracking-wider shrink-0"
        >
          <span className="material-icons text-[18px] mr-xxs">add</span>
          {t('tickets.newTicket')}
        </Link>
      </div>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <TableSearch placeholder={locale === 'es' ? 'Buscar por asunto...' : 'Search by subject...'} />
      </Suspense>

      <FilterPills
        basePath="/client-portal/tickets"
        filterKey="estado"
        options={[
          { value: '', label: locale === 'es' ? 'Todos' : 'All' },
          { value: 'OPEN', label: getStatusText('OPEN') },
          { value: 'IN_PROGRESS', label: getStatusText('IN_PROGRESS') },
          { value: 'CLOSED', label: getStatusText('CLOSED') },
        ]}
        currentFilter={filterEstado}
        sortField={sortField}
        sortDir={sortDir}
        locale={locale}
        extraParams={filterPrioridad ? { prioridad: filterPrioridad } : undefined}
        totalCount={totalCount}
        filteredCount={totalCount}
      />

      <FilterPills
        basePath="/client-portal/tickets"
        filterKey="prioridad"
        options={[
          { value: '', label: locale === 'es' ? 'Todas' : 'All' },
          { value: 'URGENT', label: `⚠ ${getPriorityText('URGENT')}` },
          { value: 'HIGH', label: getPriorityText('HIGH') },
          { value: 'MEDIUM', label: getPriorityText('MEDIUM') },
          { value: 'LOW', label: getPriorityText('LOW') },
        ]}
        currentFilter={filterPrioridad}
        sortField={sortField}
        sortDir={sortDir}
        locale={locale}
        extraParams={filterEstado ? { estado: filterEstado } : undefined}
        totalCount={totalCount}
        filteredCount={totalCount}
      />

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {tickets.length === 0 ? (
          <EmptyState
            variant="inbox"
            title={t('tickets.emptyTitle')}
            message={t('tickets.emptyMessage')}
            action={
              <Link
                href="/client-portal/tickets/new"
                className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors inline-flex items-center"
              >
                <span className="material-icons text-[18px] mr-xxs">add</span>
                {t('tickets.emptyAction')}
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-hairline group">
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('tickets.table.subject')} field="subject" currentSort={sortField} currentDir={sortDir} basePath="/client-portal/tickets" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('tickets.table.status')} field="status" currentSort={sortField} currentDir={sortDir} basePath="/client-portal/tickets" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('tickets.table.priority')} field="priority" currentSort={sortField} currentDir={sortDir} basePath="/client-portal/tickets" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('tickets.table.updated')} field="updatedAt" currentSort={sortField} currentDir={sortDir} basePath="/client-portal/tickets" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('tickets.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-canvas/80 transition-colors group">
                      <td className="px-sm py-xs">
                        <div className="flex flex-col">
                          <Link href={`/client-portal/tickets/${ticket.id}`} className="font-medium text-ink hover:text-primary transition-colors text-sm">
                            {ticket.subject}
                          </Link>
                          <span className="text-caption text-muted font-mono mt-[2px]">#{ticket.id.split('-')[0].toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-sm py-xs">
                        <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                      </td>
                      <td className="px-sm py-xs">
                        <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      </td>
                      <td className="px-sm py-xs text-body text-muted">
                        {format(new Date(ticket.updatedAt), locale === 'es' ? "d 'de' MMM, HH:mm" : "MMM d, HH:mm", { locale: dateLocale })}
                      </td>
                      <td className="px-sm py-xs text-right">
                        <Link
                          href={`/client-portal/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center p-xxs text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-icons text-[20px]">chevron_right</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-sm border-t border-hairline">
                <div className="text-xs text-muted">
                  {locale === 'es' ? 'Mostrando' : 'Showing'} {(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} {locale === 'es' ? 'de' : 'of'} {totalCount}
                </div>
                <div className="flex items-center gap-xxs">
                  {currentPage > 1 ? (
                    <Link
                      href={`/client-portal/tickets?page=${currentPage - 1}&sort=${sortField}&dir=${sortDir}${filterEstado ? `&estado=${filterEstado}` : ''}${filterPrioridad ? `&prioridad=${filterPrioridad}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className="px-sm h-[32px] text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                    >
                      <span className="material-icons text-sm mr-1">chevron_left</span> {locale === 'es' ? 'Anterior' : 'Previous'}
                    </Link>
                  ) : (
                    <span className="px-sm h-[32px] text-xs font-bold text-muted bg-transparent border border-hairline/50 rounded-none cursor-not-allowed flex items-center uppercase tracking-wider">
                      <span className="material-icons text-sm mr-1">chevron_left</span> {locale === 'es' ? 'Anterior' : 'Previous'}
                    </span>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Link
                      key={page}
                      href={`/client-portal/tickets?page=${page}&sort=${sortField}&dir=${sortDir}${filterEstado ? `&estado=${filterEstado}` : ''}${filterPrioridad ? `&prioridad=${filterPrioridad}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className={`w-[32px] h-[32px] flex items-center justify-center text-xs font-bold rounded-none transition-colors border ${
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
                      href={`/client-portal/tickets?page=${currentPage + 1}&sort=${sortField}&dir=${sortDir}${filterEstado ? `&estado=${filterEstado}` : ''}${filterPrioridad ? `&prioridad=${filterPrioridad}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className="px-sm h-[32px] text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                    >
                      {locale === 'es' ? 'Siguiente' : 'Next'} <span className="material-icons text-sm ml-1">chevron_right</span>
                    </Link>
                  ) : (
                    <span className="px-sm h-[32px] text-xs font-bold text-muted bg-transparent border border-hairline/50 rounded-none cursor-not-allowed flex items-center uppercase tracking-wider">
                      {locale === 'es' ? 'Siguiente' : 'Next'} <span className="material-icons text-sm ml-1">chevron_right</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
