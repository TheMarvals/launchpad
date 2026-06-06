import { getProject } from '@/app/actions/productivity';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-md max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-xs">
        <Link 
          href="/dashboard/productivity/projects"
          className="w-[40px] h-[40px] bg-canvas-elevated border border-hairline flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors"
        >
          <span className="material-icons">arrow_back</span>
        </Link>
        <div>
          <div className="flex items-center space-x-xxs">
            <h1 className="text-title-md font-medium text-ink tracking-tight">{project.name}</h1>
            <span className="px-xxs py-[1px] text-[10px] font-semibold uppercase tracking-wider bg-semantic-success/10 text-semantic-success border border-semantic-success/30">
              {project.status}
            </span>
          </div>
          <p className="text-body text-muted text-sm mt-[2px]">Detalles y seguimiento del proyecto.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-sm">
          {/* Description */}
          <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
            <h3 className="text-caption-uppercase text-muted font-semibold">Descripción del Proyecto</h3>
            <p className="text-ink leading-relaxed">
              {project.description || 'Sin descripción detallada.'}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-sm pt-sm border-t border-hairline">
              <div className="space-y-xxs">
                <p className="text-caption-uppercase text-muted font-semibold">Cliente</p>
                <p className="font-semibold text-ink">{project.clientName || 'Interno'}</p>
              </div>
              <div className="space-y-xxs">
                <p className="text-caption-uppercase text-muted font-semibold">Presupuesto</p>
                <p className="font-semibold text-ink text-xl">${project.budget?.toLocaleString('es-CL')}</p>
              </div>
              <div className="space-y-xxs">
                <p className="text-caption-uppercase text-muted font-semibold">Fecha Límite</p>
                <p className="font-semibold text-ink">
                  {project.deadline ? new Date(project.deadline).toLocaleDateString('es-CL') : 'Sin definir'}
                </p>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-canvas-elevated border border-hairline p-sm">
            <div className="flex items-center justify-between mb-sm">
              <h3 className="text-title-sm font-medium text-ink uppercase tracking-wider">Tareas Asociadas</h3>
              <span className="text-caption-uppercase text-muted font-semibold border border-hairline px-xxs py-[1px]">
                {project.tasks.length} tareas
              </span>
            </div>

            <div className="space-y-xxs">
              {project.tasks.length === 0 ? (
                <p className="text-muted font-medium text-center py-sm">No hay tareas vinculadas a este proyecto.</p>
              ) : (
                project.tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-xxs bg-canvas border border-hairline hover:border-ink transition-all">
                    <div className="flex items-center space-x-xxs">
                      <div className={`w-[10px] h-[10px] ${task.status === 'done' ? 'bg-semantic-success' : 'bg-primary'}`} />
                      <p className={`font-semibold text-ink text-sm ${task.status === 'done' ? 'line-through opacity-30' : ''}`}>
                        {task.title}
                      </p>
                    </div>
                    <span className="text-caption-uppercase text-muted font-semibold text-[10px]">
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-sm">
          <div className="bg-canvas-elevated border border-hairline p-sm relative overflow-hidden">
            <div 
              className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 opacity-20"
              style={{ backgroundColor: project.color }}
            />
            <h4 className="text-caption-uppercase text-muted font-semibold mb-xxs">Estado Financiero</h4>
            <div className="text-display-md font-medium text-ink mb-sm">${project.budget?.toLocaleString('es-CL')}</div>
            
            <button className="w-full bg-primary text-on-primary py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors">
              Generar Factura
            </button>
          </div>

          <div className="bg-canvas-elevated border border-hairline p-sm">
            <h3 className="text-caption-uppercase text-muted font-semibold mb-xs">Acciones de Control</h3>
            <div className="space-y-xxs">
              <button className="w-full text-left px-xs py-xxs hover:bg-canvas font-semibold text-ink transition-colors flex items-center text-xs uppercase tracking-wider">
                <span className="material-icons mr-xxs text-sm text-muted">edit</span> Editar Detalles
              </button>
              <button className="w-full text-left px-xs py-xxs hover:bg-canvas font-semibold text-ink transition-colors flex items-center text-xs uppercase tracking-wider">
                <span className="material-icons mr-xxs text-sm text-muted">timer</span> Registrar Tiempo
              </button>
              <button className="w-full text-left px-xs py-xxs hover:bg-canvas font-semibold text-semantic-warning transition-colors flex items-center text-xs uppercase tracking-wider">
                <span className="material-icons mr-xxs text-sm">delete</span> Archivar Proyecto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
