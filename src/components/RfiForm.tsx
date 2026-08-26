'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { createRfi, updateRfi } from '@/app/actions/rfis';
import { useTranslations, useLocale } from 'next-intl';
import RfiPDF from './RfiPDF';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new').then(mod => {
  const { default: RQ, Quill } = mod;
  if (Quill) {
    const BlockEmbed = Quill.import('blots/block/embed') as {
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
    color: #94a3b8 !important;
    font-style: normal;
    left: 24px !important;
    right: 24px !important;
    font-family: 'Outfit', 'Inter', sans-serif;
  }
  @media (min-width: 768px) {
    .ql-editor.ql-blank::before {
      left: 40px !important;
      right: 40px !important;
    }
  }

  .ql-editor h1, .ql-editor h2, .ql-editor h3 {
    color: #ffffff !important;
    font-family: 'Outfit', 'Inter', sans-serif;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
  .ql-editor h1 {
    font-size: 24px;
    border-bottom: 2px solid #334155;
    padding-bottom: 8px;
    margin-top: 24px;
    margin-bottom: 16px;
  }
  .ql-editor h2 {
    font-size: 18px;
    margin-top: 20px;
    margin-bottom: 12px;
  }
  .ql-editor h3 {
    font-size: 15px;
    margin-top: 16px;
    margin-bottom: 8px;
  }
  .ql-editor p {
    margin-bottom: 12px;
    color: #cbd5e1 !important;
  }
  .ql-editor ul, .ql-editor ol {
    padding-left: 24px;
    margin-bottom: 12px;
  }
  .ql-editor li {
    margin-bottom: 4px;
    color: #cbd5e1 !important;
  }
  .ql-editor table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  .ql-editor th, .ql-editor td {
    border: 1px solid #334155;
    padding: 8px 12px;
    text-align: left;
    color: #f8fafc !important;
  }
  .ql-editor th {
    font-weight: 900;
    background-color: #1e293b !important;
    color: #ffffff !important;
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

interface RfiFormProps {
  clients: Client[];
  admins?: any[];
  companyProfile?: any;
  initialData?: any;
}

export default function RfiForm({ clients, admins = [], companyProfile, initialData }: RfiFormProps) {
  const t = useTranslations('Rfis');
  const tForm = useTranslations('QuoteForm');
  const locale = useLocale();
  const router = useRouter();
  const isEditing = !!initialData;

  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [userId, setUserId] = useState(initialData?.userId || '');
  const [fechaEmision, setFechaEmision] = useState(
    initialData?.fechaEmision 
      ? new Date(initialData.fechaEmision).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [fechaValidez, setFechaValidez] = useState(
    initialData?.fechaValidez 
      ? new Date(initialData.fechaValidez).toISOString().split('T')[0] 
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [estado, setEstado] = useState(initialData?.estado || 'Borrador');

  const defaultRfiContent = `
    <h1>SOLICITUD DE INFORMACIÓN (RFI)</h1>
    <p>El presente documento tiene como finalidad relevar información técnica y requerimientos para la definición de la arquitectura de la solución.</p>
    
    <h2>1. CONTEXTO Y OBJETIVO</h2>
    <p>Describir brevemente el contexto del proyecto y los objetivos esperados con la recolección de información.</p>

    <h2>2. PREGUNTAS TÉCNICAS Y ANTECEDENTES REQUERIDOS</h2>
    <ul>
      <li><strong>Infraestructura actual:</strong> Proveedor de nube, servidores, especificaciones de hardware y conectividad.</li>
      <li><strong>Bases de datos:</strong> Motor, volumen estimado de transacciones, políticas de respaldo y retención.</li>
      <li><strong>Seguridad y cumplimiento:</strong> Requerimientos de autenticación (SSO, OAuth, SAML), cifrado y normativas.</li>
      <li><strong>Integraciones:</strong> APIs externas, webhooks y sistemas legados a conectar.</li>
    </ul>

    <hr class="forced-page-break" />

    <h2>3. PLAZO Y FORMA DE ENTREGA</h2>
    <p>Favor responder a este requerimiento de información antes de la fecha límite estipulada. Las respuestas técnicas serán consolidadas para la fase de diseño.</p>
  `;

  const [propuesta, setPropuesta] = useState<string>(() => {
    if (initialData?.propuesta) {
      return initialData.propuesta.replace(/---PAGE_BREAK---/g, '<hr class="forced-page-break" />');
    }
    return defaultRfiContent;
  });

  const [notasCondiciones, setNotasCondiciones] = useState(
    initialData?.notasCondiciones || 'La información suministrada será tratada con estricta confidencialidad bajo los términos de acuerdo de no divulgación (NDA).'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Debounced proposal for live preview to reduce lag
  const [livePreviewPropuesta, setLivePreviewPropuesta] = useState(propuesta);
  useEffect(() => {
    const handler = setTimeout(() => {
      setLivePreviewPropuesta(propuesta);
    }, 400);
    return () => clearTimeout(handler);
  }, [propuesta]);

  // Quill ref for inserting page breaks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
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
    const quill = quillRef.current?.getEditor();
    if (quill && typeof quill.getSelection === 'function') {
      quill.focus();
      const selection = quill.getSelection();
      const index = selection ? selection.index : quill.getLength();
      quill.insertEmbed(index, 'divider', true, 'user');
      setTimeout(() => {
        quill.setSelection(index + 1, 0, 'silent');
      }, 10);
    } else {
      setPropuesta(prev => prev + '<hr class="forced-page-break" />');
    }
  }, []);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to insert a page break
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlEnter = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
      if (!isCtrlEnter) return;

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientId) return alert(tForm('errors.selectClient'));
    if (!fechaValidez) return alert(locale === 'es' ? 'Ingresa la fecha límite de respuesta' : 'Please enter deadline');

    setIsSubmitting(true);
    try {
      const payload = {
        clientId,
        userId: userId || null,
        fechaEmision,
        fechaValidez,
        estado,
        propuesta,
        notasCondiciones,
      };

      if (isEditing) {
        await updateRfi(initialData.id, payload);
      } else {
        await createRfi(payload);
      }

      router.push('/dashboard/rfis');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(locale === 'es' ? 'Error al guardar el RFI' : 'Error saving RFI');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  const mockRfi = {
    correlativo: initialData?.correlativo || 0,
    fechaEmision: new Date(fechaEmision),
    fechaValidez: new Date(fechaValidez),
    propuesta,
    notasCondiciones,
    estado,
    client: selectedClient || {
      razonSocial: 'CLIENTE NO SELECCIONADO',
      rut: '---',
      giro: 'Giro de la empresa',
      direccion: 'Dirección del cliente',
    },
    user: admins.find(a => a.id === userId) || null,
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex flex-col items-center">
        <div className="w-full max-w-5xl h-full flex flex-col p-md">
          <div className="bg-canvas p-sm border-b border-hairline flex justify-between items-center shrink-0">
            <div className="flex items-center">
              <span className="material-icons text-ink mr-xs">description</span>
              <h3 className="font-medium text-ink uppercase tracking-wider text-sm md:text-base">{tForm('preview')}</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowPreview(false)}
              className="px-sm h-[40px] bg-transparent border border-hairline text-muted hover:text-ink hover:border-ink transition-colors flex items-center"
            >
              <span className="material-icons text-sm mr-xxs">close</span> {tForm('close')}
            </button>
          </div>
          <div className="flex-grow bg-canvas overflow-auto p-sm md:p-lg border-x border-b border-hairline">
            <div className="w-full max-w-[210mm] mx-auto flex flex-col items-center gap-md">
              <RfiPDF rfi={mockRfi} companyProfile={companyProfile} />
            </div>
            <div className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-md max-w-5xl pb-xl mx-auto font-sans">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLE }} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs mb-md">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">
            {isEditing ? t('editRfi') : t('newRfi')}
          </h1>
          <p className="text-body text-muted mt-[4px]">
            {locale === 'es' ? 'Construye y gestiona solicitudes de información con template membretado.' : 'Build and manage Requests for Information with letterhead template.'}
          </p>
        </div>
        <div className="flex items-center gap-xs">
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

      {/* 1. Client & Document Info */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
          <span className="material-icons mr-xxs text-primary">business</span> {tForm('title') || 'Datos del Documento'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-sm">
          {/* Client Selection */}
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{tForm('clientLabel')}</label>
            <div className="relative">
              <select 
                className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">{tForm('clientPlaceholder')}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.razonSocial} ({c.rut})</option>
                ))}
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          {/* Issue Date */}
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('table.issueDate')}</label>
            <input 
              type="date" 
              className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              required
            />
          </div>

          {/* Deadline / Validity */}
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('table.validity')}</label>
            <input 
              type="date" 
              className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
              value={fechaValidez}
              onChange={(e) => setFechaValidez(e.target.value)}
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('table.status')}</label>
            <div className="relative">
              <select 
                className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="Borrador">{t('status.Borrador')}</option>
                <option value="Enviada">{t('status.Enviada')}</option>
                <option value="Respondida">{t('status.Respondida')}</option>
                <option value="Cerrada">{t('status.Cerrada')}</option>
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          {/* Sender (Admin) */}
          <div className="md:col-span-2 lg:col-span-4 space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{tForm('senderLabel') || 'Remitente'}</label>
            <div className="relative">
              <select 
                className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">{tForm('senderPlaceholder') || 'Seleccionar Remitente (Usar Company Profile)'}</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} {admin.cargo ? `(${admin.cargo})` : ''}
                  </option>
                ))}
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Proposal Editor & Live Preview */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
            <span className="material-icons mr-xxs text-primary">edit_note</span> {tForm('proposalTitle') || 'Contenido del RFI'}
          </h2>
        </div>
        <p className="text-body text-muted text-sm">
          {locale === 'es' 
            ? 'Redacta los antecedentes, requerimientos y cuestionarios del RFI. La vista previa en vivo se actualiza automáticamente.'
            : 'Write your RFI context, requirements, and questionnaires. The live preview updates automatically.'}
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
                placeholder="Escribe el contenido del RFI..."
              />
            </div>
          </div>

          {/* Right Column: Live Preview */}
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
                  <RfiPDF 
                    rfi={{
                      ...mockRfi,
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

      {/* 3. Notes & Confidentiality */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <label className="text-caption-uppercase text-ink font-semibold flex items-center">
          <span className="material-icons text-sm mr-xxs text-primary">gavel</span> {tForm('notesTitle') || 'Notas y Confidencialidad'}
        </label>
        <textarea 
          className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm min-h-[100px]"
          value={notasCondiciones}
          onChange={(e) => setNotasCondiciones(e.target.value)}
        />
      </div>

      {/* 4. Sticky Actions Bar */}
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
            {tForm('preview')}
          </button>
        </div>
        
        <div className="flex gap-xxs w-full sm:w-auto justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-lg h-[40px] bg-primary text-black font-semibold hover:bg-primary/90 transition-all flex items-center justify-center uppercase tracking-wider text-xs disabled:opacity-50"
          >
            <span className="material-icons mr-xxs text-sm">save</span>
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar RFI' : 'Guardar RFI')}
          </button>
        </div>
      </div>
    </form>
  );
}
