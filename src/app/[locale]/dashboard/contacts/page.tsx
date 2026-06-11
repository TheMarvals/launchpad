'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getContactSubmissions, markAsRead, markAllAsRead, deleteContactSubmission, replyToContactSubmission } from '@/app/actions/contacts';
import Swal from 'sweetalert2';
import { swalTheme, swalDangerTheme } from '@/lib/swal-theme';
import EmptyState from '@/components/EmptyState';

type ContactReply = {
  id: string;
  subject: string | null;
  message: string;
  sentBy: string;
  createdAt: Date;
};

type Submission = {
  id: string;
  name: string;
  email: string;
  company: string;
  challenge: string;
  read: boolean;
  createdAt: Date;
  replies?: ContactReply[];
};

export default function ContactsPage() {
  const t = useTranslations('Contacts');
  const locale = useLocale();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  
  const [replyMode, setReplyMode] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const data = await getContactSubmissions();
    setSubmissions(data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, read: true } : s))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setSubmissions((prev) =>
      prev.map((s) => ({ ...s, read: true }))
    );
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      ...swalDangerTheme,
      title: t('deleteTitle'),
      text: t('deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('deleteCancel'),
    });

    if (result.isConfirmed) {
      await deleteContactSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  };

  const handleSendReply = async () => {
    if (!selected || !replySubject.trim() || !replyMessage.trim()) return;
    setSendingReply(true);
    const result = await replyToContactSubmission(selected.id, replySubject, replyMessage);
    setSendingReply(false);
    
    if (result.success && result.reply) {
      await Swal.fire({
        ...swalTheme,
        title: t('replySuccess'),
        icon: 'success',
      });
      setReplyMode(false);
      
      const newReply = result.reply as ContactReply;
      
      setSelected(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          replies: [...(prev.replies || []), newReply]
        };
      });

      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === selected.id 
            ? { ...sub, replies: [...(sub.replies || []), newReply], read: true }
            : sub
        )
      );
    } else {
      await Swal.fire({
        ...swalDangerTheme,
        title: t('replyError'),
        text: result.error,
        icon: 'error',
      });
    }
  };

  // Sorting state
  const [sortField, setSortField] = useState<'date' | 'name' | 'read'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'date' | 'name' | 'read') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'date' ? 'desc' : 'asc');
    }
  };

  const sortedSubmissions = useMemo(() => {
    const sorted = [...submissions];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'read') {
        cmp = Number(a.read) - Number(b.read);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [submissions, sortField, sortDir]);

  const SortButton = ({ field, label }: { field: 'date' | 'name' | 'read'; label: string }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`px-xs py-xs text-[9px] font-bold uppercase tracking-widest flex items-center gap-[2px] transition-colors cursor-pointer ${
          isActive ? 'text-ink' : 'text-muted hover:text-ink'
        }`}
      >
        {label}
        {isActive && (
          <span className="material-icons text-[12px]">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
        )}
      </button>
    );
  };

  const unread = submissions.filter((s) => !s.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm">
        <div>
          <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">
            {t('title')}
          </h1>
          <p className="text-body text-muted text-sm mt-[2px]">
            {t('subtitle', { count: submissions.length })}
          </p>
        </div>
        <div className="flex items-center gap-xs">
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-semibold uppercase tracking-widest text-primary hover:text-primary-hover transition-colors flex items-center gap-xxs cursor-pointer"
            >
              <span className="material-icons text-sm">mark_email_read</span>
              {t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      {/* Unread badge */}
      {unread > 0 && (
        <div className="bg-primary/10 border border-primary/20 px-sm py-xxs flex items-center gap-xxs">
          <span className="material-icons text-primary text-sm">markunread</span>
          <p className="text-xs text-primary font-semibold">
            {t('unread', { count: unread })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Submissions list */}
        <div className="space-y-xxs">
          {/* Sort controls */}
          <div className="flex items-center gap-sm px-xs py-xxs border-b border-hairline">
            <SortButton field="date" label={t('date')} />
            <SortButton field="name" label={t('name')} />
            <SortButton field="read" label={t('read')} />
          </div>
          <div className="max-h-[68vh] overflow-y-auto pr-xs space-y-xxs">
          {loading ? (
            <div className="text-center py-xl text-muted text-sm">{t('loading')}</div>
          ) : submissions.length === 0 ? (
            <EmptyState variant="mail" message={t('empty')} compact />
          ) : (
            sortedSubmissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelected(sub);
                  setReplyMode(false);
                  if (!sub.read) handleMarkRead(sub.id);
                }}
                className={`w-full text-left p-sm border transition-all duration-200 cursor-pointer group ${
                  selected?.id === sub.id
                    ? 'border-primary bg-primary/5'
                    : sub.read
                    ? 'border-hairline bg-canvas-elevated/50'
                    : 'border-hairline bg-canvas-elevated'
                }`}
              >
                <div className="flex items-start justify-between gap-xxs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-xxs">
                      {!sub.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-[5px]" />
                      )}
                      <h3 className={`text-sm truncate ${
                        sub.read ? 'text-ink/70' : 'text-ink font-semibold'
                      }`}>
                        {sub.name}
                      </h3>
                    </div>
                    <p className="text-xs text-muted mt-[2px] truncate">{sub.company}</p>
                    <p className="text-xs text-muted/60 mt-[2px]">{sub.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-xxs shrink-0">
                    <span className="text-[9px] text-muted/50 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sub.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-muted/40 hover:text-semantic-warning transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      title={t('deleteTitle')}
                    >
                      <span className="material-icons text-xs">delete</span>
                    </button>
                  </div>
                </div>
                {sub.challenge && (
                  <p className="text-xs text-muted/50 mt-xxs line-clamp-2">
                    {sub.challenge}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
        </div>

        {/* Detail panel */}
        <div className="border border-hairline bg-canvas-elevated p-sm md:p-lg min-h-[300px]">
          {selected ? (
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">{selected.name}</h2>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-xxs py-[1px] ${
                  selected.read
                    ? 'bg-muted/10 text-muted'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {selected.read ? t('read') : t('new')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-sm border-b border-hairline pb-sm">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted font-bold">
                    {t('company')}
                  </p>
                  <p className="text-sm text-ink font-medium mt-[2px]">
                    {selected.company}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted font-bold">
                    {t('email')}
                  </p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm text-primary hover:text-primary-hover transition-colors mt-[2px] block"
                  >
                    {selected.email}
                  </a>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted font-bold">
                    {t('date')}
                  </p>
                  <p className="text-sm text-ink mt-[2px]">
                    {new Date(selected.createdAt).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-xxs">
                  {t('challenge')}
                </p>
                <div className="p-xs border border-hairline bg-canvas">
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {selected.challenge}
                  </p>
                </div>
              </div>

              {/* Conversation Thread */}
              {selected.replies && selected.replies.length > 0 && (
                <div className="space-y-sm pt-sm border-t border-hairline mt-sm">
                  <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-xxs">
                    Historial
                  </p>
                  <div className="bg-canvas-elevated/50 rounded-2xl border border-hairline p-sm mt-xs">
                    <div className="space-y-md">
                      {selected.replies.map(reply => {
                        const isAdmin = reply.sentBy === 'ADMIN';
                        return (
                          <div key={reply.id} className="flex gap-sm group">
                            <div className="shrink-0 mt-1">
                              {isAdmin ? (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold shadow-sm" title="Staff">
                                  N
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-canvas-elevated flex items-center justify-center border border-hairline text-ink font-bold shadow-sm" title="Cliente">
                                  C
                                </div>
                              )}
                            </div>
                            
                            <div className={`flex-1 ${isAdmin ? 'bg-primary/5 border-primary/20' : 'bg-canvas-elevated border-hairline'} border rounded-2xl rounded-tl-sm p-sm shadow-sm hover:shadow-md transition-shadow`}>
                              <div className="flex flex-wrap justify-between items-center mb-xs gap-2">
                                <div className="flex items-center gap-xxs">
                                  <span className="text-sm font-semibold text-ink">
                                    {isAdmin ? 'Nosotros' : 'Cliente'}
                                  </span>
                                  {isAdmin && (
                                    <span className="bg-primary/10 text-primary px-xxs py-[2px] rounded-md text-[10px] font-bold uppercase tracking-wider">
                                      Staff
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted/70 group-hover:text-muted transition-colors">
                                  {new Date(reply.createdAt).toLocaleDateString(locale, {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {reply.subject && <p className="text-[10px] font-medium text-ink/70 mb-xxs">Asunto: {reply.subject}</p>}
                              <p className="text-sm text-body leading-relaxed whitespace-pre-wrap break-words">{reply.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-xxs pt-xs border-t border-hairline">
                {!replyMode ? (
                  <>
                    <button
                      onClick={() => {
                        setReplySubject(`Re: Strategy Audit - ${selected.company}`);
                        setReplyMessage('');
                        setReplyMode(true);
                      }}
                      className="flex items-center gap-xxs bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors cursor-pointer"
                    >
                      <span className="material-icons text-sm">reply</span>
                      {t('reply')}
                    </button>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="flex items-center gap-xxs px-sm py-xs font-semibold text-xs uppercase tracking-wider text-muted hover:text-semantic-warning transition-colors cursor-pointer"
                    >
                      <span className="material-icons text-sm">delete</span>
                      {t('delete')}
                    </button>
                  </>
                ) : (
                  <div className="w-full space-y-sm">
                    <div className="space-y-xxs">
                      <label className="text-[9px] uppercase tracking-widest text-muted font-bold">{t('replySubject')}</label>
                      <input 
                        type="text" 
                        value={replySubject} 
                        onChange={e => setReplySubject(e.target.value)} 
                        className="w-full border border-hairline bg-canvas-elevated/50 text-ink px-sm py-[10px] text-sm rounded-xl focus:border-primary/40 focus:ring-1 focus:ring-primary/40 outline-none transition-shadow shadow-sm" 
                      />
                    </div>
                    <div className="space-y-xxs">
                      <label className="text-[9px] uppercase tracking-widest text-muted font-bold">{t('replyMessage')}</label>
                      <textarea 
                        rows={6} 
                        value={replyMessage} 
                        onChange={e => setReplyMessage(e.target.value)} 
                        className="w-full border border-hairline bg-canvas-elevated/50 text-ink px-sm py-[10px] text-sm rounded-xl focus:border-primary/40 focus:ring-1 focus:ring-primary/40 outline-none resize-none transition-shadow shadow-sm" 
                      />
                    </div>
                    <div className="flex justify-end gap-xs pt-xs">
                      <button 
                        onClick={() => setReplyMode(false)}
                        disabled={sendingReply}
                        className="px-sm h-10 text-xs font-bold uppercase tracking-wider rounded-xl text-ink hover:bg-canvas transition-colors cursor-pointer disabled:opacity-50 shadow-sm border border-hairline"
                      >
                        {t('cancelReply')}
                      </button>
                      <button 
                        onClick={handleSendReply}
                        disabled={sendingReply || !replySubject.trim() || !replyMessage.trim()}
                        className="flex items-center gap-xxs px-md h-10 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-on-primary hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
                      >
                        {sendingReply ? <span className="material-icons text-sm animate-spin">sync</span> : <span className="material-icons text-sm">send</span>}
                        {sendingReply ? t('replying') : t('sendReply')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-xl">
              <span className="material-icons text-4xl text-muted/20 mb-xs">mail_outline</span>
              <p className="text-sm text-muted">{t('selectMessage')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
