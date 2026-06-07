import React, { Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { prisma, timedQuery } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import SortableHeader from '@/components/SortableHeader';
import CsvDownloadButton from '@/components/CsvDownloadButton';
import FilterPills from '@/components/FilterPills';
import TableSearch from '@/components/TableSearch';
import DateRangeFilter from '@/components/DateRangeFilter';

export default async function AdminTicketsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string; dir?: string; estado?: string; prioridad?: string; q?: string; desde?: string; hasta?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Tickets');
  const search = await searchParams;
  const sortField = search.sort || 'updatedAt';
  const sortDir = search.dir === 'asc' ? 'asc' : 'desc';
  const filterEstado = search.estado || '';
  const filterPrioridad = search.prioridad || '';
  const searchQuery = search.q || '';
  const filterDesde = search.desde || '';
  const filterHasta = search.hasta || '';

  // Build orderBy dynamically
  let orderBy: any = { updatedAt: sortDir };
  if (sortField === 'subject') orderBy = { subject: sortDir };
  else if (sortField === 'status') orderBy = { status: sortDir };
  else if (sortField === 'updatedAt') orderBy = { updatedAt: sortDir };
  else if (sortField === 'client') orderBy = { client: { razonSocial: sortDir } };

  // Build where clause with filters and search
  const where: any = {};
  if (filterEstado) where.status = filterEstado;
  if (filterPrioridad) where.priority = filterPrioridad;
  if (searchQuery) {
    where.OR = [
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
      { subject: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  if (filterDesde) {
    where.createdAt = { ...where.createdAt, gte: new Date(filterDesde) };
  }
  if (filterHasta) {
    const hastaEnd = new Date(filterHasta);
    hastaEnd.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: hastaEnd };
  }

  const tickets = await timedQuery(prisma.ticket.findMany({
    orderBy,
    where,
    include: {
      client: {
        select: { razonSocial: true }
      },
    },
  }), 'ticket.findMany');

  // Search+date-only where (no estado/prioridad filter) for allCount
  const searchWhere: any = {};
  if (searchQuery) {
    searchWhere.OR = [
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
      { subject: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  if (filterDesde) {
    searchWhere.createdAt = { ...searchWhere.createdAt, gte: new Date(filterDesde) };
  }
  if (filterHasta) {
    const hastaEnd = new Date(filterHasta);
    hastaEnd.setHours(23, 59, 59, 999);
    searchWhere.createdAt = { ...searchWhere.createdAt, lte: hastaEnd };
  }
  const allTicketCount = await timedQuery(prisma.ticket.count({ where: searchWhere }), 'ticket.count(search)');

  // Build export URL params
  const exportParams = new URLSearchParams();
  if (search.sort) exportParams.set('sort', search.sort);
  if (search.dir) exportParams.set('dir', search.dir);
  if (search.estado) exportParams.set('estado', search.estado);
  if (search.prioridad) exportParams.set('prioridad', search.prioridad);
  if (search.q) exportParams.set('q', search.q);
  if (search.desde) exportParams.set('desde', search.desde);
  if (search.hasta) exportParams.set('hasta', search.hasta);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/30';
      case 'IN_PROGRESS': return 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30';
      case 'CLOSED': return 'bg-canvas-elevated text-muted border-hairline';
      default: return 'bg-canvas-elevated text-muted border-hairline';
    }
  };

  const getStatusText = (status: string) => {
    return t(`status.${status}` as any);
  };

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">
            {(filterEstado || filterPrioridad)
              ? `${tickets.length} ${locale === 'es' ? 'de' : 'of'} ${allTicketCount} ${locale === 'es' ? 'tickets' : 'tickets'}`
              : `${allTicketCount} ${locale === 'es' ? 'tickets' : 'tickets'}`}
          </p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
          <CsvDownloadButton href={`/api/tickets/export?${exportParams.toString()}`} locale={locale} />
        </div>
      </div>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <TableSearch placeholder={locale === 'es' ? 'Buscar por cliente o asunto...' : 'Search by client or subject...'} />
      </Suspense>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <DateRangeFilter desde={filterDesde} hasta={filterHasta} locale={locale} />
      </Suspense>

      <FilterPills
        basePath="/dashboard/tickets"
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
        totalCount={allTicketCount}
        filteredCount={tickets.length}
      />

      <FilterPills
        basePath="/dashboard/tickets"
        filterKey="prioridad"
        options={[
          { value: '', label: locale === 'es' ? 'Todas' : 'All' },
          { value: 'URGENT', label: `⚠ ${t('detail.priority.URGENT')}` },
          { value: 'HIGH', label: t('detail.priority.HIGH') },
          { value: 'MEDIUM', label: t('detail.priority.MEDIUM') },
          { value: 'LOW', label: t('detail.priority.LOW') },
        ]}
        currentFilter={filterPrioridad}
        sortField={sortField}
        sortDir={sortDir}
        locale={locale}
        extraParams={filterEstado ? { estado: filterEstado } : undefined}
        totalCount={allTicketCount}
        filteredCount={tickets.length}
      />

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-xl px-sm">
            <div className="w-[72px] h-[72px] bg-canvas flex items-center justify-center mx-auto mb-xs">
              <span className="material-icons text-muted text-4xl">inbox</span>
            </div>
            <h3 className="text-title-sm font-medium text-ink mb-[4px]">{t('emptyTitle')}</h3>
            <p className="text-sm text-muted mb-sm max-w-sm mx-auto leading-relaxed">{t('emptyMessage')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline group">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.client')} field="client" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/tickets" /></th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.subject')} field="subject" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/tickets" /></th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={locale === 'es' ? 'Prioridad' : 'Priority'} field="priority" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/tickets" /></th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.status')} field="status" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/tickets" /></th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.updated')} field="updatedAt" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/tickets" /></th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-canvas/80 transition-colors group">
                    <td className="px-sm py-xs font-medium text-ink text-sm">
                      {ticket.client.razonSocial}
                    </td>
                    <td className="px-sm py-xs">
                      <div className="flex flex-col">
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="font-medium text-ink hover:text-primary transition-colors text-sm">
                          {ticket.subject}
                        </Link>
                        <span className="text-caption text-muted font-mono mt-[2px]">{t('table.id')}: {ticket.id.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-sm py-xs">
                      <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${
                        ticket.priority === 'URGENT' ? 'border-semantic-danger/30 bg-semantic-danger/10 text-semantic-danger' :
                        ticket.priority === 'HIGH' ? 'border-semantic-warning/30 bg-semantic-warning/10 text-semantic-warning' :
                        ticket.priority === 'MEDIUM' ? 'border-accent-yellow/30 bg-accent-yellow/10 text-accent-yellow' :
                        'border-hairline bg-canvas-elevated text-muted'
                      }`}>
                        {t(`detail.priority.${ticket.priority}`)}
                      </span>
                    </td>
                    <td className="px-sm py-xs">
                      <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-sm py-xs text-body text-muted">
                      {format(new Date(ticket.updatedAt), locale === 'es' ? "d 'de' MMM, HH:mm" : "MMM d, HH:mm", { 
                        locale: locale === 'es' ? es : enUS 
                      })}
                    </td>
                    <td className="px-sm py-xs text-right">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="inline-flex items-center justify-center p-xxs text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100">
                        <span className="material-icons text-[20px]">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
