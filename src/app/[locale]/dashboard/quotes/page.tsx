import React from 'react';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import QuoteActions from '@/components/QuoteActions';

const ITEMS_PER_PAGE = 10;

interface QuotesListPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function QuotesListPage({ searchParams, params }: { searchParams: Promise<{ page?: string }>, params: Promise<{locale: string}> }) {
  const {locale} = await params;
  const t = await getTranslations('Quotes');
  const search = await searchParams;
  const currentPage = Math.max(1, parseInt(search.page || '1'));

  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.quote.count(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">
            {t('subtitle', { count: totalCount })}
          </p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
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

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {quotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.number')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.client')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.issueDate')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.validity')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.total')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.status')}</th>
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
            <div className="flex items-center gap-xxs">
              {currentPage > 1 ? (
                <Link
                  href={`/dashboard/quotes?page=${currentPage - 1}`}
                  className="px-sm h-[32px] text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                >
                  <span className="material-icons text-sm mr-1">chevron_left</span> {t('pagination.previous')}
                </Link>
              ) : (
                <span className="px-sm h-[32px] text-xs font-bold text-muted bg-transparent border border-hairline/50 rounded-none cursor-not-allowed flex items-center uppercase tracking-wider">
                  <span className="material-icons text-sm mr-1">chevron_left</span> {t('pagination.previous')}
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/dashboard/quotes?page=${page}`}
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
                  href={`/dashboard/quotes?page=${currentPage + 1}`}
                  className="px-sm h-[32px] text-xs font-bold text-ink bg-transparent border border-hairline rounded-none hover:bg-canvas transition-colors flex items-center uppercase tracking-wider"
                >
                  {t('pagination.next')} <span className="material-icons text-sm ml-1">chevron_right</span>
                </Link>
              ) : (
                <span className="px-sm h-[32px] text-xs font-bold text-muted bg-transparent border border-hairline/50 rounded-none cursor-not-allowed flex items-center uppercase tracking-wider">
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
