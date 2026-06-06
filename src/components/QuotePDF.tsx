'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface QuotePDFProps {
  quote: any;
  isTemplate?: boolean;
  companyProfile?: any;
}

// Available content height in mm for each page type
// Page = 297mm. We subtract header, footer, and padding.
const FIRST_PAGE_CONTENT_MM = 155;  // 297 - bigHeader(~48) - footer(~22) - clientInfo(~32) - margins(~40)
const OTHER_PAGE_CONTENT_MM = 220;  // 297 - smallHeader(~22) - footer(~22) - margins(~33)

const QuotePDF: React.FC<QuotePDFProps> = ({ quote, isTemplate, companyProfile }) => {
  const t = useTranslations('PDF');
  const locale = useLocale();
  const measureRef = useRef<HTMLDivElement>(null);
  const [computedPages, setComputedPages] = useState<string[]>([]);

  // Clean the raw HTML and convert PAGE_BREAK markers to measurable elements
  const rawContent = isTemplate
    ? `
      <h1>PROPUESTA DE CONSULTORÍA Y ARQUITECTURA DE SOFTWARE</h1>
      <p>Esta es una plantilla de propuesta de servicios profesionales para el desarrollo, diseño y optimización de arquitectura e infraestructura en la nube. Los detalles específicos del alcance técnico se describen en las secciones posteriores.</p>
      
      <h2>1. RESUMEN DEL PROYECTO</h2>
      <p>Definición del desafío tecnológico, objetivos estratégicos de negocio y valor esperado para el cliente.</p>
      <div style="height: 120px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [ÁREA PARA EL RESUMEN EJECUTIVO / EXECUTIVE SUMMARY BOX]
      </div>

      <h2>2. ARQUITECTURA Y TECNOLOGÍAS PROPUESTAS</h2>
      <p>Descripción técnica de la infraestructura, lenguajes de programación y herramientas sugeridas para el proyecto.</p>
      <div style="height: 140px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [DIAGRAMA DE ARQUITECTURA / ARQUITECTURE DESIGN BOX]
      </div>

      <hr class="forced-page-break" />

      <h2>3. ALCANCE Y ENTREGABLES POR FASES</h2>
      <p>Detalle de las actividades clave de desarrollo, integración y despliegue continuo estructurado en fases de sprint.</p>
      <div style="height: 180px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [DESGLOSE DE SPRINT Y ENTREGABLES / DEPLOYMENT ROADMAP BOX]
      </div>

      <h2>4. EQUIPO DE TRABAJO Y GOBERNANZA</h2>
      <p>Roles asignados al proyecto, metodologías ágiles de seguimiento, reportabilidad y control de calidad.</p>
      <div style="height: 100px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [EQUIPO DE TRABAJO / TEAM ROLES BOX]
      </div>
    `
    : (quote.propuesta || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/---PAGE_BREAK---/g, '<hr class="forced-page-break" />');

  const paginateContent = useCallback(() => {
    const container = measureRef.current;
    if (!container || !rawContent) {
      setComputedPages([rawContent || '']);
      return;
    }

    // Inject content into hidden measurement container
    container.innerHTML = rawContent;

    // Calculate px per mm from the container's known width (should be ~189mm)
    // container width in CSS = calc(210mm - 5rem). At 16px base, 5rem=80px.
    // 210mm at 96dpi ≈ 793.7px, so content ≈ 713.7px for ~189mm.
    // pxPerMm ≈ containerWidth / 189
    const containerWidth = container.clientWidth;
    const pxPerMm = containerWidth / 189;

    const firstPageMax = FIRST_PAGE_CONTENT_MM * pxPerMm;
    const otherPageMax = OTHER_PAGE_CONTENT_MM * pxPerMm;

    const children = Array.from(container.children) as HTMLElement[];
    const pages: string[] = [];
    let currentPageHTML = '';
    let currentHeight = 0;
    let pageIndex = 0;

    const getMaxHeight = (idx: number) => (idx === 0 ? firstPageMax : otherPageMax);

    for (const child of children) {
      // Forced page break
      if (child.classList.contains('forced-page-break')) {
        if (currentPageHTML) {
          pages.push(currentPageHTML);
          currentPageHTML = '';
          currentHeight = 0;
          pageIndex++;
        }
        continue;
      }

      const style = getComputedStyle(child);
      const childHeight =
        child.offsetHeight +
        parseFloat(style.marginTop || '0') +
        parseFloat(style.marginBottom || '0');

      // If this child overflows the current page and we already have content, start a new page
      if (currentHeight + childHeight > getMaxHeight(pageIndex) && currentPageHTML) {
        pages.push(currentPageHTML);
        currentPageHTML = '';
        currentHeight = 0;
        pageIndex++;
      }

      currentPageHTML += child.outerHTML;
      currentHeight += childHeight;
    }

    if (currentPageHTML) {
      pages.push(currentPageHTML);
    }

    // Clean up
    container.innerHTML = '';

    setComputedPages(pages.length > 0 ? pages : ['']);
  }, [rawContent]);

  useEffect(() => {
    // Small delay to ensure fonts are loaded and measurement is accurate
    const timer = setTimeout(paginateContent, 100);
    return () => clearTimeout(timer);
  }, [paginateContent]);

  const totalPages = computedPages.length + 1; // +1 for investment page

  return (
    <>
      {/* Hidden measurement container — matches content area width and styles */}
      <div
        ref={measureRef}
        className="propuesta-content text-slate-600 leading-relaxed text-justify font-sans text-[15px] space-y-4"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          width: 'calc(210mm - 5rem)',
          pointerEvents: 'none',
          zIndex: -9999,
          top: 0,
          left: 0,
        }}
        aria-hidden="true"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        html, body { margin: 0 !important; padding: 0 !important; }
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; }
          .pdf-wrapper { space-y: 0 !important; }
        }
      `}} />

      <div className="pdf-wrapper w-full max-w-[210mm] print:max-w-full mx-auto print:mx-0 notranslate" translate="no">
        {/* Proposal Pages (auto-paginated) */}
        {computedPages.map((pageContent: string, pageIdx: number) => (
          <div key={pageIdx} className="pdf-page w-full h-[297mm] bg-white text-slate-800 font-sans relative flex flex-col shadow-2xl print:shadow-none print:break-after-page overflow-hidden">
            {/* Header */}
            {pageIdx === 0 ? (
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
                      <h2 className="text-xl font-black tracking-tight uppercase leading-none text-white">{companyProfile?.name || 'Eduardo Marval'}</h2>
                      <div className="text-[9px] font-medium text-primary/80 uppercase tracking-widest mt-1">{companyProfile?.role || 'Lead Solution Architect'}</div>
                    </div>
                    <div className="space-y-1.5 border-r-2 border-[#303030] pr-4">
                      <div className="text-[9px] font-bold text-slate-300">{companyProfile?.taxIdLabel || 'TAX ID'}: {companyProfile?.taxId || '27.087.979-9'}</div>
                      <div className="text-[9px] font-bold text-slate-300">TELF: {companyProfile?.phone || '+569 94438833'}</div>
                      <div className="text-[9px] font-bold text-slate-300 lowercase">{companyProfile?.email || 'e.marval@themarvals.com'}</div>
                    </div>
                  </div>
                </div>
              </header>
            ) : (
              <header className="relative w-full p-8 border-b border-slate-50 shrink-0 flex justify-between items-center bg-white">
                <div className="relative inline-block">
                  <h1 className="text-3xl font-black mb-0 stroke-text leading-none tracking-tighter" style={{ WebkitTextStrokeColor: '#000000', WebkitTextStrokeWidth: '1.5px' }}>{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary" />
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">{pageIdx + 1} / {totalPages}</div>
              </header>
            )}

            {/* Page Content */}
            <main className="flex-grow px-10 pt-10 pb-24 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] overflow-hidden">
                <h1 className="whitespace-nowrap font-black select-none tracking-tighter" style={{ fontSize: '800px', transform: 'rotate(-35deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#181818', WebkitTextStrokeWidth: '5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
              </div>

              <div className="relative z-10 space-y-8">
                {/* Client info — only on page 1 */}
                {pageIdx === 0 && (
                  <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                    <div className="max-w-[60%]">
                      <div className="inline-block px-2 py-1 bg-slate-100 text-slate-800 text-[8px] font-black uppercase tracking-[0.2em] rounded-none mb-3">
                        {t('clientInfo')}
                      </div>
                      {isTemplate ? (
                        <div className="space-y-3 pt-1">
                          <div className="text-xs font-black text-slate-400">RAZÓN SOCIAL / CLIENT: <span className="font-normal border-b border-dotted border-slate-400 w-48 inline-block h-3.5 pl-2"></span></div>
                          <div className="text-xs font-black text-slate-400">RUT / TAX ID: <span className="font-normal border-b border-dotted border-slate-400 w-32 inline-block h-3.5 pl-2"></span></div>
                          <div className="text-xs font-black text-slate-400">GIRO / ACTIVITY: <span className="font-normal border-b border-dotted border-slate-400 w-40 inline-block h-3.5 pl-2"></span></div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900 leading-tight mb-2">
                            {quote.client?.razonSocial || 'CLIENTE DE PRUEBA'}
                          </h3>
                          <div className="space-y-0.5 text-xs font-bold text-slate-400">
                            <div>{companyProfile?.taxIdLabel || 'TAX ID'}: {quote.client?.rut || '---'}</div>
                            <div className="font-medium italic opacity-80 text-[11px]">{quote.client?.giro || 'Servicios Informáticos'}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right space-y-4">
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t('document')}</div>
                        <div className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                          {t('quote')} <span className="text-primary">#{isTemplate ? 'XXXX' : String(quote.correlativo || 0).padStart(4, '0')}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                        <div className="text-[9px] font-black text-slate-300 uppercase">{t('issue')}</div>
                        <div className="text-xs font-black text-slate-800">{isTemplate ? '__/__/____' : new Date(quote.fechaEmision || Date.now()).toLocaleDateString(locale)}</div>
                        <div className="text-[9px] font-black text-slate-300 uppercase">{t('validity')}</div>
                        <div className="text-xs font-black text-primary">{isTemplate ? '__/__/____' : (quote.fechaValidez ? new Date(quote.fechaValidez).toLocaleDateString(locale) : t('toDefine'))}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proposal content for this page */}
                <div
                  className="propuesta-content text-slate-600 leading-relaxed text-justify font-sans text-[15px] space-y-4"
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />
              </div>
            </main>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 w-full p-6 text-slate-300 text-center shrink-0" style={{ background: '#0B1026' }}>
              <div className="text-[12px] font-black uppercase tracking-[0.6em] text-white">{companyProfile?.brandNameFooter || 'EDUARDO MARVAL'}</div>
              <div className="h-px w-8 bg-primary mx-auto my-3 opacity-30"></div>
              <div className="text-[8px] font-bold opacity-40 space-x-6 uppercase tracking-widest">
                <span>{companyProfile?.address || 'ANTONIO BELLET 193 OF 1210 12P, PROVIDENCIA, RM'}</span>
                <span>•</span>
                <span>{companyProfile?.email || 'e.marval@themarvals.com'}</span>
              </div>
            </footer>
          </div>
        ))}

        {/* Investment Detail Page */}
        <div className="pdf-page w-full h-[297mm] bg-white text-slate-800 font-sans relative flex flex-col shadow-2xl print:shadow-none print:break-after-page overflow-hidden">
          <header className="relative w-full p-8 border-b border-slate-50 shrink-0 flex justify-between items-center bg-white">
            <div className="relative inline-block">
              <h1 className="text-3xl font-black mb-0 stroke-text leading-none tracking-tighter" style={{ WebkitTextStrokeColor: '#000000', WebkitTextStrokeWidth: '1.5px' }}>{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary" />
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">{totalPages} / {totalPages}</div>
          </header>

          <main className="flex-grow px-10 pt-10 pb-20 relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] overflow-hidden">
              <h1 className="whitespace-nowrap font-black select-none tracking-tighter" style={{ fontSize: '800px', transform: 'rotate(-35deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#181818', WebkitTextStrokeWidth: '5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{companyProfile?.brandNameHeader || 'LAUNCHPAD'}</h1>
            </div>

            <div className="relative z-10 space-y-12">
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
                      {isTemplate ? (
                        <>
                          <tr className="text-[13px]">
                            <td className="p-4 font-bold text-slate-400 border-b border-dotted border-slate-100">1. <span className="font-normal border-b border-dashed border-slate-300 w-64 inline-block h-3 pt-2"></span></td>
                            <td className="p-4 text-right font-bold text-slate-400 border-b border-dotted border-slate-100">__</td>
                            <td className="p-4 text-right font-black text-slate-400 border-b border-dotted border-slate-100">$__________</td>
                          </tr>
                          <tr className="text-[13px]">
                            <td className="p-4 font-bold text-slate-400 border-b border-dotted border-slate-100">2. <span className="font-normal border-b border-dashed border-slate-300 w-64 inline-block h-3 pt-2"></span></td>
                            <td className="p-4 text-right font-bold text-slate-400 border-b border-dotted border-slate-100">__</td>
                            <td className="p-4 text-right font-black text-slate-400 border-b border-dotted border-slate-100">$__________</td>
                          </tr>
                          <tr className="text-[13px]">
                            <td className="p-4 font-bold text-slate-400 border-b border-dotted border-slate-100">3. <span className="font-normal border-b border-dashed border-slate-300 w-64 inline-block h-3 pt-2"></span></td>
                            <td className="p-4 text-right font-bold text-slate-400 border-b border-dotted border-slate-100">__</td>
                            <td className="p-4 text-right font-black text-slate-400 border-b border-dotted border-slate-100">$__________</td>
                          </tr>
                        </>
                      ) : (
                        (quote.items || []).map((item: any, idx: number) => (
                          <tr key={idx} className="text-[13px]">
                            <td className="p-4 font-bold text-slate-800">{item.descripcion}</td>
                            <td className="p-4 text-right font-bold text-slate-300">{item.cantidad}</td>
                            <td className="p-4 text-right font-black text-slate-900">${(item.subtotal || 0).toLocaleString(locale)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2 p-4 w-64 ml-auto">
                <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <span>{t('net')}</span>
                  <span>{isTemplate ? '$__________' : `$${(quote.montoNeto || 0).toLocaleString(locale)}`}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <span>{quote.taxName || t('tax')} ({quote.taxPercent ?? 19}%)</span>
                  <span>{isTemplate ? '$__________' : `$${(quote.montoIva || 0).toLocaleString(locale)}`}</span>
                </div>
                {(isTemplate || quote.extraFeeAmount > 0) && (
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                    <span>{quote.extraFeeName || t('fee')}</span>
                    <span>{isTemplate ? '$__________' : `$${(quote.extraFeeAmount || 0).toLocaleString(locale)}`}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 self-center">{t('total')}</span>
                  <span>{isTemplate ? '$__________' : `$${(quote.montoTotal || 0).toLocaleString(locale)}`}</span>
                </div>
                {(isTemplate || quote.paymentMethod) && (
                  <div className="pt-4 mt-4 border-t border-slate-50 text-right">
                    <div className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">{t('paymentMethod')}</div>
                    <div className="text-[10px] font-bold text-slate-800">{isTemplate ? '_____________________' : quote.paymentMethod}</div>
                  </div>
                )}
              </div>

              {/* Notes & Conditions */}
              {(isTemplate || quote.notasCondiciones) && (
                <div className="space-y-3 mt-8">
                  <div className="flex items-center">
                    <h3 className="text-slate-900 uppercase text-[11px] font-black tracking-[0.3em] mr-4 whitespace-nowrap">{t('conditions')}</h3>
                    <div className="h-[1px] bg-slate-100 w-full"></div>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">
                    {isTemplate ? (
                      <div className="space-y-2">
                        <div className="border-b border-dashed border-slate-300 h-4 w-full"></div>
                        <div className="border-b border-dashed border-slate-300 h-4 w-full"></div>
                        <div className="border-b border-dashed border-slate-300 h-4 w-3/4"></div>
                      </div>
                    ) : (
                      quote.notasCondiciones
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>

            <footer className="absolute bottom-0 left-0 w-full p-6 text-slate-300 text-center shrink-0" style={{ background: '#0B1026' }}>
              <div className="text-[12px] font-black uppercase tracking-[0.6em] text-white">{companyProfile?.brandNameFooter || 'EDUARDO MARVAL'}</div>
              <div className="h-px w-8 bg-primary mx-auto my-3 opacity-30"></div>
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

          .propuesta-content h1, .propuesta-content h2, .propuesta-content h3 {
            color: #0f172a;
            font-weight: 900;
            letter-spacing: -0.025em;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            border-left: 4px solid #da291c;
            padding-left: 1rem;
          }
          .propuesta-content h1 { font-size: 1.5rem; }
          .propuesta-content h2 { font-size: 1.25rem; }
          .propuesta-content h3 { font-size: 1.1rem; }
          .propuesta-content, .propuesta-content * {
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            max-width: 100%;
          }
          .propuesta-content p { margin-bottom: 1em; }
          .propuesta-content ul, .propuesta-content ol {
            margin-bottom: 1em;
            padding-left: 1.5rem;
          }
          .propuesta-content ul { list-style-type: disc; }
          .propuesta-content ol { list-style-type: decimal; }
          .propuesta-content li { margin-bottom: 0.5em; }
          .propuesta-content strong { color: #181818; font-weight: 900; }
          
          /* Table Styles */
          .propuesta-content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5em;
            font-size: 0.9em;
          }
          .propuesta-content th, .propuesta-content td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            vertical-align: top;
          }
          .propuesta-content th {
            font-weight: 900;
            background-color: #f8fafc;
            color: #0f172a;
            text-transform: uppercase;
          }
          .propuesta-content td * {
            margin-bottom: 0 !important;
          }

          .forced-page-break {
            display: none;
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
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              min-height: 297mm !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              page-break-after: always;
            }
          }
        `}} />
      </div>
    </>
  );
};

export default QuotePDF;
