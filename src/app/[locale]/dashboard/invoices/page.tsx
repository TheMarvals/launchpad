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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('title')}</h1>
          <p className="text-slate-500 text-sm">{t('subtitle', { count: invoices.length })}</p>
        </div>
        <Link 
          href="/dashboard/invoices/new"
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center"
        >
          <span className="material-icons mr-2 text-sm">add</span> {t('newInvoice')}
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('table.number')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('table.client')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('table.issueDate')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('table.dueDate')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('table.total')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('table.status')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                  {t('noInvoices')}
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-black text-slate-900">#{String(invoice.correlativo).padStart(4, '0')}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-700">{invoice.client.razonSocial}</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-tight">{invoice.client.rut}</div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-500">
                    {new Date(invoice.fechaEmision).toLocaleDateString(locale)}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-sm font-bold ${
                      new Date(invoice.fechaVencimiento) < new Date() && invoice.estado === 'Pendiente' 
                        ? 'text-red-500' 
                        : 'text-slate-500'
                    }`}>
                      {new Date(invoice.fechaVencimiento).toLocaleDateString(locale)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-black text-slate-900">${invoice.montoTotal.toLocaleString(locale)}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      invoice.estado === 'Pagada' ? 'bg-green-100 text-green-700' : 
                      invoice.estado === 'Anulada' ? 'bg-slate-100 text-slate-500' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {t(`status.${invoice.estado}`)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <InvoiceActions invoice={invoice} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
