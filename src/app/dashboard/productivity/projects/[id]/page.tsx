import { getProject } from '@/app/actions/productivity';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-4">
        <Link 
          href="/dashboard/productivity/projects"
          className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-[#0a041a] hover:shadow-lg transition-all"
        >
          <span className="material-icons">arrow_back</span>
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-black text-[#0a041a]">{project.name}</h1>
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] uppercase font-black tracking-widest">
              {project.status}
            </span>
          </div>
          <p className="text-gray-400 font-medium mt-1">Detalles y seguimiento del proyecto.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-2xl shadow-gray-100">
            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-300 mb-4">Descripción del Proyecto</h3>
            <p className="text-gray-600 leading-relaxed text-lg font-medium">
              {project.description || 'Sin descripción detallada.'}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-50">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-300 font-black mb-1">Cliente</p>
                <p className="font-bold text-gray-900">{project.clientName || 'Interno'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-300 font-black mb-1">Presupuesto</p>
                <p className="font-black text-[#0a041a] text-xl">${project.budget?.toLocaleString('es-CL')}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-300 font-black mb-1">Fecha Límite</p>
                <p className="font-bold text-gray-900">
                  {project.deadline ? new Date(project.deadline).toLocaleDateString('es-CL') : 'Sin definir'}
                </p>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-2xl shadow-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-[#0a041a]">Tareas Asociadas</h3>
              <span className="bg-gray-50 text-gray-400 px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest">
                {project.tasks.length} tareas
              </span>
            </div>

            <div className="space-y-4">
              {project.tasks.length === 0 ? (
                <p className="text-gray-300 font-medium text-center py-10">No hay tareas vinculadas a este proyecto.</p>
              ) : (
                project.tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all border border-transparent hover:border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${task.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      <p className={`font-bold text-gray-900 ${task.status === 'done' ? 'line-through opacity-30' : ''}`}>
                        {task.title}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-black text-gray-300">
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Actions */}
        <div className="space-y-8">
          <div className="bg-[#0a041a] rounded-[3rem] p-10 text-white shadow-2xl shadow-[#0a041a]/20 relative overflow-hidden">
            <div 
              className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-20"
              style={{ backgroundColor: project.color }}
            />
            <h4 className="text-sm font-bold opacity-60 mb-2">Estado Financiero</h4>
            <div className="text-4xl font-black mb-8">${project.budget?.toLocaleString('es-CL')}</div>
            
            <button className="w-full bg-white text-[#0a041a] py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl">
              Generar Factura
            </button>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-2xl shadow-gray-100">
            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-300 mb-6">Acciones de Control</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-6 py-4 rounded-2xl hover:bg-gray-50 font-bold text-gray-600 transition-all flex items-center">
                <span className="material-icons mr-3 text-gray-300">edit</span> Editar Detalles
              </button>
              <button className="w-full text-left px-6 py-4 rounded-2xl hover:bg-gray-50 font-bold text-gray-600 transition-all flex items-center">
                <span className="material-icons mr-3 text-gray-300">timer</span> Registrar Tiempo
              </button>
              <button className="w-full text-left px-6 py-4 rounded-2xl hover:bg-red-50 font-bold text-red-500 transition-all flex items-center">
                <span className="material-icons mr-3 opacity-60">delete</span> Archivar Proyecto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
