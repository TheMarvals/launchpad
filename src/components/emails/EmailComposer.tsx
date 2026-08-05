'use client';

import { useRef, useState } from 'react';
import type { EmailSenderIdentity } from '@prisma/client';
import { Link, useRouter } from '@/i18n/routing';

const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function EmailComposer({
  identities,
  locale,
}: {
  identities: EmailSenderIdentity[];
  locale: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [senderIdentityId, setSenderIdentityId] = useState(identities[0]?.id || '');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [requestId, setRequestId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const isSpanish = locale === 'es';
  const selectedIdentity = identities.find((identity) => identity.id === senderIdentityId) ?? null;

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

          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted">
              {isSpanish ? 'Mensaje' : 'Message'}
            </span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              maxLength={100000}
              disabled={sending}
              rows={12}
              placeholder={isSpanish ? 'Escribe tu mensaje aquí…' : 'Write your message here…'}
              className="w-full border border-hairline bg-canvas-elevated px-3 py-3 text-sm outline-none focus:border-primary resize-y disabled:opacity-50"
            />
          </label>

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
