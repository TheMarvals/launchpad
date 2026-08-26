import React, { Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { prisma, timedQuery } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import PitchActions from '@/components/pitches/PitchActions';
import CsvDownloadButton from '@/components/CsvDownloadButton';
import SortableHeader from '@/components/SortableHeader';
import FilterPills from '@/components/FilterPills';
import TableSearch from '@/components/TableSearch';
import DateRangeFilter from '@/components/DateRangeFilter';

const ITEMS_PER_PAGE = 10;

export default async function PitchesListPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string; sort?: string; dir?: string; status?: string; q?: string; desde?: string; hasta?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Pitches');
  const search = await searchParams;
  const currentPage = Math.max(1, parseInt(search.page || '1'));
  const sortField = search.sort || 'createdAt';
  const sortDir = search.dir === 'asc' ? 'asc' : 'desc';
  const filterStatus = search.status || '';
  const searchQuery = search.q || '';
  const filterDesde = search.desde || '';
  const filterHasta = search.hasta || '';

  let orderBy: any = { createdAt: sortDir };
  if (sortField === 'correlativo') orderBy = { correlativo: sortDir };
  else if (sortField === 'title') orderBy = { title: sortDir };
  else if (sortField === 'status') orderBy = { status: sortDir };
  else if (sortField === 'createdAt') orderBy = { createdAt: sortDir };

  const where: any = {};
  if (filterStatus) where.status = filterStatus;
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { clientName: { contains: searchQuery, mode: 'insensitive' } },
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
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

  const searchWhere: any = {};
  if (searchQuery) {
    searchWhere.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { clientName: { contains: searchQuery, mode: 'insensitive' } },
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
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

  const [pitches, totalCount, allCount] = await Promise.all([
    timedQuery(
      prisma.pitch.findMany({
        orderBy,
        where,
        include: { client: true },
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      'pitch.findMany'
    ),
    timedQuery(prisma.pitch.count({ where }), 'pitch.count(filtered)'),
    timedQuery(prisma.pitch.count({ where: searchWhere }), 'pitch.count(search)'),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportParams = new URLSearchParams();
  if (search.sort) exportParams.set('sort', search.sort);
  if (search.dir) exportParams.set('dir', search.dir);
  if (search.status) exportParams.set('status', search.status);
  if (search.q) exportParams.set('q', search.q);
  if (search.desde) exportParams.set('desde', search.desde);
  if (search.hasta) exportParams.set('hasta', search.hasta);

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">
            {filterStatus
              ? `${totalCount} ${locale === 'es' ? 'de' : 'of'} ${allCount} ${t('subtitle', { count: allCount })}`
              : t('subtitle', { count: allCount })}
          </p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
          <CsvDownloadButton href={`/api/pitches/export?${exportParams.toString()}`} locale={locale} />
          <Link
            href="/dashboard/pitches/new"
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary-active text-white px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
          >
            + {t('newPitch')}
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <TableSearch placeholder={locale === 'es' ? 'Buscar por título o cliente...' : 'Search by title or client...'} />
      </Suspense>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <DateRangeFilter desde={filterDesde} hasta={filterHasta} locale={locale} />
      </Suspense>

      <div className="flex items-center gap-xxs">
        <FilterPills
          basePath="/dashboard/pitches"
          filterKey="status"
          options={[
            { value: '', label: locale === 'es' ? 'Todos' : 'All' },
            { value: 'Borrador', label: t('status.Borrador') },
            { value: 'Activo', label: t('status.Activo') },
            { value: 'Presentado', label: t('status.Presentado') },
            { value: 'Aceptado', label: t('status.Aceptado') },
            { value: 'Archivado', label: t('status.Archivado') },
          ]}
          currentFilter={filterStatus}
          sortField={sortField}
          sortDir={sortDir}
          locale={locale}
          totalCount={allCount}
          filteredCount={totalCount}
        />
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {pitches.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-hairline group">
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">
                      <SortableHeader label={t('table.number')} field="correlativo" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/pitches" />
                    </th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">
                      <SortableHeader label={t('table.pitchTitle')} field="title" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/pitches" />
                    </th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">
                      {t('table.client')}
                    </th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">
                      {t('table.slidesCount')}
                    </th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">
                      <SortableHeader label={t('table.status')} field="status" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/pitches" />
                    </th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {pitches.map((pitch) => {
                    const slidesList = Array.isArray(pitch.slides) ? pitch.slides : [];
                    return (
                      <tr key={pitch.id} className="hover:bg-canvas/80 transition-colors group">
                        <td className="px-sm py-xs font-medium text-ink">
                          Nº {String(pitch.correlativo).padStart(4, '0')}
                        </td>
                        <td className="px-sm py-xs">
                          <div className="font-medium text-ink text-sm">{pitch.title}</div>
                          {pitch.subtitle && <div className="text-xs text-muted truncate max-w-xs">{pitch.subtitle}</div>}
                        </td>
                        <td className="px-sm py-xs text-body text-ink">
                          {pitch.client?.razonSocial || pitch.clientName || '---'}
                        </td>
                        <td className="px-sm py-xs text-body text-muted">
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-canvas px-2 py-0.5 border border-hairline rounded-sm">
                            <span className="material-icons text-[14px] text-primary">slideshow</span>
                            {slidesList.length} slides
                          </span>
                        </td>
                        <td className="px-sm py-xs">
                          <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${
                            pitch.status === 'Aceptado' ? 'border-semantic-success/30 bg-semantic-success/10 text-semantic-success' :
                            pitch.status === 'Borrador' ? 'border-hairline bg-canvas-elevated text-muted' :
                            pitch.status === 'Activo' ? 'border-primary/30 bg-primary/10 text-primary' :
                            'border-semantic-info/30 bg-semantic-info/10 text-semantic-info'
                          }`}>
                            {t(`status.${pitch.status}`) || pitch.status}
                          </span>
                        </td>
                        <td className="px-sm py-xs text-right">
                          <PitchActions pitchId={pitch.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-hairline">
              {pitches.map((pitch, index) => {
                const slidesList = Array.isArray(pitch.slides) ? pitch.slides : [];
                return (
                  <div key={pitch.id} className="animate-fade-in px-sm py-xs space-y-xxs hover:bg-canvas/50 transition-colors" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-start justify-between gap-xxs">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-ink text-sm">Nº {String(pitch.correlativo).padStart(4, '0')}</span>
                        <h3 className="font-bold text-ink text-base truncate">{pitch.title}</h3>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border text-[10px] ${
                        pitch.status === 'Aceptado' ? 'border-semantic-success/30 bg-semantic-success/10 text-semantic-success' :
                        pitch.status === 'Borrador' ? 'border-hairline bg-canvas-elevated text-muted' :
                        pitch.status === 'Activo' ? 'border-primary/30 bg-primary/10 text-primary' :
                        'border-semantic-info/30 bg-semantic-info/10 text-semantic-info'
                      }`}>
                        {t(`status.${pitch.status}`) || pitch.status}
                      </span>
                    </div>
                    <p className="text-muted text-xs">{pitch.client?.razonSocial || pitch.clientName || '---'}</p>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{slidesList.length} slides</span>
                      <span>{new Date(pitch.createdAt).toLocaleDateString(locale)}</span>
                    </div>
                    <div className="flex justify-end pt-xxxs">
                      <PitchActions pitchId={pitch.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted">
            {t('noPitches')}
          </div>
        )}

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
                  href={`/dashboard/pitches?page=${currentPage - 1}&sort=${sortField}&dir=${sortDir}${filterStatus ? `&status=${filterStatus}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}${filterDesde ? `&desde=${filterDesde}` : ''}${filterHasta ? `&hasta=${filterHasta}` : ''}`}
                  className="px-sm h-10 text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                >
                  {t('pagination.previous')}
                </Link>
              ) : (
                <span className="px-sm h-10 text-xs font-bold text-muted bg-canvas border border-hairline rounded-none opacity-40 cursor-not-allowed flex items-center uppercase tracking-wider">
                  {t('pagination.previous')}
                </span>
              )}
              {currentPage < totalPages ? (
                <Link
                  href={`/dashboard/pitches?page=${currentPage + 1}&sort=${sortField}&dir=${sortDir}${filterStatus ? `&status=${filterStatus}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}${filterDesde ? `&desde=${filterDesde}` : ''}${filterHasta ? `&hasta=${filterHasta}` : ''}`}
                  className="px-sm h-10 text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                >
                  {t('pagination.next')}
                </Link>
              ) : (
                <span className="px-sm h-10 text-xs font-bold text-muted bg-canvas border border-hairline rounded-none opacity-40 cursor-not-allowed flex items-center uppercase tracking-wider">
                  {t('pagination.next')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
