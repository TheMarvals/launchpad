'use client';

import { useRef, useState, useEffect } from 'react';
import type { EmailSenderIdentity } from '@prisma/client';
import { Link, useRouter } from '@/i18n/routing';
import { parsePitchTheme } from '@/components/pitches/PitchViewer';

const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export interface EmailComposerPitch {
  id: string;
  title: string;
  subtitle?: string | null;
  theme?: string | null;
  clientName?: string | null;
  client?: {
    id: string;
    razonSocial: string;
    email?: string | null;
  } | null;
  slides?: any;
}

export default function EmailComposer({
  identities,
  pitches = [],
  initialPitchId,
  initialTo,
  locale,
}: {
  identities: EmailSenderIdentity[];
  pitches?: EmailComposerPitch[];
  initialPitchId?: string;
  initialTo?: string;
  locale: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [senderIdentityId, setSenderIdentityId] = useState(identities[0]?.id || '');
  const [to, setTo] = useState(initialTo || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [requestId, setRequestId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Template Mode & Pitch Selection
  const [templateType, setTemplateType] = useState<'standard' | 'pitch'>(initialPitchId ? 'pitch' : 'standard');
  const [selectedPitchId, setSelectedPitchId] = useState(initialPitchId || pitches[0]?.id || '');
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');

  const isSpanish = locale === 'es';
  const selectedIdentity = identities.find((identity) => identity.id === senderIdentityId) ?? null;
  const selectedPitch = pitches.find((p) => p.id === selectedPitchId) ?? null;

  // Auto-populate subject, client email and intro message when pitch template is activated
  useEffect(() => {
    if (templateType === 'pitch' && selectedPitch) {
      const clientName = selectedPitch.client?.razonSocial || selectedPitch.clientName || 'Cliente';
      
      // Auto-set subject if blank or previous pitch template
      setSubject((prev) => {
        if (!prev || prev.startsWith('Propuesta Estratégica:') || prev.startsWith('Strategic Proposal:')) {
          return isSpanish
            ? `Propuesta Estratégica: ${selectedPitch.title} — ${clientName}`
            : `Strategic Proposal: ${selectedPitch.title} — ${clientName}`;
        }
        return prev;
      });

      // Auto-set recipient email if blank and client email is available
      if (!to && selectedPitch.client?.email) {
        setTo(selectedPitch.client.email);
      }

      // Auto-set intro message if blank
      if (!body) {
        setBody(
          isSpanish
            ? `Estimado equipo de ${clientName},\n\nEs un placer compartir con ustedes la propuesta estratégica y plan de ejecución que hemos desarrollado especialmente para su ecosistema digital.\n\nPueden acceder a la presentación interactiva y caso de estudio completo a través de la tarjeta que encontrarán a continuación.`
            : `Dear ${clientName} team,\n\nIt is our pleasure to share with you the strategic proposal and execution plan we have crafted specifically for your digital ecosystem.\n\nYou can access the full interactive presentation and case study via the card below.`
        );
      }
    }
  }, [templateType, selectedPitchId, isSpanish]);

  // Extract selected pitch theme & key pillars
  const pitchClientName = selectedPitch?.client?.razonSocial || selectedPitch?.clientName || 'Cliente';
  const { color: accentColor } = parsePitchTheme(selectedPitch?.theme || undefined, selectedPitch?.title || '', pitchClientName);
  
  const pitchSlides = Array.isArray(selectedPitch?.slides) ? (selectedPitch?.slides as any[]) : [];
  const pillarsSlide = pitchSlides.find((s) => s.type === 'pillars');
  const keyPillars = pillarsSlide && Array.isArray(pillarsSlide.cards) && pillarsSlide.cards.length > 0
    ? pillarsSlide.cards.map((c: any) => ({
        title: c.title,
        subtitle: c.subtitle || (c.description ? c.description.slice(0, 50) : undefined),
      }))
    : [
        { title: 'Ecosistema Digital 360°', subtitle: 'Estrategia y Arquitectura' },
        { title: 'Experiencia & UI/UX', subtitle: 'Diseño de Alto Impacto' },
        { title: 'Roadmap & Rendimiento', subtitle: 'Ejecución y Escalamiento' },
      ];

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []);
    const nextFiles = [...selectedFiles, ...incomingFiles];
    const totalSize = nextFiles.reduce((total, file) => total + file.size, 0);

    if (nextFiles.length > 10) {
      setError(isSpanish ? 'Puedes adjuntar un máximo de 10 archivos.' : 'You can attach up to 10 files.');
      event.target.value = '';
      return;
    }

    const oversizedFile = nextFiles.find((file) => file.size > 10 * 1024 * 1024);
    if (oversizedFile) {
      setError(isSpanish ? `${oversizedFile.name} supera los 10 MB.` : `${oversizedFile.name} exceeds 10 MB.`);
      event.target.value = '';
      return;
    }

    if (totalSize > 25 * 1024 * 1024) {
      setError(isSpanish ? 'Los adjuntos superan el máximo total de 25 MB.' : 'Attachments exceed the 25 MB total limit.');
      event.target.value = '';
      return;
    }

    setError('');
    setSelectedFiles(nextFiles);
    event.target.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!senderIdentityId || !to.trim() || !subject.trim() || !body.trim()) return;

    setSending(true);
    setError('');

    try {
      const effectiveRequestId = requestId || crypto.randomUUID();
      if (!requestId) setRequestId(effectiveRequestId);

      const formData = new FormData();
      formData.set('senderIdentityId', senderIdentityId);
      formData.set('to', to);
      formData.set('cc', cc);
      formData.set('bcc', bcc);
      formData.set('subject', subject);
      formData.set('body', body);
      formData.set('requestId', effectiveRequestId);
      formData.set('templateType', templateType);
      if (templateType === 'pitch' && selectedPitchId) {
        formData.set('pitchId', selectedPitchId);
      }
      formData.set('locale', locale);
      selectedFiles.forEach((file) => formData.append('attachments', file));

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json().catch(() => null) as { emailId?: string; error?: string } | null;

      if (!response.ok || !result?.emailId) {
        throw new Error(result?.error || (isSpanish ? 'No se pudo enviar el correo' : 'Could not send email'));
      }

      router.push(`/dashboard/emails/${result.emailId}`);
      router.refresh();
    } catch (submitError) {
      setError(getErrorMessage(submitError, isSpanish ? 'No se pudo enviar el correo' : 'Could not send email'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-canvas">
      <div className="p-4 md:p-6 border-b border-hairline shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/emails')}
          className="w-8 h-8 flex items-center justify-center bg-canvas-elevated hover:bg-hairline rounded-sm transition-colors shrink-0"
          aria-label={isSpanish ? 'Cancelar y volver' : 'Cancel and go back'}
        >
          <span className="material-icons text-sm">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter">
            {isSpanish ? 'Nuevo correo' : 'New email'}
          </h1>
          <p className="text-xs text-muted mt-1">
            {isSpanish ? 'La firma del remitente se agregará automáticamente.' : 'The sender signature will be added automatically.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {identities.length === 0 && (
            <div className="border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-300">
              {isSpanish ? 'No hay remitentes activos. ' : 'There are no active senders. '}
              <Link href="/dashboard/settings?tab=emailSenders" className="underline font-semibold">
                {isSpanish ? 'Configurar remitentes' : 'Configure senders'}
              </Link>
            </div>
          )}

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}

          {/* Template Mode Switcher */}
          <div className="border border-hairline bg-canvas-elevated p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted block">
                  {isSpanish ? 'Plantilla / Formato del Correo' : 'Email Format / Template'}
                </span>
                <span className="text-xs text-ink/90 font-medium">
                  {templateType === 'pitch'
                    ? (isSpanish ? 'Plantilla VIP de Propuesta Interactiva (Pitch Deck)' : 'VIP Interactive Pitch Deck Proposal Template')
                    : (isSpanish ? 'Texto Estándar / Mensaje Directo' : 'Standard Text / Direct Message')}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-canvas p-1 border border-hairline shrink-0">
                <button
                  type="button"
                  onClick={() => setTemplateType('standard')}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    templateType === 'standard'
                      ? 'bg-canvas-elevated text-ink shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {isSpanish ? 'Estándar' : 'Standard'}
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('pitch')}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    templateType === 'pitch'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {isSpanish ? 'Propuesta VIP' : 'VIP Proposal'}
                </button>
              </div>
            </div>

            {templateType === 'pitch' && (
              <div className="pt-3 border-t border-hairline/60 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                      {isSpanish ? 'Seleccionar Propuesta / Pitch' : 'Select Proposal / Pitch'}
                    </span>
                    <select
                      value={selectedPitchId}
                      onChange={(e) => setSelectedPitchId(e.target.value)}
                      className="w-full border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                    >
                      {pitches.length === 0 && (
                        <option value="">{isSpanish ? 'No hay pitches creados' : 'No pitches found'}</option>
                      )}
                      {pitches.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.client?.razonSocial || p.clientName || 'Cliente'})
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedPitch && (
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-canvas border border-hairline text-xs">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
                      />
                      <div className="truncate">
                        <span className="font-bold text-ink">{pitchClientName}</span>
                        <span className="text-muted ml-2">Acento: {accentColor}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
              {isSpanish ? 'De' : 'From'}
            </span>
            <select
              value={senderIdentityId}
              onChange={(event) => setSenderIdentityId(event.target.value)}
              required
              disabled={sending || identities.length === 0}
              className="w-full border border-hairline bg-canvas-elevated px-3 py-2.5 text-sm text-ink outline-none focus:border-primary disabled:opacity-50"
            >
              {identities.length === 0 && <option value="">{isSpanish ? 'Sin remitentes disponibles' : 'No senders available'}</option>}
              {identities.map((identity) => (
                <option key={identity.id} value={identity.id}>
                  {identity.displayName} &lt;{identity.email}&gt;
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                {isSpanish ? 'Para' : 'To'}
              </span>
              <input
                type="text"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                required
                disabled={sending}
                placeholder={isSpanish ? 'cliente@empresa.com, otro@empresa.com' : 'client@company.com, other@company.com'}
                className="w-full border border-hairline bg-canvas-elevated px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
              <span className="block text-[10px] text-muted">
                {isSpanish ? 'Separa varios destinatarios con comas.' : 'Separate multiple recipients with commas.'}
              </span>
            </label>

            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted">CC</span>
              <input
                type="text"
                value={cc}
                onChange={(event) => setCc(event.target.value)}
                disabled={sending}
                placeholder={isSpanish ? 'Opcional' : 'Optional'}
                className="w-full border border-hairline bg-canvas-elevated px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                {isSpanish ? 'CCO' : 'BCC'}
              </span>
              <input
                type="text"
                value={bcc}
                onChange={(event) => setBcc(event.target.value)}
                disabled={sending}
                placeholder={isSpanish ? 'Opcional' : 'Optional'}
                className="w-full border border-hairline bg-canvas-elevated px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
              {isSpanish ? 'Asunto' : 'Subject'}
            </span>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              maxLength={200}
              disabled={sending}
              className="w-full border border-hairline bg-canvas-elevated px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            />
          </label>

          {/* Message Area with Tabs for Pitch Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                {templateType === 'pitch'
                  ? (isSpanish ? 'Mensaje Introductorio' : 'Introductory Message')
                  : (isSpanish ? 'Mensaje' : 'Message')}
              </span>
              {templateType === 'pitch' && (
                <div className="flex items-center gap-1 bg-canvas p-0.5 border border-hairline text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('editor')}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      previewTab === 'editor' ? 'bg-canvas-elevated text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {isSpanish ? 'Redactar' : 'Write'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      previewTab === 'preview' ? 'bg-canvas-elevated text-primary' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {isSpanish ? 'Vista Previa' : 'Live Preview'}
                  </button>
                </div>
              )}
            </div>

            {previewTab === 'editor' || templateType === 'standard' ? (
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                maxLength={100000}
                disabled={sending}
                rows={templateType === 'pitch' ? 7 : 12}
                placeholder={isSpanish ? 'Escribe tu mensaje aquí…' : 'Write your message here…'}
                className="w-full border border-hairline bg-canvas-elevated px-3 py-3 text-sm outline-none focus:border-primary resize-y disabled:opacity-50"
              />
            ) : (
              /* Live HTML Email Preview (Launchpad Landing Aesthetics) */
              <div className="border border-hairline bg-[#07070b] text-[#e2e8f0] p-6 sm:p-8 rounded-lg max-w-[620px] mx-auto space-y-6 select-none shadow-2xl font-sans">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="font-black tracking-tighter text-base text-white block">LAUNCHPAD</span>
                  <span
                    className="text-[9px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-sm border"
                    style={{ borderColor: `${accentColor}50`, color: accentColor, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    {isSpanish ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS'}
                  </span>
                </div>

                {/* Intro message */}
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{body}</p>
                </div>

                {/* VIP Proposal Card */}
                <div
                  className="bg-[#0d0d14] border border-white/10 rounded-xl p-6 sm:p-7 space-y-5 relative overflow-hidden"
                  style={{
                    boxShadow: `0 24px 60px -15px ${accentColor}25`,
                  }}
                >
                  {/* Top Accent Gradient Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                    }}
                  />

                  {/* Client Tag + Subtitle Metadata */}
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-block text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-sm border text-white"
                      style={{ borderColor: `${accentColor}50`, backgroundColor: `${accentColor}18` }}
                    >
                      [ {pitchClientName.toUpperCase()} ]
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                      {isSpanish ? 'PROPUESTA ESTRATÉGICA' : 'STRATEGIC PROPOSAL'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                      {selectedPitch?.title || 'Pitch Deck Title'}
                    </h3>
                    {selectedPitch?.subtitle && (
                      <p className="text-xs text-slate-400 mt-1.5 font-sans">
                        Where ideas take off • {selectedPitch.subtitle.replace(/^Where ideas take off\s*•?\s*/gi, '').trim()}
                      </p>
                    )}
                  </div>

                  <hr className="border-white/10" />

                  {/* Key Highlights / Squads with Numbered Badges */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block">
                      {isSpanish ? 'PUNTOS CLAVE & ALCANCE DE LA PROPUESTA' : 'KEY PROPOSAL HIGHLIGHTS & SCOPE'}
                    </span>
                    <div className="space-y-2">
                      {keyPillars.slice(0, 3).map((pillar: { title: string; subtitle?: string }, i: number) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <span
                            className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                            style={{
                              color: accentColor,
                              backgroundColor: `${accentColor}15`,
                              border: `1px solid ${accentColor}30`,
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="leading-snug">
                            <span className="text-slate-100 font-bold">{pillar.title}</span>
                            {pillar.subtitle && (
                              <span className="text-slate-400 font-normal ml-1">— {pillar.subtitle}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button matching LandingCta */}
                  <div className="text-center pt-3">
                    <div
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.2em] text-white cursor-pointer transition-transform hover:-translate-y-0.5"
                      style={{
                        backgroundColor: accentColor,
                        color: accentColor.toUpperCase() === '#FFFFFF' ? '#000000' : '#ffffff',
                        boxShadow: `0 0 28px ${accentColor}50, 0 10px 20px -5px ${accentColor}70`,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {isSpanish ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →'}
                    </div>
                  </div>

                  <div className="text-center text-[10px] font-mono text-slate-500 pt-1">
                    {isSpanish ? 'Enlace de acceso directo:' : 'Direct access link:'}{' '}
                    <span className="underline cursor-pointer" style={{ color: accentColor }}>
                      {isSpanish ? 'Abrir propuesta en el navegador →' : 'Open proposal in browser →'}
                    </span>
                  </div>
                </div>

                {/* Presenter Signature */}
                <div className="p-3.5 bg-[#0a0a10] border border-white/10 rounded-sm flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-sm border flex items-center justify-center font-mono font-bold text-xs shrink-0"
                    style={{ borderColor: `${accentColor}60`, backgroundColor: `${accentColor}18`, color: accentColor }}
                  >
                    {(selectedIdentity?.displayName?.replace(/LAUNCHPAD Contacto/gi, 'LAUNCHPAD Contact') || 'LC')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-tight">
                      {selectedIdentity?.displayName?.replace(/LAUNCHPAD Contacto/gi, 'LAUNCHPAD Contact') || 'LAUNCHPAD Contact'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">{selectedIdentity?.email}</p>
                  </div>
                </div>

                <div className="text-center text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
                  © {new Date().getFullYear()} LAUNCHPAD · Where ideas take off
                </div>
              </div>
            )}
          </div>

          {selectedIdentity?.signature && (
            <div className="border-l-2 border-primary/40 pl-3">
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted mb-1">
                {isSpanish ? 'Firma automática' : 'Automatic signature'}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-muted">{selectedIdentity.signature}</pre>
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <span key={`${file.name}-${file.lastModified}-${index}`} className="inline-flex items-center gap-2 max-w-full px-3 py-2 border border-hairline bg-canvas-elevated text-xs">
                  <span className="material-icons text-[16px] text-primary">attach_file</span>
                  <span className="truncate max-w-[220px]">{file.name}</span>
                  <span className="text-muted shrink-0">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))}
                    disabled={sending}
                    className="text-muted hover:text-red-400 disabled:opacity-50"
                    aria-label={isSpanish ? `Quitar ${file.name}` : `Remove ${file.name}`}
                  >
                    <span className="material-icons text-[16px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-hairline">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileSelection}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || selectedFiles.length >= 10}
                className="inline-flex items-center gap-2 px-3 py-2 border border-hairline text-xs font-semibold text-muted hover:text-ink hover:border-primary disabled:opacity-50"
              >
                <span className="material-icons text-[17px]">attach_file</span>
                {isSpanish ? 'Adjuntar archivos' : 'Attach files'}
              </button>
              <p className="mt-1 text-[10px] text-muted">
                {isSpanish ? 'Máx. 10 MB por archivo · 25 MB total' : 'Max. 10 MB per file · 25 MB total'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard/emails')}
                disabled={sending}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-ink disabled:opacity-50"
              >
                {isSpanish ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={sending || identities.length === 0 || !to.trim() || !subject.trim() || !body.trim()}
                className="bg-primary text-on-primary px-5 py-2 font-bold uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <span className={`material-icons text-[16px] ${sending ? 'animate-spin' : ''}`}>
                  {sending ? 'refresh' : 'send'}
                </span>
                {sending ? (isSpanish ? 'Enviando…' : 'Sending…') : (isSpanish ? 'Enviar correo' : 'Send email')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
