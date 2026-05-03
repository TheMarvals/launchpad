import React from 'react';

interface QuotePDFProps {
  quote: any;
}

const QuotePDF: React.FC<QuotePDFProps> = ({ quote }) => {
  // Split proposal into pages
  const proposalPages = (quote.propuesta || '').split('---PAGE_BREAK---');

  return (
    <div className="pdf-wrapper w-full max-w-[210mm] print:max-w-full mx-auto print:mx-0 space-y-8 print:space-y-0">
      {/* Proposal Pages */}
      {proposalPages.map((pageContent: string, pageIdx: number) => (
        <div key={pageIdx} className="pdf-page w-full min-h-[297mm] bg-white text-slate-800 font-sans relative flex flex-col shadow-2xl print:shadow-none print:break-after-page overflow-hidden">
          {/* Header - First Page vs Subsequent Pages */}
          {pageIdx === 0 ? (
            <header className="relative w-full p-10 pb-12 text-white shrink-0 overflow-hidden" style={{ background: '#050212' }}>
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent skew-x-[-15deg] translate-x-20" />
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
              <div className="relative z-10 flex justify-between items-center">
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <h1 className="hero-heading text-[60px] font-black mb-0 stroke-text leading-[0.8] tracking-[-0.05em]">MARVAL</h1>
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent" />
                  </div>
                  <div className="flex flex-col space-y-1.5 pt-4">
                    <div className="flex items-center text-[8px] font-black tracking-[0.3em] text-blue-400 uppercase">
                      <span className="w-4 h-[1px] bg-blue-400 mr-3"></span> Arquitectura de Sistemas
                    </div>
                    <div className="flex items-center text-[9px] font-bold tracking-wider text-slate-400 uppercase pl-7">
                      Consultoría TI • Software Engineering
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="mb-6">
                    <h2 className="text-xl font-black tracking-tight uppercase leading-none text-white">Eduardo Marval</h2>
                    <div className="text-[9px] font-medium text-blue-400/80 uppercase tracking-widest mt-1">Lead Solution Architect</div>
                  </div>
                  <div className="space-y-1.5 border-r-2 border-blue-500/30 pr-4">
                    <div className="text-[9px] font-bold text-slate-300">RUT: 27.087.979-9</div>
                    <div className="text-[9px] font-bold text-slate-300">TELF: +569 994438833</div>
                    <div className="text-[9px] font-bold text-slate-300 lowercase">e.marval@themarvals.com</div>
                  </div>
                </div>
              </div>
            </header>
          ) : (
            <header className="relative w-full p-8 border-b border-slate-50 shrink-0 flex justify-between items-center bg-white">
              <div className="relative inline-block">
                <h1 className="text-3xl font-black mb-0 stroke-text leading-none tracking-tighter" style={{ WebkitTextStrokeColor: '#000000', WebkitTextStrokeWidth: '1.5px' }}>MARVAL</h1>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">{pageIdx + 1} / {proposalPages.length + 1}</div>
            </header>
          )}

          {/* Page Content */}
          <main className="flex-grow p-12 pb-32 relative">
            {/* Watermark - Giant and Very Subtle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] overflow-hidden">
              <h1 className="whitespace-nowrap font-black select-none tracking-tighter" style={{ fontSize: '800px', transform: 'rotate(-35deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#1e3a8a', WebkitTextStrokeWidth: '5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>MARVAL</h1>
            </div>

            <div className="relative z-10 space-y-10">
              {/* Metadata only on Page 1 */}
              {pageIdx === 0 && (
                <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                  <div className="max-w-[60%]">
                    <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-[0.2em] rounded-md mb-3">
                      Información del Cliente
                    </div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900 leading-tight mb-2">
                      {quote.client?.razonSocial || 'CLIENTE DE PRUEBA'}
                    </h3>
                    <div className="space-y-0.5 text-xs font-bold text-slate-400">
                      <div>RUT: {quote.client?.rut || '---'}</div>
                      <div className="font-medium italic opacity-80 text-[11px]">{quote.client?.giro || 'Servicios Informáticos'}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-4">
                    <div className="space-y-1">
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Documento</div>
                      <div className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Cotización <span className="text-blue-600">#{String(quote.correlativo || 0).padStart(4, '0')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                      <div className="text-[9px] font-black text-slate-300 uppercase">Emisión</div>
                      <div className="text-xs font-black text-slate-800">{new Date(quote.fechaEmision || Date.now()).toLocaleDateString('es-CL')}</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase">Validez</div>
                      <div className="text-xs font-black text-blue-600">{quote.fechaValidez ? new Date(quote.fechaValidez).toLocaleDateString('es-CL') : 'Por definir'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Proposals for this specific page */}
              <div className="propuesta-content text-slate-600 leading-relaxed text-justify whitespace-pre-wrap font-sans text-[15px] space-y-4">
                {pageContent.split('\n').map((line: string, i: number) => {
                  const isHeader = /^[0-9]+\.\s+/.test(line.trim()) || /^[A-ZÁÉÍÓÚÑ\s]{5,}:$/.test(line.trim());
                  if (isHeader) {
                    return <h3 key={i} className="text-slate-900 font-black text-xl uppercase tracking-tight mt-8 mb-4 border-l-4 border-blue-600 pl-4">{line}</h3>;
                  }
                  return <p key={i} className="pl-5">{line}</p>;
                })}
              </div>
            </div>
          </main>

          {/* Footer - Positioned at the exact bottom of every page */}
          <footer className="absolute bottom-0 left-0 w-full p-6 text-slate-300 text-center shrink-0" style={{ background: '#050212' }}>
            <div className="text-[12px] font-black uppercase tracking-[0.6em] text-white">EDUARDO MARVAL</div>
            <div className="h-px w-8 bg-blue-500 mx-auto my-3 opacity-30"></div>
            <div className="text-[8px] font-bold opacity-40 space-x-6 uppercase tracking-widest">
              <span>ANTONIO BELLET 193 OF 1210 12P, PROVIDENCIA, RM</span>
              <span>•</span>
              <span>e.marval@themarvals.com</span>
            </div>
          </footer>
        </div>
      ))}

      {/* FINAL PAGE: Economic data and conditions */}
      <div className="pdf-page w-full min-h-[297mm] bg-white text-slate-800 font-sans relative flex flex-col shadow-2xl print:shadow-none print:break-after-page overflow-hidden">
        <header className="relative w-full p-8 border-b border-slate-50 shrink-0 flex justify-between items-center bg-white">
          <div className="relative inline-block">
            <h1 className="text-3xl font-black mb-0 stroke-text leading-none tracking-tighter" style={{ WebkitTextStrokeColor: '#000000', WebkitTextStrokeWidth: '1.5px' }}>MARVAL</h1>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />
          </div>
          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">{proposalPages.length + 1} / {proposalPages.length + 1}</div>
        </header>

        <main className="flex-grow p-12 pb-32 relative">
          {/* Watermark - Giant and Very Subtle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] overflow-hidden">
            <h1 className="whitespace-nowrap font-black select-none tracking-tighter" style={{ fontSize: '800px', transform: 'rotate(-35deg)', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#1e3a8a', WebkitTextStrokeWidth: '5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>MARVAL</h1>
          </div>

          <div className="relative z-10 space-y-12">
            {/* Table */}
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-slate-900 uppercase text-[11px] font-black tracking-[0.3em] mr-4 whitespace-nowrap">Detalle de Inversión</h3>
                <div className="h-[1px] bg-slate-100 w-full"></div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-[10px] uppercase text-slate-500 tracking-widest font-black border-b border-slate-100">
                      <th className="p-4">Descripción</th>
                      <th className="p-4 text-right w-20">Cant.</th>
                      <th className="p-4 text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(quote.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="text-[13px]">
                        <td className="p-4 font-bold text-slate-800">{item.descripcion}</td>
                        <td className="p-4 text-right font-bold text-slate-300">{item.cantidad}</td>
                        <td className="p-4 text-right font-black text-slate-900">${(item.subtotal || 0).toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals & Conditions */}
            <div className="grid grid-cols-2 gap-8 items-start">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3">Condiciones</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {quote.notasCondiciones}
                </p>
              </div>
              <div className="space-y-2 p-4 w-64 ml-auto">
                <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <span>Neto</span>
                  <span>${(quote.montoNeto || 0).toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <span>IVA (19%)</span>
                  <span>${(quote.montoIva || 0).toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 self-center">Total</span>
                  <span>${(quote.montoTotal || 0).toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="absolute bottom-0 left-0 w-full p-6 text-slate-300 text-center shrink-0" style={{ background: '#050212', boxShadow: '0 0 0 10px #050212' }}>
          <div className="text-[12px] font-black uppercase tracking-[0.6em] text-white">MARVAL</div>
          <div className="h-px w-8 bg-blue-500 mx-auto my-3 opacity-30"></div>
          <div className="text-[8px] font-bold opacity-40 space-x-6 uppercase tracking-widest">
            <span>ANTONIO BELLET 193 OF 1210 12P, PROVIDENCIA, RM</span>
            <span>•</span>
            <span>e.marval@themarvals.com</span>
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

export default QuotePDF;
