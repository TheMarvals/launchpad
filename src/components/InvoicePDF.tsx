import React from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface InvoicePDFProps {
  invoice: any;
  companyProfile?: any;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, companyProfile }) => {
  const t = useTranslations('PDF');
  const tInv = useTranslations('Invoices');
  const locale = useLocale();

  return (
    <div className="pdf-wrapper max-w-[210mm] print:max-w-full mx-auto print:mx-0 space-y-8 print:space-y-0 overflow-x-auto md:overflow-x-visible">
      <div className="pdf-page w-full min-h-[297mm] bg-white text-slate-800 font-sans relative flex flex-col shadow-2xl print:shadow-none print:break-after-page overflow-hidden">
        {/* Header */}
        <header className="relative w-full p-10 pb-12 text-white shrink-0 overflow-hidden" style={{ background: '#050212' }}>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent skew-x-[-15deg] translate-x-20" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="relative z-10 flex justify-between items-center">
            <div className="space-y-4">
              <div className="relative inline-block">
                <h1 className="hero-heading text-[60px] font-black mb-0 stroke-text leading-[0.8] tracking-[-0.05em]">{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent" />
              </div>
              <div className="flex flex-col space-y-1.5 pt-4">
                <div className="flex items-center text-[8px] font-black tracking-[0.3em] text-blue-400 uppercase">
                  <span className="w-4 h-[1px] bg-blue-400 mr-3"></span> {t('architecture')}
                </div>
                <div className="flex items-center text-[9px] font-bold tracking-wider text-slate-400 uppercase pl-7">
                  {t('consulting')}
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="mb-6">
                <h2 className="text-xl font-black tracking-tight uppercase leading-none text-white">{companyProfile?.name || 'Eduardo Marval'}</h2>
                <div className="text-[9px] font-medium text-blue-400/80 uppercase tracking-widest mt-1">{companyProfile?.role || 'Lead Solution Architect'}</div>
              </div>
              <div className="space-y-1.5 border-r-2 border-blue-500/30 pr-4">
                <div className="text-[9px] font-bold text-slate-300">{companyProfile?.taxIdLabel || 'TAX ID'}: {companyProfile?.taxId || '27.087.979-9'}</div>
                <div className="text-[9px] font-bold text-slate-300">TELF: {companyProfile?.phone || '+569 94438833'}</div>
                <div className="text-[9px] font-bold text-slate-300 lowercase">{companyProfile?.email || 'e.marval@themarvals.com'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-12 pb-32 relative">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] overflow-hidden">
            <h1 className="whitespace-nowrap font-black select-none tracking-tighter" style={{ fontSize: '800px', transform: 'rotate(-35deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#1e3a8a', WebkitTextStrokeWidth: '5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
          </div>

          <div className="relative z-10 space-y-10">
            {/* Metadata */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-8">
              <div className="max-w-[60%]">
                <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-[0.2em] rounded-md mb-3">
                  {t('clientInfo')}
                </div>
                <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900 leading-tight mb-2">
                  {invoice.client?.razonSocial || 'CLIENTE'}
                </h3>                  <div className="space-y-0.5 text-xs font-bold text-slate-400">
                  <div>{companyProfile?.taxIdLabel || 'TAX ID'}: {invoice.client?.rut || '---'}</div>
                  <div className="font-medium italic opacity-80 text-[11px]">{invoice.client?.giro || 'Servicios Informáticos'}</div>
                </div>
              </div>
              <div className="text-right space-y-4">
                <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t('document')}</div>
                  <div className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                    FACTURA <span className="text-blue-600">#{String(invoice.correlativo || 0).padStart(4, '0')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                  <div className="text-[9px] font-black text-slate-300 uppercase">{tInv('table.issueDate')}</div>
                  <div className="text-xs font-black text-slate-800">{new Date(invoice.fechaEmision || Date.now()).toLocaleDateString(locale)}</div>
                  <div className="text-[9px] font-black text-slate-300 uppercase">{tInv('table.dueDate')}</div>
                  <div className="text-xs font-black text-red-600">{new Date(invoice.fechaVencimiento).toLocaleDateString(locale)}</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-slate-900 uppercase text-[11px] font-black tracking-[0.3em] mr-4 whitespace-nowrap">{t('investmentDetail')}</h3>
                <div className="h-[1px] bg-slate-100 w-full"></div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-[10px] uppercase text-slate-500 tracking-widest font-black border-b border-slate-100">
                      <th className="p-4">{t('description')}</th>
                      <th className="p-4 text-right w-20">{t('quantity')}</th>
                      <th className="p-4 text-right w-28">{t('subtotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(invoice.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="text-[13px]">
                        <td className="p-4 font-bold text-slate-800">{item.descripcion}</td>
                        <td className="p-4 text-right font-bold text-slate-300">{item.cantidad}</td>
                        <td className="p-4 text-right font-black text-slate-900">${(item.subtotal || 0).toLocaleString(locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-8 items-start">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3">{t('conditions')}</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {invoice.notas}
                </p>
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    invoice.estado === 'Pagada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {invoice.estado}
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-4 w-64 ml-auto">
                <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <span>{t('net')}</span>
                  <span>${(invoice.montoNeto || 0).toLocaleString(locale)}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <span>{invoice.taxName || t('tax')} ({invoice.taxPercent ?? 19}%)</span>
                  <span>${(invoice.montoIva || 0).toLocaleString(locale)}</span>
                </div>
                {invoice.extraFeeAmount > 0 && (
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                    <span>{invoice.extraFeeName || t('fee')}</span>
                    <span>${(invoice.extraFeeAmount || 0).toLocaleString(locale)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 self-center">{t('total')}</span>
                  <span>${(invoice.montoTotal || 0).toLocaleString(locale)}</span>
                </div>
                {invoice.paymentMethod && (
                  <div className="pt-4 mt-4 border-t border-slate-50 text-right">
                    <div className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">{t('paymentMethod')}</div>
                    <div className="text-[10px] font-bold text-slate-800">{invoice.paymentMethod}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="absolute bottom-0 left-0 w-full p-6 text-slate-300 text-center shrink-0" style={{ background: '#050212' }}>
          <div className="text-[12px] font-black uppercase tracking-[0.6em] text-white">{companyProfile?.brandNameFooter || 'EDUARDO MARVAL'}</div>
          <div className="h-px w-8 bg-blue-500 mx-auto my-3 opacity-30"></div>
          <div className="text-[8px] font-bold opacity-40 space-x-6 uppercase tracking-widest">
            <span>{companyProfile?.address || 'ANTONIO BELLET 193 OF 1210 12P, PROVIDENCIA, RM'}</span>
            <span>•</span>
            <span>{companyProfile?.email || 'e.marval@themarvals.com'}</span>
          </div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;700;900&display=swap');
        
        .pdf-page {
          font-family: 'Outfit', sans-serif;
          page-break-after: always;
        }

        .stroke-text {
          color: white;
          font-family: 'Outfit', sans-serif;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke-width: 2px;
          -webkit-text-stroke-color: rgba(255, 255, 255, 0.9);
        }

        @media screen and (max-width: 767px) {
          .pdf-wrapper {
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: none !important;
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body { 
            background-color: white; 
            margin: 0; 
            padding: 0; 
            width: 100%; 
            height: 100%; 
          }
          .pdf-wrapper { 
            max-width: 100% !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 0 !important; 
          }
          .shadow-2xl { box-shadow: none !important; }
          .pdf-page { 
            width: 100% !important; 
            height: 100vh !important; 
            max-height: none !important; 
            min-height: 100vh !important; 
            border: none !important; 
            margin: 0 !important; 
          }
        }
      `}} />
    </div>
  );
};

export default InvoicePDF;
