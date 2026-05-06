import React from 'react';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import QuoteActions from '@/components/QuoteActions';

export default async function DashboardPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('Dashboard');
  const session = await auth();
  const quotesCount = await prisma.quote.count();
  const clientsCount = await prisma.client.count();
  
  const recentQuotes = await prisma.quote.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { client: true }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('welcome', { name: session?.user?.name?.split(' ')[0] || 'Usuario' })}</h1>
          <p className="text-gray-500 mt-1">{t('summary')}</p>
        </div>
        <Link 
          href="/dashboard/quotes/new" 
          className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
        >
          + {t('newQuote')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title={t('stats.quotes')} value={quotesCount} icon="description" />
        <StatCard title={t('stats.clients')} value={clientsCount} icon="people" />
        <StatCard title={t('stats.total')} value="$0" icon="payments" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-6">{t('recentQuotes.title')}</h2>
        
        {recentQuotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b">
                  <th className="pb-4">{t('recentQuotes.correlative')}</th>
                  <th className="pb-4">{t('recentQuotes.client')}</th>
                  <th className="pb-4">{t('recentQuotes.date')}</th>
                  <th className="pb-4">{t('recentQuotes.total')}</th>
                  <th className="pb-4">{t('recentQuotes.status')}</th>
                  <th className="pb-4 text-right">{t('recentQuotes.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="text-sm">
                    <td className="py-4 font-bold text-blue-900">Nº {String(quote.correlativo).padStart(4, '0')}</td>
                    <td className="py-4">{quote.client.razonSocial}</td>
                    <td className="py-4">{new Date(quote.fechaEmision).toLocaleDateString(locale)}</td>
                    <td className="py-4 font-bold">${quote.montoTotal.toLocaleString(locale)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        quote.estado === 'Aceptada' ? 'bg-green-100 text-green-700' :
                        quote.estado === 'Borrador' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {quote.estado}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <QuoteActions quoteId={quote.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            {t('recentQuotes.noQuotes')}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-900">
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}
