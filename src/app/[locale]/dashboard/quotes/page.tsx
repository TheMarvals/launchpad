import React, { Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { prisma, timedQuery } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import QuoteActions from '@/components/QuoteActions';
import CsvDownloadButton from '@/components/CsvDownloadButton';
import SortableHeader from '@/components/SortableHeader';
import FilterPills from '@/components/FilterPills';
import TableSearch from '@/components/TableSearch';
import DateRangeFilter from '@/components/DateRangeFilter';

const ITEMS_PER_PAGE = 10;

export default async function QuotesListPage({ searchParams, params }: { searchParams: Promise<{ page?: string; sort?: string; dir?: string; estado?: string; q?: string; desde?: string; hasta?: string }>, params: Promise<{locale: string}> }) {
  const {locale} = await params;
  const t = await getTranslations('Quotes');
  const search = await searchParams;
  const currentPage = Math.max(1, parseInt(search.page || '1'));
  const sortField = search.sort || 'createdAt';
  const sortDir = search.dir === 'asc' ? 'asc' : 'desc';
  const filterEstado = search.estado || '';
  const searchQuery = search.q || '';
  const filterDesde = search.desde || '';
  const filterHasta = search.hasta || '';

  // Build orderBy dynamically
  let orderBy: any = { createdAt: sortDir };
  if (sortField === 'correlativo') orderBy = { correlativo: sortDir };
  else if (sortField === 'montoTotal') orderBy = { montoTotal: sortDir };
  else if (sortField === 'fechaEmision') orderBy = { fechaEmision: sortDir };
  else if (sortField === 'fechaValidez') orderBy = { fechaValidez: sortDir };
  else if (sortField === 'estado') orderBy = { estado: sortDir };
  else if (sortField === 'client') orderBy = { client: { razonSocial: sortDir } };

  // Build where clause for status filter and search
  const where: any = {};
  if (filterEstado) where.estado = filterEstado;
  if (searchQuery) {
    where.OR = [
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
      { client: { rut: { contains: searchQuery, mode: 'insensitive' } } },
    ];
  }
  if (filterDesde) {
    where.fechaEmision = { ...where.fechaEmision, gte: new Date(filterDesde) };
  }
  if (filterHasta) {
    const hastaEnd = new Date(filterHasta);
    hastaEnd.setHours(23, 59, 59, 999);
    where.fechaEmision = { ...where.fechaEmision, lte: hastaEnd };
  }

  // Search+date-only where (no estado filter) for allCount
  const searchWhere: any = {};
  if (searchQuery) {
    searchWhere.OR = [
      { client: { razonSocial: { contains: searchQuery, mode: 'insensitive' } } },
      { client: { rut: { contains: searchQuery, mode: 'insensitive' } } },
    ];
  }
  if (filterDesde) {
    searchWhere.fechaEmision = { ...searchWhere.fechaEmision, gte: new Date(filterDesde) };
  }
  if (filterHasta) {
    const hastaEnd = new Date(filterHasta);
    hastaEnd.setHours(23, 59, 59, 999);
    searchWhere.fechaEmision = { ...searchWhere.fechaEmision, lte: hastaEnd };
  }

  const [quotes, totalCount, allCount] = await Promise.all([
    timedQuery(prisma.quote.findMany({
      orderBy,
      where,
      include: { client: true },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }), 'quote.findMany'),
    timedQuery(prisma.quote.count({ where }), 'quote.count(filtered)'),
    timedQuery(prisma.quote.count({ where: searchWhere }), 'quote.count(search)'),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Build export URL params
  const exportParams = new URLSearchParams();
  if (search.sort) exportParams.set('sort', search.sort);
  if (search.dir) exportParams.set('dir', search.dir);
  if (search.estado) exportParams.set('estado', search.estado);
  if (search.q) exportParams.set('q', search.q);
  if (search.desde) exportParams.set('desde', search.desde);
  if (search.hasta) exportParams.set('hasta', search.hasta);

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">
            {filterEstado 
              ? `${totalCount} ${locale === 'es' ? 'de' : 'of'} ${allCount} ${t('subtitle', { count: allCount })}`
              : t('subtitle', { count: allCount })}
          </p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">            <CsvDownloadButton href={`/api/quotes/export?${exportParams.toString()}`} locale={locale} />
            <a 
            href="/api/quotes/template/pdf"
            className="flex-1 sm:flex-initial bg-transparent border border-ink text-ink hover:bg-ink/10 px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
            title="Download blank template"
          >
            <span className="material-icons mr-2 text-sm">picture_as_pdf</span>
            {locale === 'es' ? 'Plantilla en Blanco' : 'Blank Template'}
          </a>
          <Link 
            href="/dashboard/quotes/new" 
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary-active text-white px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
          >
            + {t('newQuote')}
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <TableSearch placeholder={locale === 'es' ? 'Buscar por cliente o RUT...' : 'Search by client or tax ID...'} />
      </Suspense>

      <Suspense fallback={<div className="h-[36px] border border-hairline" />}>
        <DateRangeFilter desde={filterDesde} hasta={filterHasta} locale={locale} />
      </Suspense>

      <div className="flex items-center gap-xxs">
        <FilterPills
        basePath="/dashboard/quotes"
        filterKey="estado"
        options={[
          { value: '', label: locale === 'es' ? 'Todas' : 'All' },
          { value: 'Borrador', label: 'Borrador' },
          { value: 'Aceptada', label: 'Aceptada' },
          { value: 'Pendiente', label: 'Pendiente' },
        ]}
        currentFilter={filterEstado}
        sortField={sortField}
        sortDir={sortDir}
        locale={locale}
        totalCount={allCount}
        filteredCount={totalCount}
      />
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {quotes.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-hairline group">
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.number')} field="correlativo" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/quotes" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.client')} field="client" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/quotes" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.issueDate')} field="fechaEmision" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/quotes" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.validity')} field="fechaValidez" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/quotes" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.total')} field="montoTotal" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/quotes" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold"><SortableHeader label={t('table.status')} field="estado" currentSort={sortField} currentDir={sortDir} basePath="/dashboard/quotes" /></th>
                    <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-canvas/80 transition-colors group">
                      <td className="px-sm py-xs font-medium text-ink">
                        Nº {String(quote.correlativo).padStart(4, '0')}
                      </td>
                      <td className="px-sm py-xs">
                        <div className="font-medium text-ink text-sm">{quote.client.razonSocial}</div>
                        <div className="text-xs text-muted">{quote.client.rut}</div>
                      </td>
                      <td className="px-sm py-xs text-body text-muted">
                        {new Date(quote.fechaEmision).toLocaleDateString(locale)}
                      </td>
                      <td className="px-sm py-xs text-body text-muted">
                        {new Date(quote.fechaValidez).toLocaleDateString(locale)}
                      </td>
                      <td className="px-sm py-xs font-medium text-ink">
                        ${quote.montoTotal.toLocaleString(locale)}
                      </td>
                      <td className="px-sm py-xs">
                        <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${
                          quote.estado === 'Aceptada' ? 'border-semantic-success/30 bg-semantic-success/10 text-semantic-success' :
                          quote.estado === 'Borrador' ? 'border-hairline bg-canvas-elevated text-muted' :
                          'border-semantic-info/30 bg-semantic-info/10 text-semantic-info'
                        }`}>
                          {quote.estado}
                        </span>
                      </td>
                      <td className="px-sm py-xs text-right">
                        <QuoteActions quoteId={quote.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-hairline">
              {quotes.map((quote, index) => (
                <div key={quote.id} className="animate-fade-in px-sm py-xs space-y-xxs hover:bg-canvas/50 transition-colors" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start justify-between gap-xxs">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-ink text-sm">Nº {String(quote.correlativo).padStart(4, '0')}</span>
                      <p className="text-xs text-muted truncate">{quote.client.rut}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border text-[10px] ${
                      quote.estado === 'Aceptada' ? 'border-semantic-success/30 bg-semantic-success/10 text-semantic-success' :
                      quote.estado === 'Borrador' ? 'border-hairline bg-canvas-elevated text-muted' :
                      'border-semantic-info/30 bg-semantic-info/10 text-semantic-info'
                    }`}>
                      {quote.estado}
                    </span>
                  </div>
                  <p className="text-ink text-sm font-medium">{quote.client.razonSocial}</p>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{new Date(quote.fechaEmision).toLocaleDateString(locale)} → {new Date(quote.fechaValidez).toLocaleDateString(locale)}</span>
                    <span className="font-semibold text-ink">${quote.montoTotal.toLocaleString(locale)}</span>
                  </div>
                  <div className="flex justify-end pt-xxxs">
                    <QuoteActions quoteId={quote.id} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted">
            {t('noQuotes')}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-sm border-t border-hairline">
            <div className="text-xs text-muted">
              {t('pagination.showing', {
                start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                end: Math.min(currentPage * ITEMS_PER_PAGE, totalCount),
                total: totalCount
              })}
            </div>
            <div className="flex items-center gap-xxs">                  {currentPage > 1 ? (
                <Link
                  href={`/dashboard/quotes?page=${currentPage - 1}&sort=${sortField}&dir=${sortDir}`}
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
                  href={`/dashboard/quotes?page=${page}&sort=${sortField}&dir=${sortDir}`}
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
                  href={`/dashboard/quotes?page=${currentPage + 1}&sort=${sortField}&dir=${sortDir}`}
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
      </div>
    </div>
  );
}
