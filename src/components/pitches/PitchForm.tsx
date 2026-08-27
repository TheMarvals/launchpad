'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createPitch, updatePitch } from '@/app/actions/pitches';
import { useTranslations, useLocale } from 'next-intl';
import PitchViewer, { PitchSlide, ShowcaseItem, parsePitchTheme } from './PitchViewer';

interface Client {
  id: string;
  razonSocial: string;
  rut: string;
}

interface PitchFormProps {
  clients: Client[];
  admins?: any[];
  companyProfile?: any;
  showcaseProjects?: any[];
  initialData?: any;
}

const DEFAULT_LAUNCHPAD_SLIDES: PitchSlide[] = [
  {
    id: 'slide-1',
    type: 'hero',
    badge: '360° Creative & Technology Support',
    title: 'LAUNCHPAD',
    subtitle: 'Where ideas take off • 2026 Daily Comms & Major Event Production',
    content: 'We design, build, and scale high-performance digital ecosystems and creative communications that drive measurable growth.',
    clientName: 'DiDi Global (IBG)',
    cta: {
      text: 'Explore Proposal',
      secondaryText: 'View Case Studies',
    },
  },
  {
    id: 'slide-2',
    type: 'problem_solution',
    badge: 'Strategic Alignment',
    title: 'Bridging Creative Velocity & Enterprise Scale',
    subtitle: 'Solving the bottleneck between fast turnaround times and high-touch creative quality',
    cards: [
      {
        title: 'Fragmented Execution & Slow SLAs',
        subtitle: 'TRADITIONAL AGENCY BOTTLENECK',
        description: 'Multi-layered account management slows down daily asset delivery, causing missed campaign windows and misalignment.',
        icon: 'warning',
        highlight: false,
      },
      {
        title: 'Unified High-Performance Ecosystem',
        subtitle: 'LAUNCHPAD SOLUTION',
        description: 'Resilient cloud architecture, high-fidelity UI/UX, and end-to-end creative production managed by a dedicated agile team.',
        icon: 'verified',
        highlight: true,
      },
    ],
  },
  {
    id: 'slide-3',
    type: 'pillars',
    badge: 'Core Value Proposition',
    title: 'Our 360° Pillars',
    subtitle: 'End-to-end design, engineering, and digital growth capabilities',
    cards: [
      {
        title: 'Design & Creative',
        subtitle: 'Branding, Video & UX',
        description: 'Crafting digital experiences that maximize engagement and reduce cognitive load. From brand systems to high-impact video production.',
        icon: 'palette',
        tags: ['Branding', 'Video', 'UI/UX'],
      },
      {
        title: 'Engineering & Cloud',
        subtitle: 'Web Apps & Cloud Architecture',
        description: 'Engineering resilient, scalable digital infrastructure. We manage technical complexity to guarantee zero downtime and maximum security.',
        icon: 'code',
        tags: ['Web Apps', 'Cloud', 'DevOps'],
      },
      {
        title: '360° Growth & Marketing',
        subtitle: 'Campaigns, Content & Strategy',
        description: 'Transforming platforms into growth drivers with high-cadence creative assets, video production, and conversion optimization.',
        icon: 'trending_up',
        tags: ['Campaigns', 'Content', 'Analytics'],
      },
    ],
  },
  {
    id: 'slide-4',
    type: 'showcase',
    badge: 'Proven Work & Case Studies',
    title: 'Featured Case Studies',
    subtitle: 'Selected creative, video production, and presentation design work',
    showcaseItems: [
      {
        id: 'work-1',
        title: 'Corporate Presentation & Visual Storytelling',
        subtitle: 'Executive Slides & Infographics',
        description: 'High-impact slide decks and executive data visualization designed for global leadership communications.',
        mediaType: 'slide',
        mediaUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781051038/launchpad/showcase/oau4ej9gfeaq1zirzwjc.webp',
        thumbnailUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781051038/launchpad/showcase/oau4ej9gfeaq1zirzwjc.webp',
        tags: ['Executive Decks', 'Data Viz', 'Canva', 'PPT'],
        client: 'Global Corporate',
      },
      {
        id: 'work-2',
        title: 'Digital Ecosystem & Brand Assets',
        subtitle: 'Branding, Key Visuals & UI',
        description: 'Complete brand identity rollout and digital communication assets across multiple internal and external channels.',
        mediaType: 'image',
        mediaUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781103426/launchpad/showcase/cyp2seahjnpzl6xjjmwv.webp',
        thumbnailUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781103426/launchpad/showcase/cyp2seahjnpzl6xjjmwv.webp',
        tags: ['Branding', 'Key Visuals', 'D-Hub', 'Figma'],
        client: 'Pantalla+',
      },
    ],
  },
  {
    id: 'slide-5',
    type: 'metrics',
    badge: 'Results & Reliability',
    title: 'Impact Metrics',
    subtitle: 'Measurable excellence in turnaround speed, security, and quality',
    metrics: [
      { value: '<24h', label: 'Fast Turnaround SLA', subtext: 'Daily comms & banners', icon: 'timer' },
      { value: '100%', label: 'Security Compliance', subtext: 'Enterprise-grade protocols', icon: 'security' },
      { value: '3', label: 'Language Coverage', subtext: 'EN / ES Bilingual + CN Support', icon: 'translate' },
      { value: '24/7', label: 'Dedicated Support', subtext: 'Peak period surge capacity', icon: 'support_agent' },
    ],
  },
  {
    id: 'slide-6',
    type: 'roadmap',
    badge: 'Methodology & Execution',
    title: 'Implementation Roadmap',
    subtitle: 'Iterative, sprint-based workflow delivering fast, high-quality deliverables',
    timeline: [
      {
        phase: 'Phase 1',
        title: 'Discovery & Onboarding',
        duration: 'Weeks 1 - 2',
        deliverables: ['Requirements & brand guidelines intake', 'Dedicated Account Lead onboarding', 'Tooling & VRA alignment'],
      },
      {
        phase: 'Phase 2',
        title: 'Continuous Agile Production',
        duration: 'Weeks 3 - 6',
        deliverables: ['Daily comms creative pod (<24-48h SLA)', 'Infographics & executive slide decks', 'Bilingual EN/ES + CN production'],
      },
      {
        phase: 'Phase 3',
        title: 'Major Event Production',
        duration: 'Flagship Events',
        deliverables: ['Video shooting, editing & color grading', '2D/3D motion graphics & openers', 'Live event on-screen branding'],
      },
    ],
  },
  {
    id: 'slide-7',
    type: 'cta',
    badge: 'Next Steps',
    title: "Let's Power Your Global Comms",
    subtitle: 'Ready to partner and accelerate your communication objectives',
    content: 'We are eager to review scope details and align on dedicated team availability for the upcoming cycle.',
    cta: {
      text: 'Schedule Technical Discovery',
    },
  },
];

export default function PitchForm({
  clients,
  admins = [],
  companyProfile,
  showcaseProjects = [],
  initialData,
}: PitchFormProps) {
  const t = useTranslations('Pitches');
  const locale = useLocale();
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || 'DiDi Global IC • Creative & Multimedia Production RFI');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || 'Where ideas take off • 2026 Daily Comms & Major Event Production');
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [userId, setUserId] = useState(initialData?.userId || '');
  const [status, setStatus] = useState(initialData?.status || 'Activo');
  
  const initialThemeParsed = parsePitchTheme(initialData?.theme, initialData?.title, initialData?.clientName);
  const [accentColor, setAccentColor] = useState(initialThemeParsed.color);
  const [titleFont, setTitleFont] = useState(initialThemeParsed.font);
  const [titleStyle, setTitleStyle] = useState<'solid' | 'outline'>(initialThemeParsed.style || 'solid');
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
  const [showImportShowcaseModal, setShowImportShowcaseModal] = useState(false);

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
      badge: type === 'showcase' ? 'Case Studies & Examples' : 'Section Badge',
      title: type === 'showcase' ? 'Featured Work & Case Studies' : 'New Slide',
      subtitle: 'Descriptive subtitle for this slide',
      content: 'Detailed description and explanatory text.',
      cards: type === 'pillars' ? [
        { title: 'Pillar 1', subtitle: 'Subtitle', description: 'Detailed description', icon: 'star', tags: ['Tag 1'] },
        { title: 'Pillar 2', subtitle: 'Subtitle', description: 'Detailed description', icon: 'code', tags: ['Tag 2'] },
        { title: 'Pillar 3', subtitle: 'Subtitle', description: 'Detailed description', icon: 'trending_up', tags: ['Tag 3'] },
      ] : undefined,
      showcaseItems: type === 'showcase' ? [
        {
          id: `item-${Date.now()}`,
          title: 'Corporate Presentation Deck',
          subtitle: 'Executive Slides',
          description: 'High-impact slide deck crafted for executive presentations.',
          mediaType: 'slide',
          mediaUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781051038/launchpad/showcase/oau4ej9gfeaq1zirzwjc.webp',
          thumbnailUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781051038/launchpad/showcase/oau4ej9gfeaq1zirzwjc.webp',
          tags: ['Slides', 'Canva', 'PowerPoint'],
          client: 'Corporate Client',
        }
      ] : undefined,
      metrics: type === 'metrics' ? [
        { value: '<24h', label: 'Fast SLA', subtext: 'Daily comms' },
        { value: '100%', label: 'Compliance', subtext: 'VRA & InfoSec' },
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

  // Showcase item manager methods
  const addShowcaseItem = () => {
    const currentItems = activeSlide.showcaseItems || [];
    const newItem: ShowcaseItem = {
      id: `item-${Date.now()}`,
      title: 'New Work Example',
      subtitle: 'Video / Graphic / Slide',
      description: 'Overview of the project, creative direction, and business impact.',
      mediaType: 'image',
      mediaUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781103426/launchpad/showcase/cyp2seahjnpzl6xjjmwv.webp',
      thumbnailUrl: 'https://res.cloudinary.com/djwuzrjvz/image/upload/v1781103426/launchpad/showcase/cyp2seahjnpzl6xjjmwv.webp',
      tags: ['Creative', 'Design'],
      client: 'DiDi / Corporate',
    };
    updateActiveSlide({ showcaseItems: [...currentItems, newItem] });
  };

  const updateShowcaseItem = (itemIndex: number, fields: Partial<ShowcaseItem>) => {
    const currentItems = [...(activeSlide.showcaseItems || [])];
    currentItems[itemIndex] = { ...currentItems[itemIndex], ...fields };
    updateActiveSlide({ showcaseItems: currentItems });
  };

  const deleteShowcaseItem = (itemIndex: number) => {
    const currentItems = (activeSlide.showcaseItems || []).filter((_, i) => i !== itemIndex);
    updateActiveSlide({ showcaseItems: currentItems });
  };

  const importFromProject = (project: any, img?: any) => {
    const currentItems = activeSlide.showcaseItems || [];
    const targetUrl = img ? img.url : (project.images && project.images[0] ? project.images[0].url : (project.featuredImage || ''));
    const isSlideCategory = project.category === 'design' || project.title.toLowerCase().includes('slide');
    const isVideoCategory = project.title.toLowerCase().includes('video') || project.title.toLowerCase().includes('motion');

    const projectImages: string[] = project.images && project.images.length > 0
      ? project.images.map((i: any) => (typeof i === 'string' ? i : i.url)).filter(Boolean)
      : (project.featuredImage ? [project.featuredImage] : (targetUrl ? [targetUrl] : []));

    const newItem: ShowcaseItem = {
      id: `project-${project.id}-${Date.now()}`,
      title: project.title,
      subtitle: project.technologies || project.category,
      description: project.descriptionEn || project.description || '',
      mediaType: isVideoCategory ? 'video' : isSlideCategory ? 'slide' : 'image',
      mediaUrl: targetUrl,
      thumbnailUrl: targetUrl,
      images: projectImages.length > 0 ? projectImages : (targetUrl ? [targetUrl] : []),
      tags: project.technologies ? project.technologies.split(',').map((t: string) => t.trim()) : [project.category],
      client: project.clientName || 'DiDi / Corporate',
      externalUrl: project.projectUrl || undefined,
    };

    updateActiveSlide({ showcaseItems: [...currentItems, newItem] });
    setShowImportShowcaseModal(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title) return alert('Please enter a Pitch title.');

    setIsSubmitting(true);
    try {
      const selectedClient = clients.find(c => c.id === clientId);
      const currentTheme = `${accentColor}|${titleFont}|${titleStyle}`;
      const payload = {
        title,
        subtitle,
        clientId: clientId || null,
        clientName: selectedClient ? selectedClient.razonSocial : (clientName || null),
        userId: userId || null,
        status,
        theme: currentTheme,
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
      alert('Error saving Pitch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTheme = `${accentColor}|${titleFont}|${titleStyle}`;
  const mockPitch = {
    title,
    subtitle,
    clientName: clients.find(c => c.id === clientId)?.razonSocial || clientName,
    client: clients.find(c => c.id === clientId),
    user: admins.find(a => a.id === userId),
    theme: currentTheme,
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
            Design, edit, and present high-impact pitch decks and case studies in the official Launchpad aesthetic.
          </p>
        </div>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={handleLoadTemplate}
            className="px-sm py-xxs border border-hairline text-muted hover:text-ink text-xs font-semibold uppercase tracking-wider flex items-center transition-colors bg-canvas"
          >
            <span className="material-icons text-sm mr-xxs">refresh</span>
            Reset to Template
          </button>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-xs py-xxs text-xs font-semibold uppercase tracking-wider text-primary border border-primary/30 hover:bg-primary/10 transition-colors flex items-center gap-1"
          >
            <span className="material-icons text-sm">visibility</span>
            Fullscreen Preview
          </button>
        </div>
      </div>

      {/* Main Grid: Settings & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
        {/* Left Column: Form & Slide Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-md">
          {/* General Metadata */}
          <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
            <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
              <span className="material-icons mr-xxs text-primary">tune</span> Pitch Metadata & Client Setup
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              <div className="sm:col-span-2 space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Pitch Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none font-bold"
                  placeholder="e.g. DiDi Global IC • Creative & Multimedia Production RFI"
                />
              </div>

              <div className="sm:col-span-2 space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                  placeholder="e.g. Where ideas take off • 2026 Daily Comms & Major Event Production"
                />
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Registered Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="">Select client (or enter custom name below)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial} ({c.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Custom Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                  placeholder="e.g. DiDi Global (IBG)"
                />
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Presenter (Admin)</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="">Select presenter</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.cargo || 'Admin'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-xxs">
                <label className="block text-caption-uppercase text-ink font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Borrador">Draft</option>
                  <option value="Activo">Active</option>
                  <option value="Presentado">Presented</option>
                  <option value="Aceptado">Accepted</option>
                  <option value="Archivado">Archived</option>
                </select>
              </div>

              {/* Brand Color & Font Customization */}
              <div className="sm:col-span-2 pt-xs border-t border-hairline mt-xxs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-caption-uppercase text-primary font-bold flex items-center gap-1">
                    <span className="material-icons text-sm">palette</span>
                    Client Brand Color & Title Typography
                  </label>
                  <span className="text-[11px] text-muted">
                    Custom accents for buttons, glows & headings
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-canvas p-3 border border-hairline rounded-sm">
                  {/* Accent Color Picker */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                      Accent Color (Acentos / Botones)
                    </span>

                    {/* Color Swatches */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { name: 'DiDi Orange', hex: '#FF7D00' },
                        { name: 'Launchpad Purple', hex: '#A855F7' },
                        { name: 'Cyber Blue', hex: '#0062FF' },
                        { name: 'Electric Cyan', hex: '#00DCE5' },
                        { name: 'Emerald', hex: '#10B981' },
                        { name: 'Crimson', hex: '#EF4444' },
                        { name: 'Amber Gold', hex: '#F59E0B' },
                        { name: 'Silver White', hex: '#E5E2E3' },
                      ].map((swatch) => (
                        <button
                          key={swatch.hex}
                          type="button"
                          title={swatch.name}
                          onClick={() => setAccentColor(swatch.hex)}
                          className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                            accentColor.toUpperCase() === swatch.hex.toUpperCase()
                              ? 'scale-110 ring-2 ring-white border-white shadow-md'
                              : 'border-white/20 hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {accentColor.toUpperCase() === swatch.hex.toUpperCase() && (
                            <span className="material-icons text-[12px] text-black drop-shadow font-black">check</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Custom Hex Picker & Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="color"
                        value={accentColor.startsWith('#') ? accentColor : '#FF7D00'}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-7 h-7 rounded border border-hairline bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-28 border border-hairline bg-canvas-elevated text-ink px-2 py-1 text-xs font-mono uppercase focus:border-primary outline-none"
                        placeholder="#FF7D00"
                      />
                      <span className="text-[10px] text-muted">Custom Hex</span>
                    </div>
                  </div>

                  {/* Title Font Selector */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                      Title Typography (Fuente de Títulos)
                    </span>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'outfit', name: 'Outfit', desc: 'Moderna & Geométrica' },
                        { id: 'montserrat', name: 'Montserrat', desc: 'Launchpad Brand Oficial' },
                        { id: 'inter', name: 'Inter', desc: 'Minimalista & Clean' },
                        { id: 'geist', name: 'Geist', desc: 'Tech Modern' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTitleFont(f.id)}
                          className={`p-1.5 text-left rounded border transition-all ${
                            titleFont === f.id
                              ? 'bg-primary/10 border-primary text-white font-bold shadow-sm'
                              : 'bg-canvas-elevated border-hairline text-muted hover:text-ink hover:border-muted'
                          }`}
                        >
                          <div
                            className="text-xs font-bold"
                            style={{
                              fontFamily:
                                f.id === 'montserrat'
                                  ? "'Montserrat', sans-serif"
                                  : f.id === 'inter'
                                  ? "'Inter', sans-serif"
                                  : f.id === 'geist'
                                  ? "'Geist', sans-serif"
                                  : "'Outfit', sans-serif",
                            }}
                          >
                            {f.name}
                          </div>
                          <div className="text-[9px] opacity-70 truncate">{f.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title Style Selector (Solid vs Outline) */}
                  <div className="md:col-span-2 pt-2 border-t border-hairline space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                      Title Rendering Style (Estilo de Título)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTitleStyle('solid')}
                        className={`p-2 text-left rounded border transition-all flex items-center justify-between ${
                          titleStyle === 'solid'
                            ? 'bg-primary/10 border-primary text-white font-bold shadow-sm'
                            : 'bg-canvas-elevated border-hairline text-muted hover:text-ink hover:border-muted'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-ink">Solid Bold (Sólido Ejecutivo)</div>
                          <div className="text-[10px] text-muted">Relleno nítido de alto contraste y legibilidad</div>
                        </div>
                        {titleStyle === 'solid' && (
                          <span className="material-icons text-sm text-primary">check_circle</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTitleStyle('outline')}
                        className={`p-2 text-left rounded border transition-all flex items-center justify-between ${
                          titleStyle === 'outline'
                            ? 'bg-primary/10 border-primary text-white font-bold shadow-sm'
                            : 'bg-canvas-elevated border-hairline text-muted hover:text-ink hover:border-muted'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-ink">Outline Glow (Trazo Launchpad)</div>
                          <div className="text-[10px] text-muted">Efecto de contorno con trazo exterior</div>
                        </div>
                        {titleStyle === 'outline' && (
                          <span className="material-icons text-sm text-primary">check_circle</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slides List / Manager */}
          <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
                <span className="material-icons mr-xxs text-primary">view_carousel</span> Slides ({slides.length})
              </h2>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-muted uppercase font-bold mr-1">+ Add Slide:</span>
                <button
                  type="button"
                  onClick={() => addSlide('hero')}
                  className="px-2 py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline rounded-sm"
                >
                  + Hero
                </button>
                <button
                  type="button"
                  onClick={() => addSlide('pillars')}
                  className="px-2 py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline rounded-sm"
                >
                  + Pillars
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const existingIdx = slides.findIndex(s => s.type === 'showcase');
                    if (existingIdx !== -1 && existingIdx !== activeSlideIndex) {
                      setActiveSlideIndex(existingIdx);
                    } else {
                      addSlide('showcase');
                    }
                  }}
                  className="px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/40 rounded-sm flex items-center gap-1"
                  title="Edit existing Case Studies slide or add new"
                >
                  <span className="material-icons text-xs">collections</span>
                  {slides.some(s => s.type === 'showcase') ? 'Case Studies Slide' : '+ Case Studies'}
                </button>
                <button
                  type="button"
                  onClick={() => addSlide('metrics')}
                  className="px-2 py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline rounded-sm"
                >
                  + Metrics
                </button>
                <button
                  type="button"
                  onClick={() => addSlide('cta')}
                  className="px-2 py-1 bg-canvas hover:bg-canvas/80 text-ink text-[11px] font-bold uppercase tracking-wider border border-hairline rounded-sm"
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
                      ? 'border-primary bg-primary/10 text-white font-bold shadow-md ring-1 ring-primary'
                      : 'border-hairline bg-canvas text-muted hover:text-ink hover:border-muted'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider flex items-center justify-between gap-1">
                    <span>Slide {idx + 1}</span>
                    {s.type === 'showcase' && (
                      <span className="text-[9px] px-1 bg-primary/20 text-primary font-bold rounded">
                        {(s.showcaseItems || []).length} items
                      </span>
                    )}
                  </div>
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
                      Editing Slide {activeSlideIndex + 1} ({activeSlide.type})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveSlide(activeSlideIndex, 'up')}
                      disabled={activeSlideIndex === 0}
                      className="p-1 text-muted hover:text-ink disabled:opacity-30 border border-hairline rounded bg-canvas"
                      title="Move up"
                    >
                      <span className="material-icons text-sm">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(activeSlideIndex, 'down')}
                      disabled={activeSlideIndex === slides.length - 1}
                      className="p-1 text-muted hover:text-ink disabled:opacity-30 border border-hairline rounded bg-canvas"
                      title="Move down"
                    >
                      <span className="material-icons text-sm">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(activeSlideIndex)}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 transition-colors"
                      title="Delete this slide"
                    >
                      <span className="material-icons text-xs">delete</span>
                      Delete Slide
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                  <div className="space-y-xxs">
                    <label className="block text-caption-uppercase text-ink font-semibold">Slide Layout Type</label>
                    <select
                      value={activeSlide.type}
                      onChange={(e) => updateActiveSlide({ type: e.target.value as any })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="hero">Hero / Cover Slide</option>
                      <option value="pillars">Pillars of Service (3 Columns)</option>
                      <option value="problem_solution">Problem vs Solution</option>
                      <option value="showcase">Case Studies & Examples (Videos / Slides / Images)</option>
                      <option value="metrics">Impact Metrics</option>
                      <option value="roadmap">Implementation Roadmap</option>
                      <option value="cta">Call to Action / Contact</option>
                      <option value="custom">Custom Content</option>
                    </select>
                  </div>

                  <div className="space-y-xxs">
                    <label className="block text-caption-uppercase text-ink font-semibold">Top Badge</label>
                    <input
                      type="text"
                      value={activeSlide.badge || ''}
                      onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                      placeholder="e.g. Proven Work & Case Studies"
                    />
                  </div>

                  <div className="space-y-xxs md:col-span-2">
                    <label className="block text-caption-uppercase text-ink font-semibold">Slide Title</label>
                    <input
                      type="text"
                      value={activeSlide.title || ''}
                      onChange={(e) => updateActiveSlide({ title: e.target.value })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none font-bold"
                      placeholder="e.g. Featured Case Studies & Creative Work"
                    />
                  </div>

                  <div className="space-y-xxs md:col-span-2">
                    <label className="block text-caption-uppercase text-ink font-semibold">Subtitle</label>
                    <input
                      type="text"
                      value={activeSlide.subtitle || ''}
                      onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                      className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                      placeholder="e.g. Proven video production, slide decks, and digital asset examples"
                    />
                  </div>

                  {activeSlide.type !== 'showcase' && (
                    <div className="space-y-xxs md:col-span-2">
                      <label className="block text-caption-uppercase text-ink font-semibold">Content Text</label>
                      <textarea
                        rows={3}
                        value={activeSlide.content || ''}
                        onChange={(e) => updateActiveSlide({ content: e.target.value })}
                        className="w-full border border-hairline bg-canvas text-ink px-xs py-xxs text-sm focus:border-primary outline-none"
                        placeholder="Explanatory text for the slide..."
                      />
                    </div>
                  )}
                </div>

                {/* SHOWCASE / CASE STUDIES EDITOR */}
                {activeSlide.type === 'showcase' && (
                  <div className="mt-4 pt-4 border-t border-hairline space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-canvas-elevated p-3 border border-hairline rounded-sm">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <span className="material-icons text-sm">collections</span>
                          Case Studies & Examples ({(activeSlide.showcaseItems || []).length} Included)
                        </h3>
                        <p className="text-[11px] text-muted">
                          Click any Showcase Project below to toggle it in this slide, or create custom work examples.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={addShowcaseItem}
                          className="px-2.5 py-1.5 bg-primary text-black text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 hover:bg-primary/80"
                        >
                          <span className="material-icons text-xs">add</span>
                          Custom Example
                        </button>
                      </div>
                    </div>

                    {/* Quick 1-Click Showcase Projects Picker */}
                    {showcaseProjects && showcaseProjects.length > 0 && (
                      <div className="bg-canvas border border-hairline p-3 rounded-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                            <span className="material-icons text-xs text-primary">auto_awesome</span>
                            Select from Showcase Portfolio ({showcaseProjects.length} available):
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                          {showcaseProjects.map((p: any) => {
                            const isIncluded = (activeSlide.showcaseItems || []).some(
                              (item) => item.title === (p.titleEn || p.title) || item.mediaUrl === (p.images?.[0]?.url || p.featuredImage)
                            );

                            const toggleProject = () => {
                              if (isIncluded) {
                                const updated = (activeSlide.showcaseItems || []).filter(
                                  (item) => item.title !== (p.titleEn || p.title) && item.mediaUrl !== (p.images?.[0]?.url || p.featuredImage)
                                );
                                updateActiveSlide({ showcaseItems: updated });
                              } else {
                                importFromProject(p);
                              }
                            };

                            const imgUrl = p.images?.[0]?.url || p.featuredImage;

                            return (
                              <div
                                key={p.id}
                                onClick={toggleProject}
                                className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between gap-2.5 select-none ${
                                  isIncluded
                                    ? 'bg-primary/10 border-primary shadow-sm'
                                    : 'bg-canvas-elevated border-hairline hover:border-muted'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={p.title} className="w-11 h-8 object-cover rounded border border-hairline shrink-0" />
                                  ) : (
                                    <div className="w-11 h-8 bg-white/5 rounded flex items-center justify-center shrink-0">
                                      <span className="material-icons text-xs text-muted">image</span>
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-ink truncate">{p.titleEn || p.title}</h4>
                                    <span className="text-[9px] uppercase font-semibold text-primary block truncate">{p.category} • {p.clientName || 'Portfolio'}</span>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isIncluded ? (
                                    <span className="px-2 py-0.5 bg-primary text-black rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                      <span className="material-icons text-[12px]">check</span> Added
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-hairline text-muted rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                                      <span className="material-icons text-[12px]">add</span> Add
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Detailed Items List */}
                    <div className="space-y-3">
                      {(activeSlide.showcaseItems || []).map((item, itemIdx) => (
                        <div key={item.id || itemIdx} className="bg-canvas-elevated border border-hairline p-3 rounded-sm space-y-2 relative">
                          <div className="flex justify-between items-center border-b border-hairline pb-2">
                            <span className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center">
                                {itemIdx + 1}
                              </span>
                              {item.title || 'Work Example'}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteShowcaseItem(itemIdx)}
                              className="text-muted hover:text-semantic-error text-xs flex items-center gap-1"
                              title="Delete Example"
                            >
                              <span className="material-icons text-sm">delete</span>
                              <span className="text-[10px] uppercase font-semibold">Remove</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold uppercase text-muted">Project Title</label>
                              <input
                                type="text"
                                value={item.title || ''}
                                onChange={(e) => updateShowcaseItem(itemIdx, { title: e.target.value })}
                                className="w-full border border-hairline bg-canvas text-ink px-2 py-1 text-xs outline-none"
                                placeholder="e.g. DiDi Event Video Opener"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold uppercase text-muted">Media Type</label>
                              <select
                                value={item.mediaType || 'image'}
                                onChange={(e) => updateShowcaseItem(itemIdx, { mediaType: e.target.value as any })}
                                className="w-full border border-hairline bg-canvas text-ink px-2 py-1 text-xs outline-none"
                              >
                                <option value="video">Video (MP4 / YouTube / Vimeo)</option>
                                <option value="slide">Slide Deck / Document</option>
                                <option value="image">Graphic / Banner / Image</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold uppercase text-muted">Client</label>
                              <input
                                type="text"
                                value={item.client || ''}
                                onChange={(e) => updateShowcaseItem(itemIdx, { client: e.target.value })}
                                className="w-full border border-hairline bg-canvas text-ink px-2 py-1 text-xs outline-none"
                                placeholder="e.g. DiDi Global"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-muted">Media URL (Video, Image or Slide URL)</label>
                              <input
                                type="text"
                                value={item.mediaUrl || ''}
                                onChange={(e) => updateShowcaseItem(itemIdx, { mediaUrl: e.target.value, thumbnailUrl: item.thumbnailUrl || e.target.value })}
                                className="w-full border border-hairline bg-canvas text-ink px-2 py-1 text-xs outline-none font-mono"
                                placeholder="https://res.cloudinary.com/... or https://youtu.be/..."
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold uppercase text-muted">Tags (comma-separated)</label>
                              <input
                                type="text"
                                value={(item.tags || []).join(', ')}
                                onChange={(e) => updateShowcaseItem(itemIdx, { tags: e.target.value.split(',').map(t => t.trim()) })}
                                className="w-full border border-hairline bg-canvas text-ink px-2 py-1 text-xs outline-none"
                                placeholder="e.g. After Effects, 4K, Banners"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-3">
                              <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-bold uppercase text-muted">
                                  Gallery Images (URLs separated by comma or new lines)
                                </label>
                                <span className="text-[10px] text-primary font-bold">
                                  {(item.images || (item.mediaUrl ? [item.mediaUrl] : [])).length} image(s) in gallery
                                </span>
                              </div>
                              <textarea
                                rows={2}
                                value={(item.images || (item.mediaUrl ? [item.mediaUrl] : [])).join('\n')}
                                onChange={(e) => {
                                  const urls = e.target.value
                                    .split(/[\n,]+/)
                                    .map((u) => u.trim())
                                    .filter(Boolean);
                                  updateShowcaseItem(itemIdx, {
                                    images: urls,
                                    mediaUrl: urls[0] || item.mediaUrl,
                                    thumbnailUrl: urls[0] || item.thumbnailUrl,
                                  });
                                }}
                                className="w-full border border-hairline bg-canvas text-ink px-2 py-1 text-xs outline-none font-mono text-[11px]"
                                placeholder="https://res.cloudinary.com/image1.webp&#10;https://res.cloudinary.com/image2.webp"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-3">
                              <label className="block text-[10px] font-bold uppercase text-muted">Description / Deliverables</label>
                              <textarea
                                rows={2}
                                value={item.description || ''}
                                onChange={(e) => updateShowcaseItem(itemIdx, { description: e.target.value })}
                                className="w-full border border-hairline bg-canvas text-ink px-2 py-1 text-xs outline-none"
                                placeholder="Summary of scope, creative approach, and results..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-xs">
          <div className="flex items-center justify-between px-xs py-xxs bg-canvas border border-hairline">
            <span className="text-caption-uppercase text-muted font-bold text-xs flex items-center gap-1">
              <span className="material-icons text-sm text-primary">visibility</span>
              Live Real-Time Preview
            </span>
            <span className="text-[10px] text-muted uppercase tracking-wider">Slide {activeSlideIndex + 1} of {slides.length}</span>
          </div>

          <div className="border border-hairline rounded-sm overflow-hidden bg-[#07070b] h-[550px] flex flex-col shadow-2xl relative">
            <PitchViewer
              pitch={{
                ...mockPitch,
                slides: [activeSlide],
              }}
              companyProfile={companyProfile}
              showcaseProjects={showcaseProjects}
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
          Back
        </button>

        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="text-ink font-semibold hover:text-primary transition-colors text-xs uppercase tracking-wider flex items-center"
          >
            <span className="material-icons text-sm mr-xxs">fullscreen</span>
            Fullscreen
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-lg h-[40px] bg-primary text-black font-semibold hover:bg-primary/90 transition-all flex items-center justify-center uppercase tracking-wider text-xs disabled:opacity-50"
          >
            <span className="material-icons mr-xxs text-sm">save</span>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Pitch' : 'Save Pitch')}
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
              Close
            </button>
          </div>
          <PitchViewer
            pitch={mockPitch}
            companyProfile={companyProfile}
            showcaseProjects={showcaseProjects}
            initialSlideIndex={activeSlideIndex}
          />
        </div>
      )}

      {/* Import from Portfolio Modal */}
      {showImportShowcaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-canvas-elevated border border-hairline max-w-2xl w-full p-5 rounded-lg shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-hairline pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <span className="material-icons text-primary">collections</span>
                Select Work Example from Portfolio
              </h3>
              <button
                type="button"
                onClick={() => setShowImportShowcaseModal(false)}
                className="text-muted hover:text-ink text-sm"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {showcaseProjects.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-canvas border border-hairline p-3 rounded-md hover:border-primary/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0].url} alt={p.title} className="w-16 h-12 object-cover rounded-sm border border-hairline" />
                    ) : (
                      <div className="w-16 h-12 bg-white/5 flex items-center justify-center text-muted">
                        <span className="material-icons text-sm">image</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-ink truncate">{p.title}</h4>
                      <p className="text-[10px] text-primary uppercase font-semibold">{p.category} • {p.clientName || 'Launchpad'}</p>
                      <p className="text-[11px] text-muted line-clamp-1">{p.descriptionEn || p.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => importFromProject(p)}
                    className="px-3 py-1 bg-primary text-black text-xs font-bold uppercase tracking-wider rounded-sm shrink-0 hover:bg-primary/80"
                  >
                    Add to Slide
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
