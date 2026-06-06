import React from 'react';
import { getInvoices } from '@/app/actions/invoices';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import InvoiceActions from '@/components/InvoiceActions';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const invoices = await getInvoices();
  const t = await getTranslations('Invoices');

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle', { count: invoices.length })}</p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
          <Link 
            href="/dashboard/invoices/new"
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary-active text-white px-sm h-[48px] rounded-none text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer"
          >
            + {t('newInvoice')}
          </Link>
        </div>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas border-b border-hairline">
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.number')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.client')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.issueDate')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{t('table.dueDate')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{t('table.total')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-center">{t('table.status')}</th>
                <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-center">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-xl text-center text-body text-muted">
                    {t('noInvoices')}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-canvas/80 transition-colors group">
                    <td className="px-sm py-xs">
                      <span className="font-medium text-ink text-sm">Nº {String(invoice.correlativo).padStart(4, '0')}</span>
                    </td>
                    <td className="px-sm py-xs">
                      <div className="font-medium text-ink text-sm">{invoice.client.razonSocial}</div>
                      <div className="text-xs text-muted">{invoice.client.rut}</div>
                    </td>
                    <td className="px-sm py-xs text-body text-muted">
                      {new Date(invoice.fechaEmision).toLocaleDateString(locale)}
                    </td>
                    <td className="px-sm py-xs">
                      <span className={`font-medium ${
                        new Date(invoice.fechaVencimiento) < new Date() && invoice.estado === 'Pendiente' 
                          ? 'text-semantic-danger' 
                          : 'text-muted'
                      }`}>
                        {new Date(invoice.fechaVencimiento).toLocaleDateString(locale)}
                      </span>
                    </td>
                    <td className="px-sm py-xs text-right">
                      <span className="font-medium text-ink">${invoice.montoTotal.toLocaleString(locale)}</span>
                    </td>
                    <td className="px-sm py-xs text-center">
                      <span className={`inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border ${
                        invoice.estado === 'Pagada' ? 'border-semantic-success/30 bg-semantic-success/10 text-semantic-success' : 
                        invoice.estado === 'Anulada' ? 'border-hairline bg-canvas-elevated text-muted' : 
                        'border-semantic-warning/30 bg-semantic-warning/10 text-semantic-warning'
                      }`}>
                        {t(`status.${invoice.estado}`)}
                      </span>
                    </td>
                    <td className="px-sm py-xs text-center">
                      <InvoiceActions invoice={invoice} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
