import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function AuditLogsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('Audit');
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect({href: '/', locale});
    return null;
  }

  const logs = await prisma.actionLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
      server: {
        select: { name: true, ipAddress: true, providerId: true },
      },
    },
    take: 100, // Limit to recent 100 logs for performance
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">{t('table.date')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('table.user')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('table.server')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('table.action')}</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-right">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(log.createdAt).toLocaleString(locale, {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{log.user.name}</div>
                    <div className="text-xs text-gray-500">{log.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{log.server.name}</div>
                    <div className="text-xs text-gray-500">{log.server.ipAddress || log.server.providerId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        {t('status.success')}
                      </span>
                    ) : log.status === 'PENDING' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                        {t('status.pending')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800" title={log.details || ''}>
                        {t('status.failed')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t('noLogs')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
