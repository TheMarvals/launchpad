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
      router.push('/dashboard/emails');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error sending reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Cargando...</div>;
  }

  if (!email) {
    return <div className="p-8 text-center text-red-500">{error || 'Email no encontrado'}</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => router.push('/dashboard/emails')}
          className="w-10 h-10 flex items-center justify-center bg-canvas-elevated hover:bg-hairline rounded-sm transition-colors"
        >
          <span className="material-icons">arrow_back</span>
        </button>
        <h1 className="text-2xl font-black tracking-tighter truncate">
          {email.subject || '(Sin asunto)'}
        </h1>
      </div>

      <div className="bg-canvas border border-hairline rounded-sm shadow-sm overflow-hidden mb-6">
        <div className="p-4 md:p-6 border-b border-hairline bg-canvas-elevated/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="font-bold text-ink">{email.from}</div>
            <div className="text-sm text-muted">Para: {email.to}</div>
          </div>
          <div className="text-sm text-muted shrink-0 text-right">
            {format(new Date(email.createdAt), "d 'de' MMMM, yyyy • HH:mm", { locale: dateLocale })}
            <div className="mt-1">
              <span className="bg-canvas-elevated px-2 py-1 text-[10px] uppercase font-bold rounded-sm border border-hairline">
                {email.direction}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 text-body prose prose-sm max-w-none">
          {email.htmlBody ? (
            <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">{email.textBody}</pre>
          )}
        </div>
      </div>

      {email.direction === 'INBOUND' && (
        <div className="bg-canvas border border-hairline rounded-sm shadow-sm p-4 md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted mb-4">
            {locale === 'es' ? 'Responder' : 'Reply'}
          </h2>
          <form onSubmit={handleReply}>
            <textarea
              className="w-full bg-canvas-elevated border border-hairline p-4 rounded-sm min-h-[150px] focus:outline-none focus:border-primary text-sm"
              placeholder={locale === 'es' ? 'Escribe tu respuesta aquí...' : 'Write your reply here...'}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="bg-primary text-on-primary px-6 py-2 rounded-sm font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <span className="material-icons animate-spin text-sm">refresh</span>
                ) : (
                  <span className="material-icons text-sm">send</span>
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
