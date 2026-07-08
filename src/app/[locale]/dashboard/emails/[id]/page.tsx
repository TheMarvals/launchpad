'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from '@/i18n/routing';
import { getEmailById, replyToEmail } from '@/app/actions/emails';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function EmailDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params);
  const router = useRouter();
  
  const [email, setEmail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      await replyToEmail(id, replyText);
      setReplyText('');
      // Reload email to show REPLIED status
      const data = await getEmailById(id);
      setEmail(data);
      alert(locale === 'es' ? 'Respuesta enviada con éxito' : 'Reply sent successfully');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error sending reply');
    } finally {
      setSending(false);
    }
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-canvas">
      {/* Mobile Back Button - Only visible on small screens */}
      <div className="md:hidden p-4 border-b border-hairline flex items-center gap-3">
        <button 
          onClick={() => router.push('/dashboard/emails')}
          className="w-8 h-8 flex items-center justify-center bg-canvas-elevated hover:bg-hairline rounded-sm transition-colors shrink-0"
        >
          <span className="material-icons text-sm">arrow_back</span>
        </button>
        <h1 className="text-sm font-black truncate">{locale === 'es' ? 'Volver a Correos' : 'Back to Inbox'}</h1>
      </div>

      {/* Header */}
      <div className="p-4 md:p-6 border-b border-hairline shrink-0">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter mb-4">
          {email.subject || '(Sin asunto)'}
        </h1>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-canvas-elevated border border-hairline rounded-sm flex items-center justify-center font-bold text-ink shrink-0">
              {email.from.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-ink text-sm">{email.from}</div>
              <div className="text-xs text-muted">Para: {email.to}</div>
            </div>
          </div>
          <div className="text-xs text-muted sm:text-right shrink-0">
            {format(new Date(email.createdAt), "d 'de' MMMM, yyyy • HH:mm", { locale: dateLocale })}
            <div className="mt-1">
              <span className="bg-canvas-elevated px-2 py-0.5 text-[9px] uppercase font-bold rounded-sm border border-hairline">
                {email.direction}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 text-body prose prose-sm max-w-none">
        {email.htmlBody ? (
          <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm">{email.textBody}</pre>
        )}
      </div>

      {/* Reply Box */}
      {email.direction === 'INBOUND' && (
        <div className="p-4 md:p-6 border-t border-hairline bg-canvas-elevated/20 shrink-0">
          <form onSubmit={handleReply} className="max-w-4xl">
            <textarea
              className="w-full bg-canvas border border-hairline p-3 rounded-sm min-h-[100px] focus:outline-none focus:border-primary text-sm shadow-sm"
              placeholder={locale === 'es' ? 'Escribe tu respuesta aquí...' : 'Write your reply here...'}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="bg-primary text-on-primary px-5 py-2 rounded-sm font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
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
