'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getShowcaseProjects, createShowcaseProject, updateShowcaseProject, deleteShowcaseProject, addShowcaseImage, deleteShowcaseImage, setFeaturedImage } from '@/app/actions/showcase';
import { reorderItems } from '@/app/actions/reorder';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';
import { swalTheme, swalDangerTheme } from '@/lib/swal-theme';

interface Image {
  id: string;
  url: string;
  caption: string | null;
  isFeatured: boolean;
  order: number;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  category: string;
  technologies: string | null;
  clientName: string | null;
  projectUrl: string | null;
  order: number;
  isActive: boolean;
  images: Image[];
}

export default function ShowcaseManager() {
  const t = useTranslations('Showcase');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const data = await getShowcaseProjects();
    const typedData = data as unknown as Project[];
    setProjects(typedData);
    
    // Auto-update currently open editing project data
    setEditingProject((prev) => {
      if (!prev) return null;
      const updated = typedData.find((p) => p.id === prev.id);
      return updated || null;
    });

    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const descriptionEs = (formData.get('descriptionEs') as string).trim();
    const descriptionEn = (formData.get('descriptionEn') as string).trim();

    // Require at least one description
    if (!descriptionEs && !descriptionEn) {
      await Swal.fire({
        ...swalTheme,
        title: t('validation.descriptionRequired'),
        icon: 'warning',
        confirmButtonText: t('ok') || 'OK',
      });
      return;
    }

    const data = {
      title: formData.get('title') as string,
      description: descriptionEs,
      descriptionEs,
      descriptionEn,
      category: formData.get('category') as string,
      technologies: formData.get('technologies') as string,
      clientName: formData.get('clientName') as string,
      projectUrl: formData.get('projectUrl') as string,
    };

    if (editingProject) {
      await updateShowcaseProject(editingProject.id, data);
    } else {
      await createShowcaseProject(data);
    }

    setShowForm(false);
    setEditingProject(null);
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      ...swalDangerTheme,
      title: t('deleteConfirm'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('deleteYes') || 'Sí, eliminar',
      cancelButtonText: t('cancel') || 'Cancelar',
    });
    if (result.isConfirmed) {
      await deleteShowcaseProject(id);
      loadProjects();
    }
  };

  const handleToggleActive = async (project: Project) => {
    await updateShowcaseProject(project.id, { isActive: !project.isActive });
    loadProjects();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex(p => p.id === active.id);
    const newIndex = projects.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic UI update
    const reordered = arrayMove(projects, oldIndex, newIndex);
    setProjects(reordered);

    // Persist via server action
    const current = projects[oldIndex];
    const target = projects[newIndex];
    await reorderItems('showcaseProject', current.id, target.id, [
      { path: '/dashboard/settings' },
      { path: '/dashboard/showcase' },
      { path: '/', type: 'layout' },
    ]);
  };

  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleUploadImage = async (projectId: string, file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        // Auto-generate caption from image metadata + filename
        const project = projects.find(p => p.id === projectId);
        const fileName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const metaCaption = `${data.format?.toUpperCase() || ''}${data.width && data.height ? ` ${data.width}×${data.height}` : ''}`.trim();
        const caption = project
          ? `${project.title} — ${fileName || metaCaption || 'Screenshot'}`
          : (fileName || metaCaption || undefined);

        await addShowcaseImage(projectId, { 
          url: data.url, 
          caption,
          imageMetadata: { format: data.format, width: data.width, height: data.height, colors: data.colors },
        });
        loadProjects();
      } else {
        console.error('Upload failed:', data);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = async (projectId: string) => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setUploading(true);
    try {
      // Generate caption from project context when pasting URL
      const project = projects.find(p => p.id === projectId);
      const caption = project ? `${project.title} — Screenshot` : undefined;

      await addShowcaseImage(projectId, { url, caption });
      setImageUrlInput('');
      loadProjects();
    } catch (err) {
      console.error('Failed to add image URL', err);
    } finally {
      setUploading(false);
    }
  };

  const CATEGORIES = ['web', 'branding', 'infra', 'video', 'app', 'design'];

  // Extract a SortableShowcaseCard sub-component
  function SortableShowcaseCard({ project, t, onEdit, onDelete, onToggleActive }: {
    project: Project;
    t: (key: string, values?: any) => string;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : undefined,
      position: 'relative' as const,
      zIndex: isDragging ? 50 : undefined,
    };

    const featured = project.images.find((img) => img.isFeatured) || project.images[0];

    return (
      <div ref={setNodeRef} style={style} className="bg-canvas-elevated border border-hairline overflow-hidden group hover:border-primary/30 transition-colors" {...attributes}>
        {/* Image preview */}
        <div className="aspect-video bg-canvas relative overflow-hidden">
          {featured ? (
            <img src={featured.url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <span className="material-icons text-4xl">image</span>
            </div>
          )}
          {/* Status badge */}
          <span className={`absolute top-xxs right-xxs px-xxs py-[2px] text-[9px] font-bold uppercase tracking-wider border ${project.isActive ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/30' : 'bg-canvas-elevated text-muted border-hairline'}`}>
            {project.isActive ? t('active') : t('inactive')}
          </span>
          {/* Image count */}
          <span className="absolute bottom-xxs left-xxs bg-ink/60 text-white text-[10px] px-xxs py-[2px] flex items-center gap-[2px]">
            <span className="material-icons text-[12px]">collections</span>
            {project.images.length}
          </span>
        </div>

        {/* Info */}
        <div className="p-sm">
          <div className="flex items-start justify-between mb-xxs">
            <h3 className="font-medium text-ink text-sm truncate">{project.title}</h3>
            <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px] shrink-0 ml-xxs">{t(`categories.${project.category}`)}</span>
          </div>
          {project.clientName && (
            <p className="text-xs text-muted mb-xxs">{project.clientName}</p>
          )}
          {(project.descriptionEs || project.description) && (
            <p className="text-xs text-muted/70 line-clamp-2 mb-xs">{project.descriptionEs || project.description}</p>
          )}
          {project.technologies && (
            <div className="flex flex-wrap gap-xxxs mb-xs">
              {project.technologies.split(',').map((tech) => (
                <span key={tech.trim()} className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[1px]">{tech.trim()}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-xxs border-t border-hairline">
            <div className="flex items-center gap-xxs">
              {/* Drag handle */}
              <button
                {...listeners}
                className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink cursor-grab active:cursor-grabbing shrink-0 touch-none"
                title={t('dragHandle')}
              >
                <span className="material-icons text-sm">drag_indicator</span>
              </button>
              <button
                onClick={onEdit}
                className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-[2px] cursor-pointer py-[10px]"
              >
                <span className="material-icons text-sm">edit</span>
                {t('edit')}
              </button>
              <button
                onClick={onDelete}
                className="text-xs text-muted hover:text-semantic-danger transition-colors flex items-center gap-[2px] cursor-pointer py-[10px]"
              >
                <span className="material-icons text-sm">delete</span>
                {t('delete')}
              </button>
            </div>
            <button
              onClick={onToggleActive}
              className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-[2px] cursor-pointer transition-colors py-[10px] ${project.isActive ? 'text-semantic-warning hover:text-semantic-danger' : 'text-semantic-success hover:text-semantic-success/80'}`}
            >
              <span className="material-icons text-sm">{project.isActive ? 'visibility_off' : 'visibility'}</span>
              {project.isActive ? t('hide') : t('show')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-sm">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setEditingProject(null); setShowForm(true); }}
          className="bg-primary text-on-primary px-sm h-[48px] text-xs font-bold uppercase tracking-[1.4px] flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:bg-primary-hover"
        >
          + {t('newProject')}
        </button>
      </div>

      {/* Project Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-sm md:p-lg">
          <div className="bg-canvas-elevated border border-hairline w-full max-w-[600px] max-h-[85vh] overflow-y-auto p-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-sm">
              <h2 className="text-title-sm font-medium text-ink">{editingProject ? t('editProject') : t('newProject')}</h2>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink cursor-pointer">
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                <div className="md:col-span-2 space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('form.title')} *</label>
                  <input name="title" defaultValue={editingProject?.title || ''} required className="w-full border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none" placeholder={t('form.titlePlaceholder')} />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-sm">
                  <div className="space-y-xxs">
                    <label className="text-caption-uppercase text-ink font-semibold">{t('form.descriptionEs')}</label>
                    <textarea name="descriptionEs" defaultValue={editingProject?.descriptionEs || editingProject?.description || ''} rows={3} className="w-full border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none resize-none" placeholder={t('form.descriptionPlaceholder')} />
                  </div>
                  <div className="space-y-xxs">
                    <label className="text-caption-uppercase text-ink font-semibold">{t('form.descriptionEn')}</label>
                    <textarea name="descriptionEn" defaultValue={editingProject?.descriptionEn || ''} rows={3} className="w-full border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none resize-none" placeholder={t('form.descriptionPlaceholder')} />
                  </div>
                </div>

                <div className="space-y-xxs">
                  <label className="block text-caption-uppercase text-ink font-semibold">{t('form.category')}</label>
                  <div className="relative">
                    <select name="category" defaultValue={editingProject?.category || 'web'} className="w-full border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none appearance-none cursor-pointer pr-sm">
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                      ))}
                    </select>
                    <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
                  </div>
                </div>

                <div className="space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('form.clientName')}</label>
                  <input name="clientName" defaultValue={editingProject?.clientName || ''} className="w-full border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none" placeholder={t('form.clientPlaceholder')} />
                </div>

                <div className="space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('form.technologies')}</label>
                  <input name="technologies" defaultValue={editingProject?.technologies || ''} className="w-full border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none" placeholder={t('form.techPlaceholder')} />
                </div>

                <div className="space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('form.projectUrl')}</label>
                  <input name="projectUrl" defaultValue={editingProject?.projectUrl || ''} className="w-full border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none" placeholder="https://..." />
                </div>
              </div>

              <div className="flex justify-end gap-xxs pt-xs border-t border-hairline">
                <button type="button" onClick={() => setShowForm(false)} className="px-sm h-[44px] text-xs font-bold uppercase tracking-wider border border-hairline text-ink hover:bg-canvas cursor-pointer">{t('form.cancel')}</button>
                <button type="submit" className="px-sm h-[44px] text-xs font-bold uppercase tracking-wider bg-primary text-on-primary border border-transparent hover:bg-primary-hover cursor-pointer">{t('form.save')}</button>
              </div>
            </form>

            {/* Image gallery for existing projects */}
            {editingProject && (
              <div className="mt-sm pt-sm border-t border-hairline">
                <h3 className="text-caption-uppercase text-ink font-semibold mb-xs">{t('images.title')}</h3>

                {/* File upload */}
                <label className="flex items-center justify-center border-2 border-dashed border-hairline p-sm cursor-pointer hover:border-primary/50 transition-colors mb-xs">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImage(editingProject.id, file);
                      e.target.value = '';
                    }}
                  />
                  <div className="flex items-center gap-xxs text-sm text-muted">
                    <span className="material-icons text-[20px]">{uploading ? 'sync' : 'cloud_upload'}</span>
                    {uploading ? t('images.uploading') : t('images.upload')}
                  </div>
                </label>

                {/* URL input */}
                <div className="flex gap-xxs mb-xs">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://... (paste image URL)"
                    className="flex-grow border border-hairline bg-canvas text-ink px-xs py-xs text-sm focus:border-primary outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(editingProject.id); } }}
                  />
                  <button
                    onClick={() => handleAddImageUrl(editingProject.id)}
                    disabled={uploading || !imageUrlInput.trim()}
                    className="px-sm py-xs text-xs font-bold uppercase tracking-wider bg-primary text-on-primary border border-transparent hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {t('images.add')}
                  </button>
                </div>

                {/* Image list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-xxs">
                  {editingProject.images.map((img) => (
                    <div key={img.id} className="relative group aspect-[4/3] bg-canvas border border-hairline overflow-hidden">
                      <img src={img.url} alt={img.caption || editingProject?.title || 'Showcase image'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-ink/50 sm:bg-ink/0 sm:group-hover:bg-ink/50 transition-colors flex items-center justify-center gap-xxs sm:opacity-0 sm:group-hover:opacity-100">
                        {!img.isFeatured && (
                          <button
                            onClick={async () => {
                              await setFeaturedImage(img.id, editingProject.id);
                              await loadProjects();
                            }}
                            className="w-[40px] h-[40px] bg-canvas-elevated flex items-center justify-center cursor-pointer hover:text-primary transition-colors"
                            title={t('images.setFeatured') ?? ''}
                          >
                            <span className="material-icons text-sm">star_outline</span>
                          </button>
                        )}
                        {img.isFeatured && (
                          <span className="w-[40px] h-[40px] bg-primary/20 text-primary flex items-center justify-center" title={t('images.featured') ?? ''}>
                            <span className="material-icons text-sm">star</span>
                          </span>
                        )}
                        <button
                          onClick={async () => {
                            await deleteShowcaseImage(img.id);
                            await loadProjects();
                          }}
                          className="w-[40px] h-[40px] bg-canvas-elevated flex items-center justify-center cursor-pointer hover:text-semantic-danger transition-colors"
                          title={t('images.delete') ?? ''}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </div>
                      {img.isFeatured && (
                        <span className="absolute top-1 left-1 bg-primary text-on-primary text-[8px] font-bold uppercase px-1 py-[1px]">{t('images.featured')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="text-center py-xl text-muted">{t('loading')}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-xl bg-canvas-elevated border border-hairline">
          <div className="w-[72px] h-[72px] bg-canvas flex items-center justify-center mx-auto mb-xs">
            <span className="material-icons text-muted text-4xl">collections_bookmark</span>
          </div>
          <p className="text-sm text-muted">{t('empty')}</p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xs">
              {projects.map((project, index) => (
                <div key={project.id} className="animate-fade-in hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                  <SortableShowcaseCard
                    project={project}
                    t={t}
                    onEdit={() => { setEditingProject(project); setShowForm(true); }}
                    onDelete={() => handleDelete(project.id)}
                    onToggleActive={() => handleToggleActive(project)}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
