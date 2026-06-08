'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getContactSubmissions, markAsRead, markAllAsRead, deleteContactSubmission } from '@/app/actions/contacts';
import Swal from 'sweetalert2';
import EmptyState from '@/components/EmptyState';

type Submission = {
  id: string;
  name: string;
  email: string;
  company: string;
  challenge: string;
  read: boolean;
  createdAt: Date;
};

export default function ContactsPage() {
  const t = useTranslations('Contacts');
  const locale = useLocale();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

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
      title: t('deleteTitle'),
      text: t('deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('deleteCancel'),
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-warning text-white',
        cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas text-muted',
      },
    });

    if (result.isConfirmed) {
      await deleteContactSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) setSelected(null);
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
        className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-[2px] transition-colors cursor-pointer ${
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
                      className="text-muted/40 hover:text-semantic-warning transition-colors p-[2px] opacity-0 group-hover:opacity-100"
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
        <div className="border border-hairline bg-canvas-elevated p-lg min-h-[300px]">
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

              <div className="flex gap-xxs pt-xs border-t border-hairline">
                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center gap-xxs bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors"
                >
                  <span className="material-icons text-sm">reply</span>
                  {t('reply')}
                </a>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="flex items-center gap-xxs px-sm py-xxs font-semibold text-xs uppercase tracking-wider text-muted hover:text-semantic-warning transition-colors cursor-pointer"
                >
                  <span className="material-icons text-sm">delete</span>
                  {t('delete')}
                </button>
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
