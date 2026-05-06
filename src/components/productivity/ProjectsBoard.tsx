'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { createProject, deleteProject } from '@/app/actions/productivity';
import { useTranslations, useLocale } from 'next-intl';
import ProjectModal from './ProjectModal';
import Swal from 'sweetalert2';

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
      Swal.fire('Error', t('create.error'), 'error');
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
        popup: 'rounded-[2rem]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold text-gray-400'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
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
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0a041a] text-white px-8 py-4 rounded-[1.5rem] font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-[#0a041a]/10 flex items-center justify-center"
        >
          <span className="material-icons mr-2 text-[20px]">add</span> {t('newProject')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-4xl text-gray-200">folder_off</span>
            </div>
            <p className="text-gray-400 font-bold text-lg">{t('emptyTitle')}</p>
            <p className="text-gray-300 text-sm mt-1">{t('emptyMessage')}</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="group bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
              {/* Color Accent */}
              <div 
                className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10" 
                style={{ backgroundColor: project.color }}
              />
              
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="p-4 rounded-[1.2rem] shadow-sm transition-colors"
                  style={{ backgroundColor: `${project.color}15`, color: project.color }}
                >
                  <span className="material-icons">folder</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full ${
                    project.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                    {t(`status.${project.status}` as any)}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-icons text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black text-[#0a041a] mb-2 truncate group-hover:text-blue-600 transition-colors">{project.name}</h3>
              <p className="text-sm text-gray-400 font-medium mb-8 line-clamp-2 leading-relaxed">{project.description || t('labels.noDescription')}</p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-gray-300 font-black mb-1">{t('labels.client')}</span>
                  <span className="text-sm font-bold text-gray-600 truncate max-w-[120px]">{project.clientName || t('labels.internal')}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-300 font-black mb-1">{t('labels.budget')}</p>
                  <p className="text-lg font-black text-[#0a041a]">
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
