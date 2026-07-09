'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSow, updateSow } from '@/app/actions/sows';
import { useTranslations, useLocale } from 'next-intl';
import SowPDF from './SowPDF';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new').then(mod => {
  const { default: RQ, Quill } = mod;
  if (Quill) {
    const BlockEmbed = Quill.import('blots/block/embed') as {
      // Quill's registry defines blot constructors with a variadic `any[]`.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (...args: any[]): object;
      create(value?: unknown): HTMLElement;
      scope: number;
    };
    class HrBlot extends BlockEmbed {
      static blotName = 'divider';
      static tagName = 'hr';

      static create() {
        const node = super.create();
        node.setAttribute('class', 'forced-page-break');
        return node;
      }
    }
    // Prevent registering multiple times in fast-refresh
    try {
      Quill.register('formats/divider', HrBlot);
    } catch (e) {}
  }
  const ReactQuillWithRef = React.forwardRef<
    InstanceType<typeof RQ>,
    React.ComponentProps<typeof RQ>
  >((props, ref) => <RQ {...props} ref={ref} />);
  ReactQuillWithRef.displayName = 'ReactQuillWithRef';

  return ReactQuillWithRef;
}), { ssr: false });

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean']
  ],
};

const EDITOR_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;700;900&display=swap');

  .ql-container.ql-snow {
    border: none !important;
    font-family: 'Outfit', 'Inter', sans-serif;
    font-size: 15px;
    height: auto !important;
    overflow: visible !important;
  }
  .ql-toolbar.ql-snow {
    border: none !important;
    border-bottom: 1px solid #f1f5f9 !important;
    background: #f8fafc;
    padding: 8px 24px !important;
    font-family: 'Outfit', 'Inter', sans-serif;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .ql-toolbar.ql-snow .ql-formats {
    margin-right: 8px !important;
  }
  .ql-toolbar.ql-snow .ql-picker-label,
  .ql-toolbar.ql-snow button {
    font-family: 'Outfit', 'Inter', sans-serif !important;
  }

  .ql-editor, .ql-editor * {
    color: #f8fafc !important;
  }
  .ql-editor {
    padding: 24px !important;
    min-height: 300px;
    line-height: 1.6;
    font-family: 'Outfit', 'Inter', sans-serif;
    font-size: 15px;
    height: auto !important;
    overflow: visible !important;
  }
  @media (min-width: 768px) {
    .ql-editor {
      padding: 40px !important;
      min-height: 400px;
    }
  }
  .ql-editor.ql-blank::before {
    left: 40px !important;
    font-style: italic;
    color: #64748b !important; /* Lighter placeholder */
    font-family: 'Outfit', 'Inter', sans-serif;
  }

  /* === Match .propuesta-content styles from SowPDF === */
  .ql-editor h1, .ql-editor h2, .ql-editor h3,
  .ql-editor h1 *, .ql-editor h2 *, .ql-editor h3 * {
    color: #ffffff !important; /* White headings */
    font-weight: 900;
  }
  .ql-editor h1, .ql-editor h2, .ql-editor h3 {
    letter-spacing: -0.025em;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    border-left: 4px solid #da291c;
    padding-left: 1rem;
  }
  .ql-editor h1 { font-size: 1.5rem; line-height: 1.3; }
  .ql-editor h2 { font-size: 1.25rem; line-height: 1.35; }
  .ql-editor h3 { font-size: 1.1rem; line-height: 1.4; }
  .ql-editor p { margin-bottom: 1em; }
  .ql-editor ul, .ql-editor ol {
    margin-bottom: 1em;
    padding-left: 1.5rem;
  }
  .ql-editor ul { list-style-type: disc; }
  .ql-editor ol { list-style-type: decimal; }
  .ql-editor li { margin-bottom: 0.5em; }
  .ql-editor strong, .ql-editor b,
  .ql-editor strong *, .ql-editor b * {
    color: #ffffff !important; /* White bold text */
    font-weight: 900;
  }

  /* Table Styles — match SowPDF exactly */
  .ql-editor table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5em;
    font-size: 0.9em;
    color: #f8fafc !important;
  }
  .ql-editor th, .ql-editor td {
    border: 1px solid #475569; /* Darker border for tables */
    padding: 8px 12px;
    vertical-align: top;
  }
  .ql-editor th {
    font-weight: 900;
    background-color: #1e293b !important; /* Dark background for table headers */
    color: #ffffff !important; /* White text for table headers */
    text-transform: uppercase;
  }
  .ql-editor td * {
    margin-bottom: 0 !important;
    color: #f8fafc !important;
  }

  /* Page Break styling inside Quill editor */
  .ql-editor hr.forced-page-break,
  .ql-editor hr {
    display: block !important;
    border: none !important;
    border-top: 2px dashed #d1d5db !important;
    margin: 32px 0 !important;
    height: auto !important;
    position: relative !important;
    page-break-after: always;
    clear: both;
  }
  .ql-editor hr.forced-page-break::after,
  .ql-editor hr::after {
    content: "⏎ --- Salto de Página / Page Break ---";
    display: block;
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #9ca3af;
    text-transform: uppercase;
    padding-top: 6px;
  }
  .ql-editor hr.forced-page-break:hover,
  .ql-editor hr:hover {
    border-top-color: #f59e0b !important;
  }
  .ql-editor hr.forced-page-break:hover::after,
  .ql-editor hr:hover::after {
    color: #f59e0b;
  }
`;

interface Client {
  id: string;
  razonSocial: string;
  rut: string;
  giro?: string;
  direccion?: string;
}

interface SowFormProps {
  clients: Client[];
  companyProfile?: any;
  initialData?: {
    id: string;
    correlativo: number;
    clientId: string;
    fechaValidez: Date;
    propuesta: string | null;
    notasCondiciones: string | null;
    estado: string;
    taxName: string;
    taxPercent: number;
    extraFeeName: string | null;
    extraFeeAmount: number;
    paymentMethod: string | null;
    totalLabel: string | null;
    isAnnex: boolean;
    items: { descripcion: string; cantidad: number; precioUnitario: number }[];
    client: Client;
  };
}

export default function SowForm({ clients, companyProfile, initialData }: SowFormProps) {
  const t = useTranslations('SowForm');
  const tCommon = useTranslations('Dashboard.recentSows');
  const locale = useLocale();
  const router = useRouter();
  const isEditing = !!initialData;
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [fechaValidez, setFechaValidez] = useState(
    initialData?.fechaValidez 
      ? new Date(initialData.fechaValidez).toISOString().split('T')[0] 
      : ''
  );
  
  const [isAnnex, setIsAnnex] = useState(initialData?.isAnnex || false);
  
  // Custom Taxes & Fees State
  const [taxName, setTaxName] = useState(initialData?.taxName || 'IVA');
  const [taxPercent, setTaxPercent] = useState(initialData?.taxPercent?.toString() || '19');
  const [extraFeeName, setExtraFeeName] = useState(initialData?.extraFeeName || '');
  const [extraFeeAmount, setExtraFeeAmount] = useState(initialData?.extraFeeAmount?.toString() || '0');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [totalLabel, setTotalLabel] = useState(initialData?.totalLabel || '');

  // Proposal content — single editor with visible page breaks
  const [propuesta, setPropuesta] = useState<string>(() => {
    if (initialData?.propuesta) {
      // Convert legacy ---PAGE_BREAK--- markers to visible <hr> in the editor
      const content = initialData.propuesta
        .replace(/---PAGE_BREAK---/g, '<hr class="forced-page-break" />');
      return content;
    }
    return t.raw('defaultProposal.page1');
  });

  const [notasCondiciones, setNotasCondiciones] = useState(initialData?.notasCondiciones || t('defaultNotes'));
  const [signatureUrl, setSignatureUrl] = useState<string>((initialData as any)?.signatureUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [livePreviewPropuesta, setLivePreviewPropuesta] = useState(propuesta);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Debounced live preview — always running, updates 200ms after the user stops typing
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setLivePreviewPropuesta(propuesta);
    }, 200);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [propuesta]);

  // ResizeObserver to scale the PDF preview to fit its container perfectly
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // 210mm is ~794px. We add 32px of padding
        const targetWidth = 794; 
        const padding = 32;
        const availableWidth = width - padding;
        if (availableWidth < targetWidth) {
          setPreviewScale(availableWidth / targetWidth);
        } else {
          setPreviewScale(1);
        }
      }
    });
    observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, [showPreview, showMobilePreview]);

  // Insert a page break at cursor position in the Quill editor
  const insertPageBreak = useCallback(() => {
    // Get the Quill instance safely from the React ref
    const quill = quillRef.current?.getEditor();
    
    if (quill && typeof quill.getSelection === 'function') {
      // Focus first in case the user clicked the button (which removes focus)
      quill.focus();
      const selection = quill.getSelection();
      const index = selection ? selection.index : quill.getLength();
      // Use insertEmbed instead of dangerouslyPasteHTML for custom blot
      quill.insertEmbed(index, 'divider', true, 'user');
      // Add a small delay to ensure rendering before moving selection
      setTimeout(() => {
        quill.setSelection(index + 1, 0, 'silent');
      }, 10);
    } else {
      // Fallback: append at end
      setPropuesta(prev => prev + '<hr class="forced-page-break" />');
    }
  }, []);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to insert a page break
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlEnter = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
      if (!isCtrlEnter) return;

      // Only trigger when the Quill editor is focused
      const activeEl = document.activeElement;
      const isQuillFocused = activeEl?.closest('.ql-editor');
      if (!isQuillFocused) return;

      e.preventDefault();
      e.stopPropagation();
      insertPageBreak();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [insertPageBreak]);

  // Calculate page info from content
  const getPageInfo = useCallback(() => {
    const content = propuesta || '';
    // Count explicit page breaks
    const explicitBreaks = (content.match(/<hr[^>]*class="[^"]*forced-page-break[^"]*"[^>]*\/?>/gi) || []).length;
    
    // Estimate additional pages based on content volume (rough heuristic)
    // Remove HTML tags to get text length
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const textLength = textContent.length;
    
    // Each page can hold roughly 2500-3000 chars of text content (estimated)
    const charsPerPage = 2800;
    const autoPages = Math.max(1, Math.ceil(textLength / charsPerPage));
    
    // Total estimated pages: explicit sections vs auto-pages, whichever is larger
    const estimatedPages = Math.max(explicitBreaks + 1, autoPages);
    
    return {
      explicitBreaks,
      autoPages,
      estimatedPages,
      textLength,
    };
  }, [propuesta]);

  const pageInfo = getPageInfo();

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setSignatureUrl(data.url);
      } else {
        console.error('Upload failed');
        alert('Error uploading signature');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading signature');
    }
  };

  const handleSubmit = async (estado: 'Borrador' | 'Enviada' = 'Enviada') => {
    if (!clientId) return alert(t('errors.selectClient'));
    
    setIsSubmitting(true);
    try {
      const payload = {
        clientId,
        fechaValidez,
        notasCondiciones,
        propuesta,
        estado,
        taxName,
        taxPercent,
        extraFeeName: extraFeeName || null,
        extraFeeAmount,
        paymentMethod: paymentMethod || null,
        totalLabel: totalLabel || null,
        signatureUrl,
        isAnnex,
        items: []
      };

      if (isEditing) {
        await updateSow(initialData!.id, payload);
      } else {
        await createSow(payload);
      }
      
      router.push('/dashboard/sows');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(t('errors.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  const mockSow = {
    correlativo: 0,
    fechaEmision: new Date(),
    fechaValidez: fechaValidez ? new Date(fechaValidez) : null,
    montoNeto: 0,
    montoIva: 0,
    montoTotal: 0,
    taxName: '',
    taxPercent: 0,
    extraFeeName: '',
    extraFeeAmount: 0,
    paymentMethod: '',
    totalLabel: '',
    isAnnex,
    notasCondiciones,
    propuesta,
    signatureUrl,
    client: selectedClient || { razonSocial: 'CLIENTE NO SELECCIONADO', rut: '---' },
    items: []
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex flex-col items-center">
        <div className="w-full max-w-5xl h-full flex flex-col p-md">
          <div className="bg-canvas p-sm border-b border-hairline flex justify-between items-center shrink-0">
            <div className="flex items-center">
              <span className="material-icons text-ink mr-xs">description</span>
              <h3 className="font-medium text-ink uppercase tracking-wider text-sm md:text-base">{t('preview')}</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowPreview(false)}
              className="px-sm h-[40px] bg-transparent border border-hairline text-muted hover:text-ink hover:border-ink transition-colors flex items-center"
            >
              <span className="material-icons text-sm mr-xxs">close</span> {t('close')}
            </button>
          </div>
          <div className="flex-grow bg-canvas overflow-auto p-sm md:p-lg border-x border-b border-hairline">
            <div className="w-full max-w-[210mm] mx-auto flex flex-col items-center gap-md">
              <SowPDF sow={mockSow} companyProfile={companyProfile} />
            </div>
            <div className="h-24" /> 
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-md max-w-5xl pb-xl mx-auto font-sans">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLE }} />
      {/* 1. Header Information */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
          <span className="material-icons mr-xxs text-primary">business</span> {t('title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('clientLabel')}</label>
            <div className="relative">
              <select 
                className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">{t('clientPlaceholder')}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.razonSocial} ({c.rut})</option>
                ))}
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('validityLabel')}</label>
            <input 
              type="date" 
              className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
              value={fechaValidez}
              onChange={(e) => setFechaValidez(e.target.value)}
              required
            />
          </div>
        </div>
        
        {/* Is Annex Checkbox */}
        <div className="pt-sm border-t border-hairline mt-sm">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5 border border-hairline bg-canvas group-hover:border-primary transition-colors">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isAnnex}
                onChange={(e) => setIsAnnex(e.target.checked)}
              />
              <span className="material-icons text-[16px] text-primary opacity-0 peer-checked:opacity-100 transition-opacity absolute">
                check
              </span>
            </div>
            <span className="text-sm text-ink group-hover:text-primary transition-colors font-medium">
              Marcar como Anexo Técnico (Elimina el # de documento y cambia el título a TECHNICAL ANNEX)
            </span>
          </label>
        </div>
      </div>

      {/* 2. Proposal Editor — Split View: Editor + Live Preview */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
            <span className="material-icons mr-xxs text-primary">edit_note</span> {t('proposalTitle')}
          </h2>
          <div className="flex items-center gap-xs">
            {/* Page counter badge */}
            <div className="flex items-center gap-1 px-xs py-xxs bg-canvas border border-hairline text-muted text-xs font-semibold uppercase tracking-wider">
              <span className="material-icons text-sm">description</span>
              <span>{pageInfo.estimatedPages} ~págs</span>
              {pageInfo.explicitBreaks > 0 && (
                <span className="text-muted/60 ml-1">
                  · {pageInfo.explicitBreaks} saltos
                </span>
              )}
              {pageInfo.textLength > 0 && (
                <span className="text-muted/60 ml-1">
                  · {pageInfo.textLength} car.
                </span>
              )}
            </div>
            {/* Mobile toggle for preview */}
            <button
              type="button"
              onClick={() => setShowMobilePreview(prev => !prev)}
              className="lg:hidden flex items-center gap-1 px-xs py-xxs text-xs font-semibold uppercase tracking-wider transition-colors border text-muted hover:text-ink border-transparent hover:border-hairline"
              title="Alternar vista previa"
            >
              <span className="material-icons text-sm">visibility</span>
              {showMobilePreview ? 'Ocultar' : 'Preview'}
            </button>
          </div>
        </div>
        <p className="text-body text-muted text-sm">
          Escribe tu propuesta. La vista previa en vivo se actualiza automáticamente para mostrar cómo se paginará el contenido.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-sm lg:h-[calc(100vh-250px)] lg:min-h-[600px]">
          {/* Left Column: Editor */}
          <div className="border border-hairline overflow-hidden flex flex-col min-h-[400px] lg:min-h-0 h-full">
            {/* Toolbar extension for page break */}
            <div className="flex items-center justify-between px-sm py-xxs bg-canvas border-b border-hairline/50 shrink-0">
              <button
                type="button"
                onClick={insertPageBreak}
                className="flex items-center gap-1 px-xs py-xxs text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink hover:bg-hairline/30 transition-colors border border-transparent hover:border-hairline"
                title="Insertar salto de página (Ctrl+Enter)"
              >
                <span className="material-icons text-sm">horizontal_rule</span>
                <span className="hidden sm:inline">Salto de Página</span>
                <span className="sm:hidden">Salto</span>
                <kbd className="ml-1 px-1 py-[1px] text-[9px] font-bold bg-hairline/50 border border-hairline rounded-[2px] text-muted hidden md:inline">Ctrl+Enter</kbd>
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink transition-colors flex items-center gap-1"
                title="Vista previa en pantalla completa"
              >
                <span className="material-icons text-sm">fullscreen</span>
                <span className="hidden sm:inline">Pantalla Completa</span>
              </button>
            </div>

            <div className="bg-canvas flex-1 overflow-auto">
              <ReactQuill 
                ref={quillRef}
                theme="snow"
                value={propuesta}
                onChange={setPropuesta}
                modules={QUILL_MODULES}
                className="h-full border-none"
                placeholder="Escribe la propuesta completa..."
              />
            </div>
          </div>

          {/* Right Column: Live Preview — always visible on desktop, toggleable on mobile */}
          <div className={`border border-hairline bg-canvas overflow-hidden flex flex-col min-h-[400px] lg:min-h-0 h-full ${
            showMobilePreview ? 'block' : 'hidden lg:flex'
          }`}>
            <div className="flex items-center justify-between px-sm py-xxs bg-canvas border-b border-hairline/50 shrink-0">
              <div className="flex items-center gap-2 text-caption-uppercase text-muted font-semibold text-xs">
                <span className="material-icons text-sm">visibility</span>
                Vista Previa en Vivo
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted/50">
                  {propuesta === livePreviewPropuesta ? '✓' : '⏳'}
                </span>
              </div>
            </div>
            <div ref={previewContainerRef} className="overflow-x-hidden overflow-y-auto flex-1 p-sm md:p-md bg-ink/5">
              <div 
                className="w-full flex flex-col items-center"
                style={{ 
                  height: previewScale < 1 ? `calc(100% * ${previewScale})` : 'auto' 
                }}
              >
                <div 
                  className="w-[210mm] max-w-none flex flex-col items-center gap-md"
                  style={{ 
                    transform: `scale(${previewScale})`, 
                    transformOrigin: 'top center',
                  }}
                >
                  <SowPDF 
                    sow={{
                      ...mockSow,
                      propuesta: livePreviewPropuesta,
                    }} 
                    companyProfile={companyProfile} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Signature Upload */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
          <span className="material-icons mr-xxs text-primary">draw</span> Firma del Cliente
        </h2>
        <div className="flex flex-col gap-sm">
          {signatureUrl ? (
            <div className="relative w-full max-w-[300px] bg-canvas border border-hairline p-sm rounded-sm">
              <img src={signatureUrl} alt="Signature" className="max-h-[100px] object-contain mx-auto" />
              <button 
                type="button" 
                onClick={() => setSignatureUrl('')}
                className="absolute top-1 right-1 text-muted hover:text-semantic-warning"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          ) : (
            <div className="w-full max-w-[300px]">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-hairline border-dashed hover:bg-canvas cursor-pointer rounded-sm transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted hover:text-primary transition-colors">
                  <span className="material-icons mb-2">cloud_upload</span>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-center">Subir Firma</p>
                  <p className="text-xs opacity-70">PNG, JPG</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 4. Notes & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <label className="text-caption-uppercase text-ink font-semibold flex items-center">
            <span className="material-icons text-sm mr-xxs text-primary">gavel</span> {t('notesTitle')}
          </label>
          <textarea 
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm min-h-[150px]"
            value={notasCondiciones}
            onChange={(e) => setNotasCondiciones(e.target.value)}
          />
        </div>
        <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <label className="text-caption-uppercase text-ink font-semibold flex items-center">
            <span className="material-icons text-sm mr-xxs text-primary">account_balance_wallet</span> {t('paymentMethodLabel')}
          </label>
          <input 
            type="text" 
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder={t('paymentMethodPlaceholder')}
          />
          <p className="text-caption text-muted mt-xxs">
            Especifica cómo deseas recibir el pago (Transferencia, PayPal, etc.)
          </p>
        </div>
      </div>

      {/* 5. Sticky Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-xs bg-canvas-elevated p-sm border-t border-hairline sticky bottom-0 z-30">
        <div className="flex items-center justify-between sm:justify-start gap-xxs w-full sm:w-auto">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="text-muted font-semibold hover:text-ink transition-colors text-xs uppercase tracking-wider flex items-center"
          >
            <span className="material-icons text-sm mr-xxs">arrow_back</span>
            Volver
          </button>
          <div className="h-xs w-px bg-hairline" />
          <button 
            type="button" 
            onClick={() => setShowPreview(true)}
            className="text-ink font-semibold hover:text-ink/70 transition-all flex items-center text-xs uppercase tracking-wider"
          >
            <span className="material-icons mr-xxs text-sm">visibility</span>
            {t('preview')}
          </button>
        </div>
        
        <div className="flex gap-xxs w-full sm:w-auto justify-end">
          <button 
            type="button" 
            onClick={() => handleSubmit('Borrador')}
            disabled={isSubmitting}
            className="bg-transparent border border-hairline text-ink px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-canvas transition-colors disabled:opacity-50"
          >
            {t('saveDraft')}
          </button>
          <button 
            type="button" 
            onClick={() => handleSubmit('Enviada')}
            disabled={isSubmitting}
            className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="material-icons animate-spin mr-xxs text-sm">sync</span>
            ) : (
              <span className="material-icons mr-xxs text-sm">send</span>
            )}
            {isSubmitting ? t('saving') : isEditing ? t('update') : t('generate')}
          </button>
        </div>
      </div>
    </form>
  );
}
