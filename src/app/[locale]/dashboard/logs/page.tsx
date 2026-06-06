import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Link, redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

const ITEMS_PER_PAGE = 15;

export default async function AuditLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
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

  const [logs, totalCount] = await Promise.all([
    prisma.actionLog.findMany({
      orderBy: { createdAt: 'desc' },
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
    prisma.actionLog.count(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-md font-sans">
      <div>
        <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
        <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
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
                      href={`/dashboard/logs?page=${currentPage - 1}`}
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
                      href={`/dashboard/logs?page=${page}`}
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
                      href={`/dashboard/logs?page=${currentPage + 1}`}
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
          </>
        ) : (
          <div className="text-center py-xl px-sm">
            <div className="w-[72px] h-[72px] bg-canvas flex items-center justify-center mx-auto mb-xs">
              <span className="material-icons text-muted text-4xl">policy</span>
            </div>
            <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed">{t('noLogs')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
