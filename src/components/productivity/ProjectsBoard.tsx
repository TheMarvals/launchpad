'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { createProject, deleteProject } from '@/app/actions/productivity';
import { useTranslations, useLocale } from 'next-intl';
import ProjectModal from './ProjectModal';
import Swal from 'sweetalert2';
import { swalTheme } from '@/lib/swal-theme';
import EmptyState from '@/components/EmptyState';

export default function ProjectsBoard({ initialProjects }: { initialProjects: any[] }) {
  const t = useTranslations('Projects');
  const locale = useLocale();
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateProject = async (data: any) => {
    try {
      const newProject = await createProject(data);
      setProjects([newProject, ...projects]);
    } catch (err) {
      Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('create.error') });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await Swal.fire({
      title: t('delete.title'),
      text: t('delete.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
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
        await deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
      } catch (err) {
        Swal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: t('delete.error') });
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
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center justify-center border border-transparent"
        >
          <span className="material-icons mr-2 text-[20px]">add</span> {t('newProject')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.length === 0 ? (
          <div className="col-span-full bg-canvas-elevated border border-hairline">
            <EmptyState variant="folder" title={t('emptyTitle')} message={t('emptyMessage')} />
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="group bg-canvas-elevated p-sm border border-hairline hover:border-ink transition-all relative overflow-hidden">
              {/* Color Accent */}
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{ backgroundColor: project.color }}
              />
              
              <div className="flex justify-between items-start mb-6 mt-2">
                <div 
                  className="p-2 border border-hairline transition-colors"
                  style={{ backgroundColor: `${project.color}15`, color: project.color }}
                >
                  <span className="material-icons">folder</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-caption-uppercase px-2 py-1 rounded-none border ${
                    project.status === 'active' ? 'border-primary text-primary' : 'border-muted text-muted'
                  }`}>
                    {t(`status.${project.status}` as any)}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(project.id, e)}
                    className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary transition-colors"
                  >
                    <span className="material-icons text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <h3 className="text-title-sm font-medium uppercase text-ink mb-2 truncate group-hover:text-primary transition-colors">{project.name}</h3>
              <p className="text-body text-muted mb-8 line-clamp-2">{project.description || t('labels.noDescription')}</p>

              <div className="flex items-center justify-between pt-xs border-t border-hairline">
                <div className="flex flex-col">
                  <span className="text-caption-uppercase text-muted mb-1">{t('labels.client')}</span>
                  <span className="text-body text-ink font-medium truncate max-w-[120px]">{project.clientName || t('labels.internal')}</span>
                </div>
                <div className="text-right">
                  <p className="text-caption-uppercase text-muted mb-1">{t('labels.budget')}</p>
                  <p className="text-title-md font-medium text-ink">
                    ${project.budget?.toLocaleString(locale)}
                  </p>
                </div>
              </div>

              <Link 
                href={`/dashboard/productivity/projects/${project.id}`}
                className="absolute inset-0 z-0"
              />
            </div>
          ))
        )}
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProject}
        title={t('create.title')}
      />
    </div>
  );
}
