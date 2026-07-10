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

  const senderName = invoice?.user?.name || companyProfile?.user?.name || companyProfile?.name || 'Eduardo Marval';
  const senderRole = invoice?.user?.cargo || companyProfile?.user?.cargo || companyProfile?.role || 'Lead Solution Architect';
  const senderPhone = invoice?.user?.telefono || companyProfile?.user?.telefono || companyProfile?.phone || '+569 94438833';
  const senderEmail = companyProfile?.email || 'e.marval@themarvals.com';

  return (
    <div className="pdf-wrapper max-w-[210mm] print:max-w-full mx-auto print:mx-0 notranslate overflow-x-auto md:overflow-x-visible" translate="no">
      <div className="pdf-page w-full h-[297mm] bg-white text-slate-800 font-sans relative flex flex-col shadow-2xl print:shadow-none print:break-after-page overflow-hidden">
        {/* Header — identical to QuotePDF page 1 */}
        <header className="relative w-full p-10 pb-12 text-white shrink-0 overflow-hidden" style={{ background: '#0B1026' }}>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent skew-x-[-15deg] translate-x-20" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="relative z-10 flex justify-between items-center">
            <div className="space-y-4">
              <div className="relative inline-block">
                <h1 className="hero-heading text-[60px] font-black mb-0 stroke-text leading-[0.8] tracking-[-0.05em]">{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
              </div>
              <div className="flex flex-col space-y-1.5 pt-4">
                <div className="flex items-center text-[8px] font-black tracking-[0.3em] text-primary uppercase">
                  <span className="w-4 h-[1px] bg-primary mr-3"></span> {companyProfile?.systemsTitle || t('architecture')}
                </div>
                <div className="flex items-center text-[9px] font-bold tracking-wider text-slate-400 uppercase pl-7">
                  {companyProfile?.systemsSubtitle || t('consulting')}
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="mb-6">
                <h2 className="text-xl font-black tracking-tight uppercase leading-none text-white">{senderName}</h2>
                <div className="text-[9px] font-medium text-primary/80 uppercase tracking-widest mt-1">{senderRole}</div>
              </div>
              <div className="space-y-1.5 border-r-2 border-[#303030] pr-4">
                <div className="text-[9px] font-bold text-slate-300">{companyProfile?.taxIdLabel || 'TAX ID'}: {companyProfile?.taxId || '27.087.979-9'}</div>
                <div className="text-[9px] font-bold text-slate-300">TELF: {senderPhone}</div>
                <div className="text-[9px] font-bold text-slate-300 lowercase">{senderEmail}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow px-10 pt-10 pb-8 overflow-hidden">
          {/* Watermark — identical to QuotePDF */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] overflow-hidden">
            <h1 className="whitespace-nowrap font-black select-none tracking-tighter" style={{ fontSize: '800px', transform: 'rotate(-35deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#181818', WebkitTextStrokeWidth: '5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
          </div>

          <div className="relative z-10 space-y-12">
            {/* Client info + Invoice metadata — same structure as QuotePDF */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-8">
              <div className="max-w-[60%]">
                <div className="inline-block px-2 py-1 bg-slate-100 text-slate-800 text-[8px] font-black uppercase tracking-[0.2em] rounded-none mb-3">
                  {t('clientInfo')}
                </div>
                <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900 leading-tight mb-2">
                  {invoice.client?.razonSocial || 'CLIENTE'}
                </h3>
                <div className="space-y-0.5 text-xs font-bold text-slate-400">
                  <div>{companyProfile?.taxIdLabel || 'TAX ID'}: {invoice.client?.rut || '---'}</div>
                  <div className="font-medium italic opacity-80 text-[11px]">{invoice.client?.giro || 'Servicios Informáticos'}</div>
                </div>
              </div>
              <div className="text-right space-y-4">
                <div className="space-y-1">
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t('document')}</div>
                  <div className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                    {locale === 'en' ? 'INVOICE' : 'FACTURA'} <span className="text-primary">#{String(invoice.correlativo || 0).padStart(4, '0')}</span>
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

            {/* Investment Detail table — identical structure to QuotePDF */}
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
                        <td className="p-4 text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                          {item.descripcion.includes('\n') ? (
                            <>
                              <div className="font-bold text-sm mb-1">{item.descripcion.split('\n')[0]}</div>
                              <div className="font-normal text-slate-500 mt-1 pl-2 border-l-2 border-blue-500/20">
                                {item.descripcion.substring(item.descripcion.indexOf('\n') + 1)}
                              </div>
                            </>
                          ) : (
                            <span className="font-bold">{item.descripcion}</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-300">{item.cantidad}</td>
                        <td className="p-4 text-right font-black text-slate-900">${(item.subtotal || 0).toLocaleString(locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals — identical structure to QuotePDF */}
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
                <span className="text-[10px] uppercase tracking-widest text-slate-500 self-center">{invoice.totalLabel || t('total')}</span>
                <span>${(invoice.montoTotal || 0).toLocaleString(locale)}</span>
              </div>
              {invoice.paymentMethod && (
                <div className="pt-4 mt-4 border-t border-slate-50 text-right">
                  <div className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">{t('paymentMethod')}</div>
                  <div className="text-[10px] font-bold text-slate-800">{invoice.paymentMethod}</div>
                </div>
              )}
            </div>

            {/* Notes & Conditions — same structure as QuotePDF */}
            {invoice.notas && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <h3 className="text-slate-900 uppercase text-[11px] font-black tracking-[0.3em] mr-4 whitespace-nowrap">{t('conditions')}</h3>
                  <div className="h-[1px] bg-slate-100 w-full"></div>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">
                  {invoice.notas}
                </div>
              </div>
            )}

            {/* Status badge — only shown for non-Pendiente */}
            {invoice.estado !== 'Pendiente' && (
              <div className="flex justify-end">
                <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  invoice.estado === 'Pagada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {invoice.estado}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer — identical to QuotePDF */}
        <footer className="w-full p-6 text-slate-300 text-center shrink-0" style={{ background: '#0B1026' }}>
          <div className="text-[12px] font-black uppercase tracking-[0.6em] text-white">{companyProfile?.brandNameFooter || senderName.toUpperCase()}</div>
          <div className="h-px w-8 bg-primary mx-auto my-3 opacity-30"></div>
          <div className="text-[8px] font-bold opacity-40 space-x-6 uppercase tracking-widest">
            <span>{companyProfile?.address || 'ANTONIO BELLET 193 OF 1210 12P, PROVIDENCIA, RM'}</span>
            <span>•</span>
            <span>{senderEmail}</span>
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
