'use client';

import { useState } from 'react';
import { createNote, updateNote, deleteNote } from '@/app/actions/productivity';
import { useTranslations, useLocale } from 'next-intl';
import Swal from 'sweetalert2';
import NoteModal from './NoteModal';
import EmptyState from '@/components/EmptyState';

interface Note {
  id: string;
  title: string;
  content: string | null;
  color: string;
  category: string | null;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
}

export default function NotesBoard({ initialNotes, currentUserId }: { initialNotes: any[], currentUserId: string }) {
  const t = useTranslations('Notes');
  const locale = useLocale();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: any) => {
    if (editingNote) {
      const updated = await updateNote(editingNote.id, formData);
      setNotes(notes.map(n => n.id === editingNote.id ? (updated as any) : n));
    } else {
      const newNote = await createNote(formData);
      setNotes([newNote as any, ...notes]);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: t('delete.title'),
      text: t('delete.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0a041a',
      cancelButtonColor: '#f3f4f6',
      confirmButtonText: t('delete.confirm'),
      cancelButtonText: t('delete.cancel'),
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        cancelButton: 'px-sm py-xs font-semibold text-muted uppercase tracking-wider text-xs border border-transparent bg-canvas'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteNote(id);
        setNotes(notes.filter(n => n.id !== id));
      } catch (err) {
        Swal.fire('Error', t('delete.error'), 'error');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h1>
          <p className="text-body text-muted mt-1">{t('subtitle')}</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-primary text-on-primary px-sm py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center justify-center border border-transparent group"
        >
          <span className="material-icons mr-2 text-[20px] group-hover:rotate-90 transition-transform">add</span> 
          {t('newNote')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {notes.length === 0 ? (
          <div className="col-span-full bg-canvas-elevated border border-hairline">
            <EmptyState variant="note" title={t('emptyTitle')} message={t('emptyMessage')} />
          </div>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id} 
              className="group bg-canvas-elevated p-sm border border-hairline hover:border-ink transition-all flex flex-col h-[350px] relative overflow-hidden"
            >
              {/* Acciones Rápidas (Hover) */}
              {note.userId === currentUserId && (
                <div className="absolute top-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(note); }}
                    className="w-10 h-10 border border-hairline bg-canvas flex items-center justify-center text-muted hover:text-primary transition-all"
                  >
                    <span className="material-icons text-[18px]">edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="w-10 h-10 border border-hairline bg-canvas flex items-center justify-center text-muted hover:text-primary transition-all"
                  >
                    <span className="material-icons text-[18px]">delete</span>
                  </button>
                </div>
              )}

              {/* Tag & Color */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-1 rounded-none" style={{ backgroundColor: note.color || '#da291c' }} />
                  <span className="text-caption-uppercase text-muted">
                    {note.category || 'General'}
                  </span>
                </div>
                <div className="text-muted flex items-center" title={note.isPublic ? 'Pública' : 'Privada'}>
                  <span className="material-icons text-[16px]">{note.isPublic ? 'public' : 'lock'}</span>
                </div>
              </div>

              {/* Content */}
              <div 
                className={`flex-grow overflow-hidden ${note.userId === currentUserId ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (note.userId === currentUserId) handleOpenEdit(note);
                }}
              >
                <h3 className="text-title-sm font-medium uppercase text-ink mb-4 line-clamp-2">
                  {note.title}
                </h3>
                <p className="text-body text-muted line-clamp-6 whitespace-pre-wrap">
                  {note.content || t('noContent')}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-xs border-t border-hairline flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-caption-uppercase text-muted mb-1">{t('modified')}</span>
                  <span className="text-xs text-ink font-medium">{new Date(note.updatedAt).toLocaleDateString(locale)}</span>
                </div>
                <div className="w-10 h-10 border border-hairline bg-canvas flex items-center justify-center text-muted">
                  <span className="material-icons text-[20px]">bookmark_border</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingNote || undefined}
        title={editingNote ? t('editNote') : t('newNote')}
      />
    </div>
  );
}
