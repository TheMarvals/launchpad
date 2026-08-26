'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createPitch, updatePitch } from '@/app/actions/pitches';
import { useTranslations, useLocale } from 'next-intl';
import PitchViewer, { PitchSlide } from './PitchViewer';

interface Client {
  id: string;
  razonSocial: string;
  rut: string;
}

interface PitchFormProps {
  clients: Client[];
  admins?: any[];
  companyProfile?: any;
  initialData?: any;
}

const DEFAULT_LAUNCHPAD_SLIDES: PitchSlide[] = [
  {
    id: 'slide-1',
    type: 'hero',
    badge: '360° Creative & Technology Support',
    title: 'LAUNCHPAD',
    subtitle: 'Where ideas take off',
    content: 'Ideas are only the beginning. We design, build, and scale high-performance digital ecosystems that drive measurable growth. From cloud architecture and web platforms to content, automation, and marketing, every solution is engineered with business outcomes in mind.',
    clientName: 'Cliente Corporativo',
    cta: {
      text: 'Agendar Reunión',
      secondaryText: 'Explorar Propuesta',
    },
  },
  {
    id: 'slide-2',
    type: 'problem_solution',
    badge: 'El Desafío & La Oportunidad',
    title: 'El Reto del Negocio',
    subtitle: 'Transformando la fricción técnica y comercial en un motor de crecimiento escalable',
    cards: [
      {
        title: 'Fricción Operativa & Fragmentación',
        subtitle: 'SITUACIÓN ACTUAL',
        description: 'Múltiples proveedores desconectados, infraestructura con cuellos de botella y herramientas que no conversan entre sí generan sobrecostos y retrasos en la entrega.',
        icon: 'warning_amber',
        highlight: false,
      },
      {
        title: 'Ecosistema Unificado de Alto Rendimiento',
        subtitle: 'SOLUCIÓN LAUNCHPAD',
        description: 'Arquitectura cloud robusta, interfaces de usuario de alta fidelidad y automatización integral gestionada por un solo equipo estratégico.',
        icon: 'verified',
        highlight: true,
      },
    ],
  },
  {
    id: 'slide-3',
    type: 'pillars',
    badge: 'Nuestra Propuesta de Valor',
    title: 'Nuestros Pilares 360°',
    subtitle: 'Soluciones integrales de diseño, ingeniería y crecimiento digital',
    cards: [
      {
        title: 'Design & Creative',
        subtitle: 'Branding, Video & UX',
        description: 'Construimos experiencias digitales que impulsan el engagement y reducen la fricción cognitiva. Desde identidad corporativa hasta producción de video de alto impacto.',
        icon: 'palette',
        tags: ['Branding', 'Video', 'UI/UX'],
      },
      {
        title: 'Engineering & Cloud',
        subtitle: 'Web Apps & Arquitectura Cloud',
        description: 'Diseñamos infraestructura digital resistente y de alto rendimiento. Gestionamos la complejidad técnica para garantizar estabilidad operativa y cero caídas.',
        icon: 'code',
        tags: ['Web Apps', 'Cloud', 'DevOps'],
      },
      {
        title: '360° Growth & Marketing',
        subtitle: 'Campañas, Contenido & Estrategia',
        description: 'Convertimos tus plataformas en motores de crecimiento. Desde campañas 360° hasta optimización de conversiones para asegurar ROI escalable.',
        icon: 'trending_up',
        tags: ['Campañas', 'Contenido', 'Analytics'],
      },
    ],
  },
  {
    id: 'slide-4',
    type: 'metrics',
    badge: 'Resultados y Rendimiento',
    title: 'Métricas de Impacto',
    subtitle: 'Resultados medibles y garantizados en rendimiento, seguridad y conversión',
    metrics: [
      { value: '99.99%', label: 'Disponibilidad Cloud', subtext: 'Alta resiliencia', icon: 'cloud_done' },
      { value: '+140%', label: 'Conversión Media', subtext: 'Optimización de embudos', icon: 'speed' },
      { value: '3x', label: 'Velocidad de Carga', subtext: 'Core Web Vitals', icon: 'bolt' },
      { value: '24/7', label: 'Monitoreo & Soporte', subtext: 'Respuesta en <15 min', icon: 'support_agent' },
    ],
  },
  {
    id: 'slide-5',
    type: 'roadmap',
    badge: 'Metodología y Ejecución',
    title: 'Roadmap de Implementación',
    subtitle: 'Estructura de trabajo iterativa orientada a entregables de valor rápido',
    timeline: [
      {
        phase: 'Fase 1',
        title: 'Discovery & Arquitectura',
        duration: 'Semanas 1 - 2',
        deliverables: ['Levantamiento de requerimientos', 'Definición de stack y arquitectura', 'Wireframes y prototipos UI/UX'],
      },
      {
        phase: 'Fase 2',
        title: 'Desarrollo & Despliegue',
        duration: 'Semanas 3 - 6',
        deliverables: ['Desarrollo modular continuo', 'Integración de servicios y APIs', 'Pruebas de carga y seguridad'],
      },
      {
        phase: 'Fase 3',
        title: 'Lanzamiento & Crecimiento',
        duration: 'Semanas 7+',
        deliverables: ['Puesta en producción con cero downtime', 'Capacitación y documentación', 'Optimización y analítica en tiempo real'],
      },
    ],
  },
  {
    id: 'slide-6',
    type: 'cta',
    badge: 'Próximos Pasos',
    title: 'Hagamos Despegar tu Proyecto',
    subtitle: 'Estamos listos para transformar tu visión en un ecosistema digital líder',
    content: 'Coordinemos una llamada de alineación técnica para revisar fechas de inicio, alcances específicos y conformación del equipo dedicado.',
    cta: {
      text: 'Agendar Discovery Call',
    },
  },
];

export default function PitchForm({
  clients,
  admins = [],
  companyProfile,
  initialData,
}: PitchFormProps) {
  const t = useTranslations('Pitches');
  const locale = useLocale();
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || 'Launchpad Executive Pitch');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || 'Where ideas take off');
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [userId, setUserId] = useState(initialData?.userId || '');
  const [status, setStatus] = useState(initialData?.status || 'Borrador');
  const [theme, setTheme] = useState(initialData?.theme || 'midnight');

  const [slides, setSlides] = useState<PitchSlide[]>(() => {
    if (initialData?.slides && Array.isArray(initialData.slides) && initialData.slides.length > 0) {
      return initialData.slides;
    }
    return DEFAULT_LAUNCHPAD_SLIDES;
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const activeSlide = slides[activeSlideIndex] || slides[0];

  const handleLoadTemplate = () => {
    if (confirm(locale === 'es' ? '¿Cargar plantilla oficial de Launchpad? Esto reemplazará las diapositivas actuales.' : 'Load official Launchpad template? This will replace current slides.')) {
      setSlides(DEFAULT_LAUNCHPAD_SLIDES);
      setActiveSlideIndex(0);
    }
  };

  const addSlide = (type: PitchSlide['type'] = 'hero') => {
    const newSlide: PitchSlide = {
      id: `slide-${Date.now()}`,
      type,
      badge: 'Sección Informativa',
      title: 'Nueva Diapositiva',
      subtitle: 'Subtítulo descriptivo de la diapositiva',
      content: 'Descripción y texto explicativo para el cliente.',
      cards: type === 'pillars' ? [
        { title: 'Pilar 1', subtitle: 'Subtítulo', description: 'Descripción detallada', icon: 'star', tags: ['Tag 1'] },
        { title: 'Pilar 2', subtitle: 'Subtítulo', description: 'Descripción detallada', icon: 'code', tags: ['Tag 2'] },
        { title: 'Pilar 3', subtitle: 'Subtítulo', description: 'Descripción detallada', icon: 'trending_up', tags: ['Tag 3'] },
      ] : undefined,
      metrics: type === 'metrics' ? [
        { value: '100%', label: 'Métrica 1', subtext: 'Detalle' },
        { value: '+50%', label: 'Métrica 2', subtext: 'Detalle' },
      ] : undefined,
    };

    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const updateActiveSlide = (fields: Partial<PitchSlide>) => {
    const updated = [...slides];
    updated[activeSlideIndex] = { ...updated[activeSlideIndex], ...fields };
    setSlides(updated);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return alert('Debes mantener al menos una diapositiva.');
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setSlides(updated);
    setActiveSlideIndex(targetIndex);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title) return alert('Por favor ingresa un título para el Pitch.');

    setIsSubmitting(true);
    try {
      const selectedClient = clients.find(c => c.id === clientId);
      const payload = {
        title,
        subtitle,
        clientId: clientId || null,
        clientName: selectedClient ? selectedClient.razonSocial : (clientName || null),
        userId: userId || null,
        status,
        theme,
        slides,
      };

      if (isEditing) {
        await updatePitch(initialData.id, payload);
      } else {
        await createPitch(payload);
      }

      router.push('/dashboard/pitches');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el Pitch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mockPitch = {
    title,
    subtitle,
    clientName: clients.find(c => c.id === clientId)?.razonSocial || clientName,
    client: clients.find(c => c.id === clientId),
    user: admins.find(a => a.id === userId),
    theme,
    slides,
  };

  return (
    <div className="space-y-md max-w-7xl mx-auto font-sans pb-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs mb-sm">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">
            {isEditing ? t('editPitch') : t('newPitch')}
          </h1>
          <p className="text-body text-muted mt-[4px]">
            Diseña y personaliza presentaciones comerciales con el estilo oficial de Launchpad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadTemplate}
            className="px-xs py-xxs text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink border border-hairline hover:bg-canvas transition-colors flex items-center gap-1"
          >
            <span className="material-icons text-sm">auto_awesome</span>
            Cargar Plantilla Launchpad
          </button>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-xs py-xxs text-xs font-semibold uppercase tracking-wider text-primary border border-primary/30 hover:bg-primary/10 transition-colors flex items-center gap-1"
          >
            <span className="material-icons text-sm">visibility</span>
            Vista Completa
          </button>
        </div>
      </div>

      {/* Main Grid: Settings & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        {/* Left Column: Form & Slide Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-sm">
          {/* General Metadata */}
          <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
            <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
              <span className="material-icons mr-xxs text-primary">tune</span> Datos del Pitch
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Título del Pitch</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                  placeholder="Ej. Propuesta de Arquitectura y Crecimiento 360°"
                />
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Subtítulo / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                  placeholder="Ej. Where ideas take off"
                />
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Cliente Registrado</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="">Seleccionar cliente (o escribir nombre abajo)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial} ({c.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Nombre Cliente Personalizado</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                  placeholder="Ej. Acme Corporation"
                />
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Presentador (Admin)</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="">Seleccionar presentador</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.cargo || 'Admin'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Borrador">Borrador</option>
                  <option value="Activo">Activo</option>
                  <option value="Presentado">Presentado</option>
                  <option value="Aceptado">Aceptado</option>
                  <option value="Archivado">Archivado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Slides List / Manager */}
          <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
                <span className="material-icons mr-xxs text-primary">view_carousel</span> Diapositivas ({slides.length})
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => addSlide('hero')}
                  className="px-xxs py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline"
                >
                  + Portada
                </button>
                <button
                  type="button"
                  onClick={() => addSlide('pillars')}
                  className="px-xxs py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline"
                >
                  + Pilares
                </button>
                <button
                  type="button"
                  onClick={() => addSlide('metrics')}
                  className="px-xxs py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline"
                >
                  + Métricas
                </button>
                <button
                  type="button"
                  onClick={() => addSlide('cta')}
                  className="px-xxs py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline"
                >
                  + CTA
                </button>
              </div>
            </div>

            {/* Slide thumbnails / pill selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((s, idx) => (
                <div
                  key={s.id || idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`flex-shrink-0 px-3 py-2 border rounded-sm cursor-pointer transition-all ${
                    activeSlideIndex === idx
                      ? 'border-primary bg-primary/10 text-white font-bold'
                      : 'border-hairline bg-canvas text-muted hover:text-ink'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider">Slide {idx + 1}</div>
                  <div className="text-xs truncate max-w-[120px] font-semibold">{s.title || s.type}</div>
                </div>
              ))}
            </div>

            {/* Active Slide Editor Form */}
            {activeSlide && (
              <div className="bg-canvas border border-hairline p-sm space-y-sm pt-md border-t-2 border-t-primary">
                <div className="flex justify-between items-center border-b border-hairline pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                      Editando Slide {activeSlideIndex + 1} ({activeSlide.type})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSlide(activeSlideIndex, 'up')}
                      disabled={activeSlideIndex === 0}
                      className="p-1 text-muted hover:text-ink disabled:opacity-30"
                      title="Mover arriba"
                    >
                      <span className="material-icons text-sm">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(activeSlideIndex, 'down')}
                      disabled={activeSlideIndex === slides.length - 1}
                      className="p-1 text-muted hover:text-ink disabled:opacity-30"
                      title="Mover abajo"
                    >
                      <span className="material-icons text-sm">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(activeSlideIndex)}
                      className="p-1 text-muted hover:text-semantic-error"
                      title="Eliminar slide"
                    >
                      <span className="material-icons text-sm">delete_outline</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                  <div className="space-y-xxs">
                    <label className="block text-caption-uppercase text-ink font-semibold">Tipo de Diapositiva</label>
                    <select
                      value={activeSlide.type}
                      onChange={(e) => updateActiveSlide({ type: e.target.value as any })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="hero">Hero / Portada Principal</option>
                      <option value="pillars">Pilares de Servicios (3 Columnas)</option>
                      <option value="problem_solution">Problema vs Solución</option>
                      <option value="metrics">Métricas de Impacto</option>
                      <option value="roadmap">Roadmap de Ejecución</option>
                      <option value="cta">Llamado a la Acción / Contacto</option>
                      <option value="custom">Contenido Libre</option>
                    </select>
                  </div>

                  <div className="space-y-xxs">
                    <label className="block text-caption-uppercase text-ink font-semibold">Badge Superior</label>
                    <input
                      type="text"
                      value={activeSlide.badge || ''}
                      onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                      placeholder="Ej. 360° Creative & Technology Support"
                    />
                  </div>

                  <div className="space-y-xxs md:col-span-2">
                    <label className="block text-caption-uppercase text-ink font-semibold">Título de la Diapositiva</label>
                    <input
                      type="text"
                      value={activeSlide.title || ''}
                      onChange={(e) => updateActiveSlide({ title: e.target.value })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none font-bold"
                      placeholder="Ej. LAUNCHPAD o Nuestros Pilares"
                    />
                  </div>

                  <div className="space-y-xxs md:col-span-2">
                    <label className="block text-caption-uppercase text-ink font-semibold">Subtítulo / Bajada</label>
                    <input
                      type="text"
                      value={activeSlide.subtitle || ''}
                      onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                      placeholder="Ej. Where ideas take off"
                    />
                  </div>

                  <div className="space-y-xxs md:col-span-2">
                    <label className="block text-caption-uppercase text-ink font-semibold">Texto / Contenido Principal</label>
                    <textarea
                      rows={3}
                      value={activeSlide.content || ''}
                      onChange={(e) => updateActiveSlide({ content: e.target.value })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                      placeholder="Descripción detallada de la diapositiva..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-xs">
          <div className="flex items-center justify-between px-xs py-xxs bg-canvas border border-hairline">
            <span className="text-caption-uppercase text-muted font-bold text-xs flex items-center gap-1">
              <span className="material-icons text-sm text-primary">visibility</span>
              Vista Previa en Vivo
            </span>
            <span className="text-[10px] text-muted uppercase tracking-wider">Slide {activeSlideIndex + 1} de {slides.length}</span>
          </div>

          <div className="border border-hairline rounded-sm overflow-hidden bg-[#07070b] h-[550px] flex flex-col shadow-2xl relative">
            <PitchViewer
              pitch={{
                ...mockPitch,
                slides: [activeSlide],
              }}
              companyProfile={companyProfile}
              isEditorPreview={true}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-xs bg-canvas-elevated p-sm border-t border-hairline sticky bottom-0 z-30">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted font-semibold hover:text-ink transition-colors text-xs uppercase tracking-wider flex items-center"
        >
          <span className="material-icons text-sm mr-xxs">arrow_back</span>
          Volver
        </button>

        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="text-ink font-semibold hover:text-primary transition-colors text-xs uppercase tracking-wider flex items-center"
          >
            <span className="material-icons text-sm mr-xxs">fullscreen</span>
            Pantalla Completa
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-lg h-[40px] bg-primary text-black font-semibold hover:bg-primary/90 transition-all flex items-center justify-center uppercase tracking-wider text-xs disabled:opacity-50"
          >
            <span className="material-icons mr-xxs text-sm">save</span>
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Pitch' : 'Guardar Pitch')}
          </button>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="absolute top-4 right-4 z-50">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md"
            >
              <span className="material-icons text-sm">close</span>
              Cerrar
            </button>
          </div>
          <PitchViewer
            pitch={mockPitch}
            companyProfile={companyProfile}
          />
        </div>
      )}
    </div>
  );
}
