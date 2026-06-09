'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getPartners, createPartner, updatePartner, deletePartner } from '@/app/actions/partners';
import { reorderItems } from '@/app/actions/reorder';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';
import EmptyState from '@/components/EmptyState';

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function PartnersManager() {
  const t = useTranslations('Settings.partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');

  const loadPartners = useCallback(async () => {
    setLoading(true);
    const data = await getPartners();
    setPartners(data as unknown as Partner[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const openNewForm = () => {
    setEditingPartner(null);
    setLogoUrlInput('');
    setShowForm(true);
  };

  const openEditForm = (partner: Partner) => {
    setEditingPartner(partner);
    setLogoUrlInput(partner.logoUrl);
    setShowForm(true);
  };

  const handleUploadLogo = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) return data.url;
      console.error('Upload failed:', data);
      return null;
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const websiteUrl = formData.get('websiteUrl') as string;
    let logoUrl = formData.get('logoUrl') as string;

    if (!name.trim() || !logoUrl.trim()) return;

    if (editingPartner) {
      await updatePartner(editingPartner.id, {
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
      });
    } else {
      await createPartner({
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
      });
    }

    setShowForm(false);
    setEditingPartner(null);
    setLogoUrlInput('');
    loadPartners();
  };

  const handleDelete = async (partner: Partner) => {
    const confirm = await Swal.fire({
      title: t('deleteConfirm'),
      text: partner.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('deleteYes'),
      cancelButtonText: t('cancel'),
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
        confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-semantic-danger text-white',
        cancelButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-hairline text-ink',
      },
    });

    if (!confirm.isConfirmed) return;
    await deletePartner(partner.id);
    loadPartners();
  };

  const handleToggleActive = async (partner: Partner) => {
    await updatePartner(partner.id, { isActive: !partner.isActive });
    loadPartners();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = partners.findIndex(p => p.id === active.id);
    const newIndex = partners.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic UI update
    const reordered = arrayMove(partners, oldIndex, newIndex);
    setPartners(reordered);

    // Persist via server action
    const current = partners[oldIndex];
    const target = partners[newIndex];
    await reorderItems('partner', current.id, target.id, [
      { path: '/dashboard/settings' },
      { path: '/', type: 'layout' },
    ]);
  };

  // Extract a SortablePartnerRow sub-component
  function SortablePartnerRow({ partner, t, onToggleActive, onEdit, onDelete }: {
    partner: Partner;
    t: (key: string, values?: any) => string;
    onToggleActive: (p: Partner) => void;
    onEdit: (p: Partner) => void;
    onDelete: (p: Partner) => void;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: partner.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : undefined,
      position: 'relative' as const,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-sm p-sm hover:bg-canvas/50 transition-colors" {...attributes}>
        {/* Drag handle */}
        <button
          {...listeners}
          className="w-[28px] h-[28px] flex items-center justify-center text-muted hover:text-ink cursor-grab active:cursor-grabbing shrink-0 touch-none"
          title={t('dragHandle')}
        >
          <span className="material-icons text-sm">drag_indicator</span>
        </button>

        {/* Logo thumbnail */}
        <div className="w-[60px] h-[40px] bg-canvas border border-hairline flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={partner.logoUrl}
            alt={partner.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-xxs">
            <span className="font-medium text-ink text-sm truncate">{partner.name}</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-[1px] ${partner.isActive ? 'text-semantic-success bg-semantic-success/10' : 'text-muted bg-canvas'}`}>
              {partner.isActive ? t('active') : t('inactive')}
            </span>
          </div>
          {partner.websiteUrl && (
            <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-primary truncate block mt-[2px]">
              {partner.websiteUrl}
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-xxs shrink-0">
          <button
            onClick={() => onToggleActive(partner)}
            className={`w-[32px] h-[32px] flex items-center justify-center transition-colors cursor-pointer ${partner.isActive ? 'text-semantic-warning hover:text-semantic-danger' : 'text-muted hover:text-semantic-success'}`}
            title={partner.isActive ? t('hide') : t('show')}
          >
            <span className="material-icons text-sm">{partner.isActive ? 'visibility_off' : 'visibility'}</span>
          </button>
          <button
            onClick={() => onEdit(partner)}
            className="w-[32px] h-[32px] flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
            title={t('edit')}
          >
            <span className="material-icons text-sm">edit</span>
          </button>
          <button
            onClick={() => onDelete(partner)}
            className="w-[32px] h-[32px] flex items-center justify-center text-muted hover:text-semantic-danger transition-colors cursor-pointer"
            title={t('delete')}
          >
            <span className="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[56rem] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('title')}</h1>
          <p className="text-body text-muted text-sm mt-[2px]">{t('subtitle')}</p>
        </div>
        <button
          onClick={openNewForm}
          className="bg-primary text-on-primary px-sm h-[40px] text-xs font-bold uppercase tracking-wider border border-transparent hover:bg-primary-hover transition-colors cursor-pointer"
        >
          + {t('newPartner')}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-lg">
          <div className="bg-canvas-elevated border border-hairline w-full max-w-[500px] p-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-sm">
              <h2 className="text-title-sm font-medium text-ink">{editingPartner ? t('editPartner') : t('newPartner')}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink cursor-pointer">
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-sm">
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.name')} *</label>
                <input
                  name="name"
                  defaultValue={editingPartner?.name || ''}
                  required
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                  placeholder={t('form.namePlaceholder')}
                />
              </div>

              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.logoUrl')}</label>
                <div className="flex gap-xxs">
                  <input
                    name="logoUrl"
                    value={logoUrlInput}
                    onChange={(e) => setLogoUrlInput(e.target.value)}
                    className="flex-grow border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                    placeholder="https://... or upload"
                    required
                  />
                  <label className="cursor-pointer bg-canvas border border-hairline px-xs py-xxs text-xs text-muted hover:text-ink hover:border-primary/30 transition-colors flex items-center gap-xxs">
                    <span className="material-icons text-sm">{uploading ? 'sync' : 'cloud_upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleUploadLogo(file);
                          if (url) setLogoUrlInput(url);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {logoUrlInput && (
                  <div className="mt-xxs w-[60px] h-[30px] border border-hairline bg-canvas flex items-center justify-center overflow-hidden">
                    <img src={logoUrlInput} alt="" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('form.websiteUrl')}</label>
                <input
                  name="websiteUrl"
                  defaultValue={editingPartner?.websiteUrl || ''}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-xxs pt-xs border-t border-hairline">
                <button type="button" onClick={() => setShowForm(false)} className="px-sm h-[40px] text-xs font-bold uppercase tracking-wider border border-hairline text-ink hover:bg-canvas cursor-pointer">
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading || !logoUrlInput.trim()}
                  className="px-sm h-[40px] text-xs font-bold uppercase tracking-wider bg-primary text-on-primary border border-transparent hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t('form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partners List */}
      {loading ? (
        <div className="text-center py-xl text-muted">{t('loading')}</div>
      ) : partners.length === 0 ? (
        <EmptyState variant="people" message={t('empty')} />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={partners.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-canvas-elevated border border-hairline overflow-hidden">
              <div className="divide-y divide-hairline">
                {partners.map((partner, index) => (
                  <div key={partner.id} className="animate-fade-in hover:scale-[1.01] transition-all duration-200" style={{ animationDelay: `${index * 0.1}s` }}>
                    <SortablePartnerRow
                      partner={partner}
                      t={t}
                      onToggleActive={handleToggleActive}
                      onEdit={openEditForm}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
