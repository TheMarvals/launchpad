'use client';

import { useRef, useState, useEffect } from 'react';
import type { EmailSenderIdentity } from '@prisma/client';
import { Link, useRouter } from '@/i18n/routing';
import { parsePitchTheme } from '@/components/pitches/PitchViewer';
import { savePitchCardCustomization } from '@/app/actions/pitches';

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
  user?: {
    id: string;
    name?: string | null;
    cargo?: string | null;
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
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
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
  const [loadedPitchId, setLoadedPitchId] = useState<string | null>(null);
  const [badgeText, setBadgeText] = useState(locale === 'es' ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS');
  const [clientTag, setClientTag] = useState('');
  const [tagline, setTagline] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [pillarsLabel, setPillarsLabel] = useState('');
  const [customPillars, setCustomPillars] = useState<Array<{ title: string; subtitle: string }>>([
    { title: 'Creative Assets & Digital Design', subtitle: 'D-Channel, D-Hub & Email' },
    { title: 'Video & Motion Graphics', subtitle: 'Shooting, Editing & 2D/3D Motion' },
    { title: 'Executive Slides & Data Viz', subtitle: 'Presentations & Infographics' },
  ]);
  const [buttonText, setButtonText] = useState(locale === 'es' ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →');
  const [linkText, setLinkText] = useState(locale === 'es' ? 'Abrir propuesta interactiva en el navegador →' : 'Open interactive proposal in browser →');
  const [senderName, setSenderName] = useState('Eduardo Marval');
  const [senderRole, setSenderRole] = useState('CEO & MANAGING DIRECTOR');
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');
  const [isSavingToPitch, setIsSavingToPitch] = useState(false);
  const [savePitchSuccess, setSavePitchSuccess] = useState(false);

  const isSpanish = locale === 'es';
  const selectedIdentity = identities.find((identity) => identity.id === senderIdentityId) ?? null;
  const selectedPitch = pitches.find((p) => p.id === selectedPitchId) ?? null;

  // Auto-populate subject, client email, card details and intro message when pitch template is activated
  useEffect(() => {
    if (templateType === 'pitch' && selectedPitch) {
      const clientName = selectedPitch.client?.razonSocial || selectedPitch.clientName || 'Cliente';
      const pitchSlides = Array.isArray(selectedPitch?.slides) ? (selectedPitch?.slides as any[]) : [];
      const dbEmailConfig = pitchSlides.find((s) => s.type === 'emailConfig');
      
      let localData: any = null;
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`launchpad_email_vip_config_${selectedPitch.id}`);
        if (saved) {
          try {
            localData = JSON.parse(saved);
          } catch {}
        }
      }

      // Priority 1: localStorage draft
      // Priority 2: database emailConfig
      // Priority 3: pitch deck defaults
      const source = localData || dbEmailConfig || {};

      const nextSubject = (source.subject !== undefined && source.subject.trim() !== '')
        ? source.subject
        : (isSpanish
            ? `Propuesta Estratégica: ${selectedPitch.title} — ${clientName}`
            : `Strategic Proposal: ${selectedPitch.title} — ${clientName}`);

      const nextBody = (source.body !== undefined && source.body.trim() !== '')
        ? source.body
        : (source.introMessage !== undefined && source.introMessage.trim() !== '')
          ? source.introMessage
          : (isSpanish
              ? `Estimado equipo de ${clientName},\n\nEs un placer compartir con ustedes la propuesta estratégica y plan de ejecución que hemos desarrollado especialmente para su ecosistema digital.\n\nPueden acceder a la presentación interactiva y caso de estudio completo a través de la tarjeta que encontrarán a continuación.`
              : `Dear ${clientName} team,\n\nIt is our pleasure to share with you the strategic proposal and execution plan we have crafted specifically for your digital ecosystem.\n\nYou can access the full interactive presentation and case study via the card below.`);

      const nextBadgeText = (source.badgeText !== undefined && source.badgeText.trim() !== '')
        ? source.badgeText
        : (isSpanish ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS');

      const nextClientTag = (source.clientTag !== undefined && source.clientTag.trim() !== '')
        ? source.clientTag
        : clientName;

      const nextTagline = (source.tagline !== undefined && source.tagline.trim() !== '')
        ? source.tagline
        : (isSpanish ? 'PROPUESTA ESTRATÉGICA' : 'STRATEGIC PROPOSAL');

      const nextCardTitle = (source.cardTitle !== undefined && source.cardTitle.trim() !== '')
        ? source.cardTitle
        : (selectedPitch.title || '');

      const nextCardSubtitle = (source.cardSubtitle !== undefined && source.cardSubtitle.trim() !== '')
        ? source.cardSubtitle.replace(/^Where ideas take off\s*•?\s*/gi, '').trim()
        : (selectedPitch.subtitle || '2026 Daily Comms & Major Event Production').replace(/^Where ideas take off\s*•?\s*/gi, '').trim();

      const nextPillarsLabel = (source.pillarsLabel !== undefined && source.pillarsLabel.trim() !== '')
        ? source.pillarsLabel
        : (isSpanish ? 'PUNTOS CLAVE & ALCANCE DE LA PROPUESTA' : 'KEY PROPOSAL HIGHLIGHTS & SCOPE');

      let nextPillars = source.customPillars || source.keyPillars;
      if (!Array.isArray(nextPillars) || nextPillars.length === 0) {
        const pillarsSlide = pitchSlides.find((s) => s.type === 'pillars');
        if (pillarsSlide && Array.isArray(pillarsSlide.cards) && pillarsSlide.cards.length > 0) {
          nextPillars = pillarsSlide.cards.slice(0, 3).map((c: any) => ({
            title: c.title || '',
            subtitle: c.subtitle || (c.description ? c.description.slice(0, 50) : ''),
          }));
        } else {
          nextPillars = [
            { title: 'Creative Assets & Digital Design', subtitle: 'D-Channel, D-Hub & Email' },
            { title: 'Video & Motion Graphics', subtitle: 'Shooting, Editing & 2D/3D Motion' },
            { title: 'Executive Slides & Data Viz', subtitle: 'Presentations & Infographics' },
          ];
        }
      }

      const nextButtonText = (source.buttonText !== undefined && source.buttonText.trim() !== '')
        ? source.buttonText
        : (isSpanish ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →');

      const nextLinkText = (source.linkText !== undefined && source.linkText.trim() !== '')
        ? source.linkText
        : (isSpanish ? 'Abrir propuesta interactiva en el navegador →' : 'Open interactive proposal in browser →');

      const nextSenderName = (source.senderName !== undefined && source.senderName.trim() !== '')
        ? source.senderName
        : (selectedPitch.user?.name || (selectedIdentity?.displayName && !selectedIdentity.displayName.toLowerCase().includes('contact') ? selectedIdentity.displayName : 'Eduardo Marval'));

      const nextSenderRole = (source.senderRole !== undefined && source.senderRole.trim() !== '')
        ? source.senderRole
        : (selectedPitch.user?.cargo || 'CEO & MANAGING DIRECTOR');

      setSubject(nextSubject);
      setBody(nextBody);
      setBadgeText(nextBadgeText);
      setClientTag(nextClientTag);
      setTagline(nextTagline);
      setCardTitle(nextCardTitle);
      setCardSubtitle(nextCardSubtitle);
      setPillarsLabel(nextPillarsLabel);
      setCustomPillars(nextPillars);
      setButtonText(nextButtonText);
      setLinkText(nextLinkText);
      setSenderName(nextSenderName);
      setSenderRole(nextSenderRole);

      if (!to && selectedPitch.client?.email) {
        setTo(selectedPitch.client.email);
      }

      setLoadedPitchId(selectedPitch.id);
    }
  }, [templateType, selectedPitchId, isSpanish]);

  // Sync to localStorage on every change ONLY AFTER this pitch is loaded
  useEffect(() => {
    if (templateType === 'pitch' && selectedPitchId && loadedPitchId === selectedPitchId && typeof window !== 'undefined') {
      localStorage.setItem(
        `launchpad_email_vip_config_${selectedPitchId}`,
        JSON.stringify({
          subject,
          body,
          badgeText,
          clientTag,
          tagline,
          cardTitle,
          cardSubtitle,
          pillarsLabel,
          customPillars,
          buttonText,
          linkText,
          senderName,
          senderRole,
        })
      );
    }
  }, [loadedPitchId, selectedPitchId, subject, body, badgeText, clientTag, tagline, cardTitle, cardSubtitle, pillarsLabel, customPillars, buttonText, linkText, senderName, senderRole, templateType]);

  const saveToPitchDeck = async () => {
    if (!selectedPitchId) return;
    setIsSavingToPitch(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `launchpad_email_vip_config_${selectedPitchId}`,
          JSON.stringify({
            subject,
            body,
            badgeText,
            clientTag,
            tagline,
            cardTitle,
            cardSubtitle,
            pillarsLabel,
            customPillars,
            buttonText,
            linkText,
            senderName,
            senderRole,
          })
        );
      }
      await savePitchCardCustomization(selectedPitchId, {
        subject,
        introMessage: body,
        badgeText,
        clientTag,
        tagline,
        cardTitle,
        cardSubtitle,
        pillarsLabel,
        keyPillars: customPillars,
        buttonText,
        linkText,
        senderName,
        senderRole,
      });
      setSavePitchSuccess(true);
      setTimeout(() => setSavePitchSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save to pitch deck:', err);
    } finally {
      setIsSavingToPitch(false);
    }
  };

  const resetToPitchDefaults = () => {
    if (!selectedPitch) return;
    const clientName = selectedPitch.client?.razonSocial || selectedPitch.clientName || 'Cliente';
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`launchpad_email_vip_config_${selectedPitch.id}`);
    }
    setSubject(
      isSpanish
        ? `Propuesta Estratégica: ${selectedPitch.title} — ${clientName}`
        : `Strategic Proposal: ${selectedPitch.title} — ${clientName}`
    );
    setBody(
      isSpanish
        ? `Estimado equipo de ${clientName},\n\nEs un placer compartir con ustedes la propuesta estratégica y plan de ejecución que hemos desarrollado especialmente para su ecosistema digital.\n\nPueden acceder a la presentación interactiva y caso de estudio completo a través de la tarjeta que encontrarán a continuación.`
        : `Dear ${clientName} team,\n\nIt is our pleasure to share with you the strategic proposal and execution plan we have crafted specifically for your digital ecosystem.\n\nYou can access the full interactive presentation and case study via the card below.`
    );
    setBadgeText(isSpanish ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS');
    setClientTag(clientName);
    setTagline(isSpanish ? 'PROPUESTA ESTRATÉGICA' : 'STRATEGIC PROPOSAL');
    setCardTitle(selectedPitch.title || '');
    setCardSubtitle((selectedPitch.subtitle || '2026 Daily Comms & Major Event Production').replace(/^Where ideas take off\s*•?\s*/gi, '').trim());
    setPillarsLabel(isSpanish ? 'PUNTOS CLAVE & ALCANCE DE LA PROPUESTA' : 'KEY PROPOSAL HIGHLIGHTS & SCOPE');

    const pitchSlides = Array.isArray(selectedPitch?.slides) ? (selectedPitch?.slides as any[]) : [];
    const pillarsSlide = pitchSlides.find((s) => s.type === 'pillars');
    if (pillarsSlide && Array.isArray(pillarsSlide.cards) && pillarsSlide.cards.length > 0) {
      setCustomPillars(
        pillarsSlide.cards.slice(0, 3).map((c: any) => ({
          title: c.title || '',
          subtitle: c.subtitle || (c.description ? c.description.slice(0, 50) : ''),
        }))
      );
    } else {
      setCustomPillars([
        { title: 'Creative Assets & Digital Design', subtitle: 'D-Channel, D-Hub & Email' },
        { title: 'Video & Motion Graphics', subtitle: 'Shooting, Editing & 2D/3D Motion' },
        { title: 'Executive Slides & Data Viz', subtitle: 'Presentations & Infographics' },
      ]);
    }
    setButtonText(isSpanish ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →');
    setLinkText(isSpanish ? 'Abrir propuesta interactiva en el navegador →' : 'Open interactive proposal in browser →');
    setSenderName(selectedPitch.user?.name || (selectedIdentity?.displayName && !selectedIdentity.displayName.toLowerCase().includes('contact') ? selectedIdentity.displayName : 'Eduardo Marval'));
    setSenderRole(selectedPitch.user?.cargo || 'CEO & MANAGING DIRECTOR');
  };

  // Extract selected pitch theme & key pillars
  const pitchClientName = clientTag || selectedPitch?.client?.razonSocial || selectedPitch?.clientName || 'Cliente';
  const { color: accentColor } = parsePitchTheme(selectedPitch?.theme || undefined, cardTitle || selectedPitch?.title || '', pitchClientName);

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

  const updatePillar = (index: number, field: 'title' | 'subtitle', value: string) => {
    setCustomPillars((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = { title: '', subtitle: '' };
      next[index] = { ...next[index], [field]: value };
      return next;
    });
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
      if (templateType === 'pitch') {
        if (selectedPitchId) {
          formData.set('pitchId', selectedPitchId);
          // Persist to database in background
          savePitchCardCustomization(selectedPitchId, {
            subject,
            introMessage: body,
            badgeText,
            clientTag,
            tagline,
            cardTitle,
            cardSubtitle,
            pillarsLabel,
            keyPillars: customPillars,
            buttonText,
            linkText,
            senderName,
            senderRole,
          }).catch(console.error);
        }
        if (cardTitle) formData.set('cardTitle', cardTitle);
        if (cardSubtitle) formData.set('cardSubtitle', cardSubtitle);
        if (clientTag) formData.set('clientTag', clientTag);
        if (tagline) formData.set('tagline', tagline);
        if (pillarsLabel) formData.set('pillarsLabel', pillarsLabel);
        if (badgeText) formData.set('badgeText', badgeText);
        if (customPillars && customPillars.length > 0) {
          formData.set('keyPillars', JSON.stringify(customPillars));
        }
        if (buttonText) formData.set('buttonText', buttonText);
        if (linkText) formData.set('linkText', linkText);
        if (senderName) formData.set('senderName', senderName);
        if (senderRole) formData.set('senderRole', senderRole);
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

                {/* Advanced VIP Card Customization Fields */}
                <div className="pt-2 space-y-3 border-t border-hairline/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-canvas p-2.5 border border-hairline rounded-sm">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-primary block">
                        {isSpanish ? 'Personalizar Contenido de la Tarjeta VIP' : 'Customize VIP Card Content'}
                      </span>
                      <span className="text-[10px] text-muted">
                        {isSpanish ? 'Tus cambios se guardan automáticamente en esta propuesta' : 'Changes are automatically saved to this pitch'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {savePitchSuccess && (
                        <span className="text-[10px] font-bold text-semantic-success flex items-center gap-1 animate-fade-in">
                          <span className="material-icons text-xs">check_circle</span>
                          {isSpanish ? '¡Guardado en la propuesta!' : 'Saved to pitch!'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={saveToPitchDeck}
                        disabled={isSavingToPitch}
                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                        title={isSpanish ? 'Guardar permanentemente en la base de datos de esta propuesta' : 'Permanently save to database for this pitch deck'}
                      >
                        <span className="material-icons text-xs">{isSavingToPitch ? 'hourglass_empty' : 'save'}</span>
                        {isSavingToPitch ? (isSpanish ? 'Guardando…' : 'Saving…') : (isSpanish ? 'Guardar en Propuesta' : 'Save to Pitch')}
                      </button>
                      <button
                        type="button"
                        onClick={resetToPitchDefaults}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-hairline text-muted hover:text-ink text-[10px] font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-colors"
                        title={isSpanish ? 'Restaurar a los valores por defecto del Pitch Deck' : 'Reset to pitch deck defaults'}
                      >
                        <span className="material-icons text-xs">restart_alt</span>
                        {isSpanish ? 'Restaurar' : 'Reset'}
                      </button>
                    </div>
                  </div>

                  {/* Top Header Badge + Client Tag + Tagline */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Badge Superior / Acceso VIP' : 'Top Header Badge'}
                      </span>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder={isSpanish ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS'}
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary font-mono"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Etiqueta / Cliente [ BADGE ]' : 'Badge / Client [ BADGE ]'}
                      </span>
                      <input
                        type="text"
                        value={clientTag}
                        onChange={(e) => setClientTag(e.target.value)}
                        placeholder="DIDI"
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary font-mono"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Categoría / Tagline Superior' : 'Top Tagline / Category'}
                      </span>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder={isSpanish ? 'PROPUESTA ESTRATÉGICA' : 'STRATEGIC PROPOSAL'}
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary font-mono"
                      />
                    </label>
                  </div>

                  {/* Card Title & Subtitle */}
                  <div className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Título Principal de la Tarjeta' : 'Main Card Title'}
                      </span>
                      <input
                        type="text"
                        value={cardTitle}
                        onChange={(e) => setCardTitle(e.target.value)}
                        placeholder="DiDi Global IC • Creative & Multimedia Production RFI"
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary font-bold"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Subtítulo / Bajada de la Tarjeta' : 'Card Subtitle / Description'}
                      </span>
                      <input
                        type="text"
                        value={cardSubtitle}
                        onChange={(e) => setCardSubtitle(e.target.value)}
                        placeholder="2026 Daily Comms & Major Event Production"
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  {/* Pillars Section */}
                  <div className="pt-2 space-y-2 border-t border-hairline/40">
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Título de la Sección de Puntos Clave' : 'Highlights Section Label'}
                      </span>
                      <input
                        type="text"
                        value={pillarsLabel}
                        onChange={(e) => setPillarsLabel(e.target.value)}
                        placeholder={isSpanish ? 'PUNTOS CLAVE & ALCANCE DE LA PROPUESTA' : 'KEY PROPOSAL HIGHLIGHTS & SCOPE'}
                        className="w-full border border-hairline bg-canvas px-3 py-1.5 text-xs text-ink outline-none focus:border-primary font-mono"
                      />
                    </label>

                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted block">
                        {isSpanish ? 'Puntos Clave / Squads (01, 02, 03)' : 'Key Highlights / Squads (01, 02, 03)'}
                      </span>
                      {customPillars.map((pillar, pIdx) => (
                        <div key={pIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-canvas p-2 border border-hairline">
                          <span
                            className="sm:col-span-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-center shrink-0"
                            style={{
                              color: accentColor,
                              backgroundColor: `${accentColor}15`,
                              border: `1px solid ${accentColor}30`,
                            }}
                          >
                            {String(pIdx + 1).padStart(2, '0')}
                          </span>
                          <input
                            type="text"
                            value={pillar.title}
                            onChange={(e) => updatePillar(pIdx, 'title', e.target.value)}
                            placeholder={isSpanish ? `Título ${pIdx + 1}` : `Title ${pIdx + 1}`}
                            className="sm:col-span-5 border border-hairline bg-canvas-elevated px-2 py-1 text-xs text-ink font-bold outline-none focus:border-primary"
                          />
                          <input
                            type="text"
                            value={pillar.subtitle}
                            onChange={(e) => updatePillar(pIdx, 'subtitle', e.target.value)}
                            placeholder={isSpanish ? `Subtítulo / Detalle ${pIdx + 1}` : `Subtitle / Detail ${pIdx + 1}`}
                            className="sm:col-span-6 border border-hairline bg-canvas-elevated px-2 py-1 text-xs text-ink outline-none focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customizable CTA Button & Link Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-hairline/40">
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Texto del Botón Principal (CTA)' : 'Main Button Text (CTA)'}
                      </span>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder={isSpanish ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →'}
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary font-bold"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Texto del Enlace de Respaldo' : 'Fallback Link Text'}
                      </span>
                      <input
                        type="text"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        placeholder={isSpanish ? 'Abrir propuesta interactiva en el navegador →' : 'Open interactive proposal in browser →'}
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  {/* Presenter Sign-off Customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-hairline/40">
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Nombre del Presentador / Firmante' : 'Presenter / Signer Name'}
                      </span>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Eduardo Marval"
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary font-bold"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
                        {isSpanish ? 'Cargo / Título Ejecutivo' : 'Presenter Title / Executive Role'}
                      </span>
                      <input
                        type="text"
                        value={senderRole}
                        onChange={(e) => setSenderRole(e.target.value)}
                        placeholder="CEO & MANAGING DIRECTOR"
                        className="w-full border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary font-mono"
                      />
                    </label>
                  </div>
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
                <div className="flex items-center justify-between border-b border-[#232336] pb-6 pt-2">
                  <img
                    src="/lp_logo.png"
                    alt="LAUNCHPAD"
                    className="h-6 w-auto object-contain"
                  />
                  <span
                    className="text-[9px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-sm border"
                    style={{ borderColor: accentColor, color: accentColor, backgroundColor: '#161622' }}
                  >
                    {badgeText || (isSpanish ? 'CONFIDENCIAL // ACCESO VIP' : 'CONFIDENTIAL // VIP ACCESS')}
                  </span>
                </div>

                {/* Intro message */}
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{body}</p>
                </div>

                {/* VIP Monolithic Proposal Card */}
                <div
                  className="bg-[#0d0d18] border border-[#232338] rounded-xl p-6 sm:p-7 space-y-5 relative shadow-xl"
                  style={{
                    borderTop: `3px solid ${accentColor}`,
                  }}
                >
                  {/* Client Tag + Category Metadata */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className="inline-block text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-sm border text-white"
                      style={{ borderColor: accentColor, backgroundColor: '#161622' }}
                    >
                      [ {clientTag || pitchClientName} ]
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      {tagline || (isSpanish ? 'PROPUESTA ESTRATÉGICA' : 'STRATEGIC PROPOSAL')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                      {cardTitle || selectedPitch?.title || 'Pitch Deck Title'}
                    </h3>
                    {(cardSubtitle || selectedPitch?.subtitle) && (
                      <p className="text-xs text-slate-400 mt-1.5 font-sans">
                        {(cardSubtitle || selectedPitch?.subtitle || '').replace(/^Where ideas take off\s*•?\s*/gi, '').trim() || (cardSubtitle || selectedPitch?.subtitle)}
                      </p>
                    )}
                  </div>

                  <hr className="border-[#232336]" />

                  {/* Key Squads / Highlights as Interactive-style Tab Cards */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
                      {pillarsLabel || (isSpanish ? 'PUNTOS CLAVE & ALCANCE DE LA PROPUESTA' : 'KEY PROPOSAL HIGHLIGHTS & SCOPE')}
                    </span>
                    <div className="space-y-2.5">
                      {customPillars.slice(0, 3).map((pillar, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-[#131322] border border-[#24243a] rounded-lg transition-colors"
                        >
                          <span
                            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                            style={{
                              color: accentColor,
                              backgroundColor: '#1b1b2e',
                              border: `1px solid ${accentColor}`,
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="leading-snug min-w-0">
                            <p className="text-slate-100 font-bold text-xs truncate">{pillar.title}</p>
                            {pillar.subtitle && (
                              <p className="text-slate-400 text-[11px] font-normal truncate mt-0.5">{pillar.subtitle}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button with generous breathing room */}
                  <div className="text-center pt-5 pb-1">
                    <a
                      href={selectedPitch ? `/pitches/${selectedPitch.id}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.2em] text-white cursor-pointer transition-transform hover:-translate-y-0.5 text-center no-underline"
                      style={{
                        backgroundColor: accentColor,
                        color: accentColor.toUpperCase() === '#FFFFFF' ? '#000000' : '#ffffff',
                      }}
                      title={isSpanish ? 'Abrir presentación interactiva' : 'Open interactive presentation'}
                    >
                      {buttonText || (isSpanish ? 'VER PROPUESTA INTERACTIVA →' : 'VIEW INTERACTIVE PROPOSAL →')}
                    </a>
                  </div>

                  <div className="text-center text-[10px] font-mono text-slate-400">
                    {isSpanish ? 'Enlace de acceso directo:' : 'Direct access link:'}{' '}
                    <a
                      href={selectedPitch ? `/pitches/${selectedPitch.id}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="underline cursor-pointer"
                      style={{ color: accentColor }}
                      title={isSpanish ? 'Abrir propuesta en el navegador' : 'Open proposal in browser'}
                    >
                      {linkText || (isSpanish ? 'Abrir propuesta en el navegador →' : 'Open proposal in browser →')}
                    </a>
                  </div>
                </div>

                {/* Presenter Signature Executive Card */}
                <div className="p-3.5 bg-[#0d0d18] border border-[#232338] rounded-lg flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-[11px] shrink-0"
                    style={{
                      backgroundColor: '#161626',
                      border: '1px solid #2e2e46',
                      color: accentColor,
                    }}
                  >
                    {(senderName || 'Eduardo Marval').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'EM'}
                  </span>
                  <div className="text-left leading-snug">
                    <p className="text-xs font-bold text-white tracking-tight">
                      {senderName || 'Eduardo Marval'}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
                      {(senderRole || 'CEO & MANAGING DIRECTOR').replace(/\.$/, '')}
                    </p>
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
