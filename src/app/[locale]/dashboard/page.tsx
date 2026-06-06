import React from 'react';
import { redirect } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import QuoteActions from '@/components/QuoteActions';
export default async function DashboardPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('Dashboard');
  const session = await auth();

  // Redirect non-admin users to their client portal
  if (session?.user && session.user.role !== 'ADMIN') {
    redirect({ href: '/client-portal', locale });
  }
  const quotesCount = await prisma.quote.count();
  const invoicesCount = await prisma.invoice.count();
  const clientsCount = await prisma.client.count();
  
  const totalInvoiced = await prisma.invoice.aggregate({
    _sum: { montoNeto: true },
    where: { estado: 'Pagada' }
  });

  const totalIncome = totalInvoiced._sum.montoNeto || 0;
  
  const recentQuotes = await prisma.quote.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { client: true }
  });

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">
            {t('welcome', { name: session?.user?.name?.split(' ')[0] || 'Usuario' })}
          </h1>
          <p className="text-body text-muted mt-[4px]">{t('summary')}</p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
          <Link 
            href="/dashboard/invoices/new" 
            className="flex-1 sm:flex-initial bg-transparent border border-ink text-ink hover:bg-ink/10 px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
          >
            + {t('newInvoice')}
          </Link>
          <Link 
            href="/dashboard/quotes/new" 
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary-active text-white px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
          >
            + {t('newQuote')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xs">
        <StatCard title={t('stats.quotes')} value={quotesCount} icon="description" />
        <StatCard title={t('stats.invoices') || 'Facturas'} value={invoicesCount} icon="receipt_long" color="green" />
        <StatCard title={t('stats.clients')} value={clientsCount} icon="people" />
        <StatCard title={t('stats.total')} value={`$${totalIncome.toLocaleString(locale)}`} icon="payments" color="red" />
      </div>

      {/* Recent Quotes table */}
      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        <div className="px-sm py-xs border-b border-hairline bg-canvas">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">
            {t('recentQuotes.title')}
          </h2>
        </div>
        
        {recentQuotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('recentQuotes.correlative')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('recentQuotes.client')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('recentQuotes.date')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('recentQuotes.total')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('recentQuotes.status')}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('recentQuotes.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-canvas/80 transition-colors group">
                    <td className="px-sm py-xs font-medium text-ink text-sm">Nº {String(quote.correlativo).padStart(4, '0')}</td>
                    <td className="px-sm py-xs text-ink text-sm">{quote.client.razonSocial}</td>
                    <td className="px-sm py-xs text-body text-muted">{new Date(quote.fechaEmision).toLocaleDateString(locale)}</td>
                    <td className="px-sm py-xs font-medium text-ink text-sm">${quote.montoTotal.toLocaleString(locale)}</td>
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
          <div className="text-center py-xl px-sm">
            <div className="w-[72px] h-[72px] bg-canvas flex items-center justify-center mx-auto mb-xs">
              <span className="material-icons text-muted text-4xl">description</span>
            </div>
            <p className="text-sm text-muted">{t('recentQuotes.noQuotes')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = 'blue' }: { title: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="bg-canvas-elevated p-sm rounded-none border border-hairline flex items-center space-x-xxs">
      <div className={`w-[48px] h-[48px] flex items-center justify-center rounded-none bg-canvas text-primary`}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <p className="text-caption-uppercase text-muted tracking-wider">{title}</p>
        <p className="text-xl font-medium text-ink tracking-tight">{value}</p>
      </div>
    </div>
  );
}
