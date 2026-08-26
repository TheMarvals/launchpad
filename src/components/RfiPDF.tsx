'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import mermaid from 'mermaid';

interface RfiPDFProps {
  rfi: any;
  isTemplate?: boolean;
  companyProfile?: any;
}

// Available content height in mm for each page type
// Page = 297mm. We subtract header, footer, and padding.
const FIRST_PAGE_CONTENT_MM = 190;  // 297 - bigHeader(~55) - footer(~22) - clientInfo(~25) - margins(~20)
const OTHER_PAGE_CONTENT_MM = 250;  // 297 - smallHeader(~15) - footer(~22) - margins(~10)

const RfiPDF: React.FC<RfiPDFProps> = ({ rfi, isTemplate, companyProfile }) => {
  const t = useTranslations('PDF');
  const locale = useLocale();
  const measureRef = useRef<HTMLDivElement>(null);
  const [computedPages, setComputedPages] = useState<string[]>([]);

  const senderName = rfi?.user?.name || companyProfile?.user?.name || companyProfile?.name || 'Eduardo Marval';
  const senderRole = rfi?.user?.cargo || companyProfile?.user?.cargo || companyProfile?.role || 'Lead Solution Architect';
  const senderPhone = rfi?.user?.telefono || companyProfile?.user?.telefono || companyProfile?.phone || '+569 94438833';
  const senderEmail = rfi?.user?.email || companyProfile?.email || 'e.marval@themarvals.com';

  const processPropuesta = (html: string) => {
    let processed = html.replace(/```mermaid([\s\S]*?)```/g, (match, p1) => {
      let cleanContent = p1.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
      cleanContent = cleanContent.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
      return `<div class="mermaid">${cleanContent.trim()}</div>`;
    });
    processed = processed.replace(/&nbsp;/g, ' ');
    processed = processed.replace(/---PAGE_BREAK---/g, '<hr class="forced-page-break" />');
    return processed;
  };

  const rawContent = isTemplate
    ? `
      <h1>SOLICITUD DE INFORMACIÓN (RFI)</h1>
      <p>Este documento formal tiene como propósito recopilar antecedentes técnicos, requerimientos de negocio, restricciones de arquitectura y criterios de evaluación para el diseño y dimensionamiento del proyecto.</p>
      
      <h2>1. OBJETIVO Y ANTECEDENTES</h2>
      <p>Detalle del contexto operativo y los objetivos que motivan el requerimiento de información.</p>
      <div style="height: 120px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [ÁREA DE ANTECEDENTES Y CONTEXTO / BACKGROUND CONTEXT BOX]
      </div>

      <h2>2. ALCANCE Y PREGUNTAS TÉCNICAS</h2>
      <p>Preguntas clave sobre infraestructura actual, integraciones, volúmenes de datos y estándares de seguridad.</p>
      <div style="height: 140px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [CUESTIONARIO TÉCNICO / TECHNICAL QUESTIONS BOX]
      </div>

      <hr class="forced-page-break" />

      <h2>3. REQUERIMIENTOS DE RESPUESTA</h2>
      <p>Estructura de entrega de la información requerida, formatos admitidos y responsables de contacto.</p>
      <div style="height: 140px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [CRITERIOS Y FORMATO DE RESPUESTA / RESPONSE FORMAT BOX]
      </div>

      <h2>4. CRONOGRAMA Y FECHAS CLAVE</h2>
      <p>Hitos del proceso de evaluación y fecha límite para la recepción de antecedentes.</p>
      <div style="height: 100px; border: 1.5px dashed #cbd5e1; border-radius: 8px; margin: 15px 0; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: bold;">
        [CALENDARIO DE REVISIÓN / TIMELINE BOX]
      </div>
    `
    : processPropuesta(rfi.propuesta || '');

  const paginateContent = useCallback(async () => {
    const container = measureRef.current;
    if (!container || !rawContent) {
      setComputedPages([rawContent || '']);
      return;
    }

    // Inject content into hidden measurement container
    container.innerHTML = rawContent;

    // Render Mermaid diagrams before measuring
    try {
      const mermaidNodes = container.querySelectorAll('.mermaid');
      if (mermaidNodes.length > 0) {
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        await mermaid.run({ nodes: Array.from(mermaidNodes) as HTMLElement[] });
      }
    } catch (e) {
      console.error('Mermaid render error', e);
    }

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
      if (
        child.classList.contains('forced-page-break') || 
        child.tagName.toUpperCase() === 'HR' || 
        child.querySelector('hr')
      ) {
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
    const timer = setTimeout(paginateContent, 100);
    return () => clearTimeout(timer);
  }, [paginateContent]);

  const totalPages = computedPages.length;

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
        @media screen and (max-width: 767px) {
          .pdf-wrapper {
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: none !important;
          }
        }
      `}} />

      <div className="pdf-wrapper max-w-[210mm] print:max-w-full mx-auto print:mx-0 notranslate overflow-x-auto md:overflow-x-visible" translate="no">
        {/* RFI Pages (auto-paginated) */}
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
            <main className="flex-grow px-10 pt-10 pb-8 overflow-hidden">
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
                            {rfi.client?.razonSocial || 'CLIENTE DE PRUEBA'}
                          </h3>
                          <div className="space-y-0.5 text-xs font-bold text-slate-400">
                            <div>{companyProfile?.taxIdLabel || 'TAX ID'}: {rfi.client?.rut || '---'}</div>
                            <div className="font-medium italic opacity-80 text-[11px]">{rfi.client?.giro || 'Servicios Informáticos'}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right space-y-4">
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t('document')}</div>
                        <div className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                          RFI <span className="text-primary">#{isTemplate ? 'XXXX' : String(rfi.correlativo || 0).padStart(4, '0')}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                        <div className="text-[9px] font-black text-slate-300 uppercase">{t('issue')}</div>
                        <div className="text-xs font-black text-slate-800">{isTemplate ? '__/__/____' : new Date(rfi.fechaEmision || Date.now()).toLocaleDateString(locale)}</div>
                        <div className="text-[9px] font-black text-slate-300 uppercase">{locale === 'es' ? 'FECHA LÍMITE' : 'DEADLINE'}</div>
                        <div className="text-xs font-black text-primary">{isTemplate ? '__/__/____' : (rfi.fechaValidez ? new Date(rfi.fechaValidez).toLocaleDateString(locale) : t('toDefine'))}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proposal / RFI content for this page */}
                <div
                  className="propuesta-content text-slate-600 leading-relaxed text-justify font-sans text-[15px] space-y-4"
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />
              </div>
            </main>

            {/* Footer */}
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
        ))}

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
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.02em;
          }

          .propuesta-content h1 {
            font-size: 20px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 6px;
            margin-top: 15px;
            margin-bottom: 12px;
          }

          .propuesta-content h2 {
            font-size: 14px;
            margin-top: 15px;
            margin-bottom: 8px;
            color: #1e293b;
          }

          .propuesta-content h3 {
            font-size: 12px;
            margin-top: 10px;
            margin-bottom: 4px;
            color: #334155;
          }

          .propuesta-content p {
            margin-bottom: 8px;
            line-height: 1.5;
          }

          .propuesta-content ul, .propuesta-content ol {
            margin-left: 20px;
            margin-bottom: 10px;
          }

          .propuesta-content li {
            margin-bottom: 3px;
            line-height: 1.4;
          }

          .propuesta-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 11px;
          }

          .propuesta-content th, .propuesta-content td {
            border: 1px solid #e2e8f0;
            padding: 6px 10px;
            text-align: left;
          }

          .propuesta-content th {
            background-color: #f8fafc;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.05em;
          }

          .forced-page-break {
            page-break-after: always;
            break-after: page;
            border: none;
            visibility: hidden;
            margin: 0;
            padding: 0;
            height: 0;
          }

          .mermaid {
            display: flex;
            justify-content: center;
            margin: 15px 0;
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
        `}} />
      </div>
    </>
  );
};

export default RfiPDF;
