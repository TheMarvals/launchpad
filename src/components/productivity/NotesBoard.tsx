'use client';

import { useState } from 'react';
import { createNote, updateNote, deleteNote } from '@/app/actions/productivity';
import { useTranslations, useLocale } from 'next-intl';
import Swal from 'sweetalert2';
import NoteModal from './NoteModal';

interface Note {
  id: string;
  title: string;
  content: string | null;
  color: string;
  category: string | null;
  updatedAt: Date;
}

export default function NotesBoard({ initialNotes }: { initialNotes: any[] }) {
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
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold text-gray-500'
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
          <h1 className="text-3xl font-black tracking-tight text-[#0a041a]">{t('title')}</h1>
          <p className="text-gray-400 font-medium mt-1">{t('subtitle')}</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#0a041a] text-white px-8 py-4 rounded-[1.5rem] font-bold text-sm hover:shadow-2xl hover:shadow-[#0a041a]/30 transition-all flex items-center justify-center group"
        >
          <span className="material-icons mr-2 text-[20px] group-hover:rotate-90 transition-transform">add</span> 
          {t('newNote')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {notes.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <span className="material-icons text-4xl text-gray-200">description</span>
            </div>
            <p className="text-gray-400 font-bold text-xl">{t('emptyTitle')}</p>
            <p className="text-gray-300 mt-2">{t('emptyMessage')}</p>
          </div>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id} 
              className="group bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col h-[350px] relative overflow-hidden"
            >
              {/* Acciones Rápidas (Hover) */}
              <div className="absolute top-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                <button 
                  onClick={() => handleOpenEdit(note)}
                  className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all"
                >
                  <span className="material-icons text-[18px]">edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(note.id)}
                  className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
                >
                  <span className="material-icons text-[18px]">delete</span>
                </button>
              </div>

              {/* Tag & Color */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: note.color || '#3b82f6' }} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-300">
                  {note.category || 'General'}
                </span>
              </div>

              {/* Content */}
              <div 
                className="flex-grow overflow-hidden cursor-pointer"
                onClick={() => handleOpenEdit(note)}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight">
                  {note.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-6 whitespace-pre-wrap leading-relaxed">
                  {note.content || t('noContent')}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-gray-300 font-bold">{t('modified')}</span>
                  <span className="text-[11px] text-gray-400 font-medium">{new Date(note.updatedAt).toLocaleDateString(locale)}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-200">
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
