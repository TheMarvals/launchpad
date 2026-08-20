'use client';

import React, { useEffect, useRef, useState, use } from 'react';
import { useRouter } from '@/i18n/routing';
import { getEmailById, deleteEmail } from '@/app/actions/emails';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import EmailHtmlFrame from '@/components/emails/EmailHtmlFrame';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function deliveryLabel(status: string | null, locale: string) {
  const labels: Record<string, [string, string]> = {
    SENT: ['Enviado', 'Sent'],
    DELIVERED: ['Aceptado por el servidor', 'Accepted by recipient server'],
    DELAYED: ['Entrega demorada', 'Delivery delayed'],
    BOUNCED: ['Correo rebotado', 'Email bounced'],
    FAILED: ['Envío fallido', 'Delivery failed'],
    COMPLAINED: ['Marcado como spam', 'Marked as spam'],
    SUPPRESSED: ['Envío suprimido', 'Delivery suppressed'],
  };

  if (!status || !labels[status]) return locale === 'es' ? 'Estado pendiente' : 'Status pending';
  return locale === 'es' ? labels[status][0] : labels[status][1];
}

export default function EmailDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params);
  const router = useRouter();
  
  const [email, setEmail] = useState<Awaited<ReturnType<typeof getEmailById>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dateLocale = locale === 'es' ? es : enUS;

  useEffect(() => {
    async function fetchEmail() {
      setLoading(true);
      try {
        const data = await getEmailById(id);
        setEmail(data);
      } catch (err) {
        console.error(err);
        setError('Error loading email');
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(locale === 'es' ? '¿Estás seguro de que deseas eliminar este correo?' : 'Are you sure you want to delete this email?')) {
      return;
    }
    setDeleting(true);
    try {
      await deleteEmail(id);
      router.push('/dashboard/emails');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error deleting email'));
      setDeleting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && selectedFiles.length === 0) return;

    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      formData.set('originalEmailId', id);
      formData.set('replyBody', replyText);
      selectedFiles.forEach((file) => formData.append('attachments', file));

      const response = await fetch('/api/emails/reply', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || 'Error sending reply');
      }

      setReplyText('');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Reload email to show REPLIED status
      const data = await getEmailById(id);
      setEmail(data);
      alert(locale === 'es' ? 'Respuesta enviada con éxito' : 'Reply sent successfully');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error sending reply'));
    } finally {
      setSending(false);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []);
    const nextFiles = [...selectedFiles, ...incomingFiles];
    const totalSize = nextFiles.reduce((total, file) => total + file.size, 0);

    if (nextFiles.length > 10) {
      setError(locale === 'es' ? 'Puedes adjuntar un máximo de 10 archivos.' : 'You can attach up to 10 files.');
      event.target.value = '';
      return;
    }

    const oversizedFile = nextFiles.find((file) => file.size > 10 * 1024 * 1024);
    if (oversizedFile) {
      setError(locale === 'es' ? `${oversizedFile.name} supera los 10 MB.` : `${oversizedFile.name} exceeds 10 MB.`);
      event.target.value = '';
      return;
    }

    if (totalSize > 25 * 1024 * 1024) {
      setError(locale === 'es' ? 'Los adjuntos superan el máximo total de 25 MB.' : 'Attachments exceed the 25 MB total limit.');
      event.target.value = '';
      return;
    }

    setError('');
    setSelectedFiles(nextFiles);
    event.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, fileIndex) => fileIndex !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center text-muted">
        <span className="material-icons animate-spin mr-2">refresh</span>
        {locale === 'es' ? 'Cargando...' : 'Loading...'}
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-red-500">
        <span className="material-icons text-4xl mb-2 opacity-80">error_outline</span>
        <p>{error || 'Email no encontrado'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-y-auto md:overflow-hidden bg-canvas">
      {/* Mobile Back Button - Only visible on small screens */}
      <div className="md:hidden sticky top-0 z-10 px-3 py-2.5 border-b border-hairline flex items-center gap-3 bg-canvas/95 backdrop-blur-sm">
        <button 
          type="button"
          onClick={() => router.push('/dashboard/emails')}
          className="w-10 h-10 flex items-center justify-center bg-canvas-elevated hover:bg-hairline rounded-full transition-colors shrink-0"
          aria-label={locale === 'es' ? 'Volver a correos' : 'Back to emails'}
        >
          <span className="material-icons text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-sm font-bold">{locale === 'es' ? 'Bandeja de entrada' : 'Inbox'}</h1>
      </div>

      {/* Header */}
      <div className="px-4 py-5 md:p-6 border-b border-hairline shrink-0">
        <div className="flex justify-between items-start gap-3 mb-5 md:mb-4">
          <h1 className="min-w-0 text-[22px] leading-7 md:text-2xl font-black tracking-tighter break-words">
            {email.subject || '(Sin asunto)'}
          </h1>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-sm transition-colors shrink-0 disabled:opacity-50"
            title={locale === 'es' ? 'Eliminar correo' : 'Delete email'}
          >
            <span className="material-icons text-[18px]">
              {deleting ? 'refresh' : 'delete'}
            </span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="w-11 h-11 bg-canvas-elevated border border-hairline rounded-full flex items-center justify-center font-bold text-ink shrink-0">
              {email.from.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-ink text-[15px] break-all">{email.from}</div>
              <div className="text-xs leading-5 text-muted break-all">Para: {email.to}</div>
              {email.cc && <div className="text-xs leading-5 text-muted break-all">CC: {email.cc}</div>}
              {email.bcc && <div className="text-xs leading-5 text-muted break-all">{locale === 'es' ? 'CCO' : 'BCC'}: {email.bcc}</div>}
            </div>
          </div>
          <div className="text-xs text-muted sm:text-right shrink-0">
            {format(new Date(email.createdAt), "d 'de' MMMM, yyyy • HH:mm", { locale: dateLocale })}
            <div className="mt-1 flex gap-2 sm:justify-end">
              <span className="bg-canvas-elevated px-2 py-0.5 text-[9px] uppercase font-bold rounded-sm border border-hairline">
                {email.direction}
              </span>
              {email.direction === 'OUTBOUND' && (
                <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-sm border ${['BOUNCED', 'FAILED', 'COMPLAINED', 'SUPPRESSED'].includes(email.deliveryStatus || '') ? 'text-red-400 border-red-400/30' : email.deliveryStatus === 'DELIVERED' ? 'text-emerald-400 border-emerald-400/30' : 'text-muted border-hairline'}`}>
                  {deliveryLabel(email.deliveryStatus, locale)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-none md:flex-1 md:min-h-0 md:overflow-y-auto px-4 py-5 md:p-6 text-body">
        {email.htmlBody ? (
          <EmailHtmlFrame
            html={email.htmlBody}
            title={locale === 'es' ? `Contenido de ${email.subject || 'correo'}` : `Content of ${email.subject || 'email'}`}
          />
        ) : email.textBody ? (
          <pre className="whitespace-pre-wrap break-words font-sans text-base leading-7 md:text-sm md:leading-normal">{email.textBody}</pre>
        ) : (
          <div className="italic text-muted opacity-70">
            {locale === 'es' ? '(Este correo no tiene contenido o no se pudo cargar)' : '(This email has no content or could not be loaded)'}
          </div>
        )}

        {email.attachments?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-hairline not-prose">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-3">
              {locale === 'es' ? 'Adjuntos' : 'Attachments'} ({email.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((attachment) => {
                const available = Boolean(attachment.providerAttachmentId && email.providerEmailId);
                const content = (
                  <>
                    <span className="material-icons text-[17px] text-primary">attach_file</span>
                    <span className="truncate max-w-[220px]">{attachment.filename}</span>
                    {attachment.sizeBytes > 0 && (
                      <span className="text-muted">{formatFileSize(attachment.sizeBytes)}</span>
                    )}
                  </>
                );

                return available ? (
                  <a
                    key={attachment.id}
                    href={`/api/emails/${email.id}/attachments/${attachment.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-hairline bg-canvas-elevated rounded-sm text-xs text-ink hover:border-primary transition-colors no-underline"
                  >
                    {content}
                    <span className="material-icons text-[15px] text-muted">download</span>
                  </a>
                ) : (
                  <span
                    key={attachment.id}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-hairline bg-canvas-elevated rounded-sm text-xs text-ink"
                  >
                    {content}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reply Box */}
      {email.direction === 'INBOUND' && (
        <div className="px-4 py-5 md:p-6 border-t border-hairline bg-canvas-elevated/20 shrink-0">
          <form onSubmit={handleReply} className="max-w-4xl">
            {email.replySenderIdentity ? (
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <span className="text-muted">
                  {locale === 'es' ? 'Responder como' : 'Reply as'}:{' '}
                  <strong className="text-ink">{email.replySenderIdentity.displayName}</strong>{' '}
                  &lt;{email.replySenderIdentity.email}&gt;
                </span>
                {email.replySenderIdentity.signature && (
                  <span className="text-muted">
                    <span className="material-icons text-[14px] align-middle mr-1">draw</span>
                    {locale === 'es' ? 'Firma automática activa' : 'Automatic signature enabled'}
                  </span>
                )}
              </div>
            ) : (
              <div className="mb-3 border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-300">
                {locale === 'es'
                  ? `No hay una identidad activa configurada para ${email.to}. Agrégala en Configuración → Remitentes de correo.`
                  : `There is no active identity configured for ${email.to}. Add it under Settings → Email senders.`}
              </div>
            )}
            <textarea
              className="w-full bg-canvas border border-hairline p-3 rounded-sm min-h-[100px] focus:outline-none focus:border-primary text-sm shadow-sm"
              placeholder={locale === 'es' ? 'Escribe tu respuesta aquí...' : 'Write your reply here...'}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={!email.replySenderIdentity}
            />

            {selectedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <span
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="inline-flex items-center gap-2 max-w-full px-3 py-2 border border-hairline bg-canvas rounded-sm text-xs"
                  >
                    <span className="material-icons text-[16px] text-primary">attach_file</span>
                    <span className="truncate max-w-[220px]">{file.name}</span>
                    <span className="text-muted shrink-0">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="text-muted hover:text-red-400 transition-colors"
                      aria-label={locale === 'es' ? `Quitar ${file.name}` : `Remove ${file.name}`}
                    >
                      <span className="material-icons text-[16px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt"
                  onChange={handleFileSelection}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || selectedFiles.length >= 10 || !email.replySenderIdentity}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-hairline rounded-sm text-xs font-semibold text-muted hover:text-ink hover:border-primary transition-colors disabled:opacity-50"
                >
                  <span className="material-icons text-[17px]">attach_file</span>
                  {locale === 'es' ? 'Adjuntar archivos' : 'Attach files'}
                </button>
                <p className="mt-1 text-[10px] text-muted">
                  {locale === 'es' ? 'Máx. 10 MB por archivo · 25 MB total' : 'Max. 10 MB per file · 25 MB total'}
                </p>
              </div>
              <button
                type="submit"
                disabled={sending || !email.replySenderIdentity || (!replyText.trim() && selectedFiles.length === 0)}
                className="w-full sm:w-auto justify-center bg-primary text-on-primary px-5 py-3 sm:py-2 rounded-sm font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {sending ? (
                  <span className="material-icons animate-spin text-[16px]">refresh</span>
                ) : (
                  <span className="material-icons text-[16px]">send</span>
                )}
                {locale === 'es' ? 'Enviar Respuesta' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
