'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';

export interface PitchSlide {
  id: string;
  type: 'hero' | 'pillars' | 'problem_solution' | 'metrics' | 'roadmap' | 'showcase' | 'cta' | 'custom';
  badge?: string;
  title: string;
  subtitle?: string;
  content?: string;
  cards?: Array<{
    title: string;
    subtitle?: string;
    description: string;
    icon?: string;
    tags?: string[];
    highlight?: boolean;
  }>;
  metrics?: Array<{
    value: string;
    label: string;
    subtext?: string;
    icon?: string;
  }>;
  timeline?: Array<{
    phase: string;
    title: string;
    duration?: string;
    deliverables: string[];
  }>;
  cta?: {
    text: string;
    link?: string;
    secondaryText?: string;
    secondaryLink?: string;
  };
  clientName?: string;
  presenterName?: string;
  presenterRole?: string;
  imageUrl?: string;
}

interface PitchViewerProps {
  pitch: {
    id?: string;
    title: string;
    subtitle?: string | null;
    clientName?: string | null;
    client?: any;
    user?: any;
    theme?: string;
    slides: PitchSlide[] | any;
  };
  companyProfile?: any;
  isEditorPreview?: boolean;
  initialMode?: 'deck' | 'scroll';
}

export default function PitchViewer({
  pitch,
  companyProfile,
  isEditorPreview = false,
  initialMode = 'deck',
}: PitchViewerProps) {
  const locale = useLocale();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'deck' | 'scroll'>(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawSlides = Array.isArray(pitch.slides) ? pitch.slides : [];
  const slides: PitchSlide[] = rawSlides.length > 0 ? rawSlides : [
    {
      id: 'default-1',
      type: 'hero',
      badge: '360° Creative & Technology Support',
      title: pitch.title || 'LAUNCHPAD',
      subtitle: pitch.subtitle || 'Where ideas take off',
      content: 'We design, build, and scale high-performance digital ecosystems that drive measurable growth.',
      clientName: pitch.client?.razonSocial || pitch.clientName || 'Cliente Especial',
      cta: {
        text: 'Agendar Reunión',
        secondaryText: 'Explorar Propuesta',
      },
    },
  ];

  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  }, [totalSlides]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (isEditorPreview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'deck') return;
      if (['ArrowRight', 'Space', 'PageDown'].includes(e.code)) {
        e.preventDefault();
        nextSlide();
      } else if (['ArrowLeft', 'PageUp'].includes(e.code)) {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorPreview, viewMode, nextSlide, prevSlide]);

  const clientDisplayName = pitch.client?.razonSocial || pitch.clientName || currentSlide.clientName;
  const brandName = companyProfile?.brandNameHeader || 'LAUNCHPAD';
  const presenterName = currentSlide.presenterName || pitch.user?.name || companyProfile?.user?.name || 'Eduardo Marval';
  const presenterRole = currentSlide.presenterRole || pitch.user?.cargo || companyProfile?.user?.cargo || 'Lead Solution Architect';

  // Render a single slide
  const renderSlideContent = (slide: PitchSlide, index: number) => {
    switch (slide.type) {
      case 'hero':
        return (
          <div className="relative z-10 max-w-[900px] w-full text-center px-4 md:px-6 my-auto animate-fade-in">
            {slide.badge && (
              <p className="text-[clamp(0.65rem,1.2vw,0.85rem)] uppercase tracking-[0.3em] text-primary font-bold mb-4">
                {slide.badge}
              </p>
            )}

            <h1
              className="text-[clamp(3.5rem,11vw,7.5rem)] font-black tracking-tighter leading-none mb-3 select-none"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1.5px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {slide.title || brandName}
            </h1>

            {slide.subtitle && (
              <p
                className="text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold tracking-tight mb-4 text-white/90"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {slide.subtitle}
              </p>
            )}

            {clientDisplayName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md">
                <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">PREPARADO PARA:</span>
                <span className="text-xs font-bold text-white uppercase">{clientDisplayName}</span>
              </div>
            )}

            {slide.content && (
              <p className="text-body text-slate-300 max-w-[660px] mx-auto leading-relaxed mb-8 text-sm md:text-base">
                {slide.content}
              </p>
            )}

            {slide.cta && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {slide.cta.text && (
                  <div className="bg-primary text-black font-bold uppercase tracking-[0.2em] px-8 h-[48px] rounded-sm text-xs flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <span className="material-icons mr-2 text-[18px]">calendar_today</span>
                    {slide.cta.text}
                  </div>
                )}
                {slide.cta.secondaryText && (
                  <div className="border border-white/20 text-white hover:border-primary/50 px-6 h-[48px] rounded-sm text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center">
                    {slide.cta.secondaryText}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'pillars':
        return (
          <div className="relative z-10 max-w-[1100px] w-full px-4 md:px-6 my-auto animate-fade-in">
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-2 block">
                  {slide.badge}
                </span>
              )}
              <h2
                className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-tighter uppercase"
                style={{
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStrokeColor: '#ffffff',
                  WebkitTextStrokeWidth: '1.2px',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[600px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-3 w-24"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(slide.cards || []).map((card, cIdx) => (
                <div
                  key={cIdx}
                  className="relative bg-[#0d0d14] border border-white/10 hover:border-primary/50 p-6 rounded-xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-4 right-4 h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                    <span className="material-icons text-[24px]">{card.icon || 'star'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                  {card.subtitle && (
                    <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold mb-3">
                      {card.subtitle}
                    </p>
                  )}
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">{card.description}</p>
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/10">
                      {card.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[9px] uppercase tracking-widest text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'problem_solution':
        return (
          <div className="relative z-10 max-w-[1000px] w-full px-4 md:px-6 my-auto animate-fade-in">
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-2 block">
                  {slide.badge}
                </span>
              )}
              <h2
                className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-tighter uppercase"
                style={{
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStrokeColor: '#ffffff',
                  WebkitTextStrokeWidth: '1.2px',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[650px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(slide.cards || []).map((card, cIdx) => (
                <div
                  key={cIdx}
                  className={`p-6 rounded-xl border relative ${
                    card.highlight
                      ? 'bg-gradient-to-b from-[#161226] to-[#0d0d14] border-primary/40 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                      : 'bg-[#0d0d14] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`material-icons text-2xl ${card.highlight ? 'text-primary' : 'text-slate-400'}`}>
                      {card.icon || (card.highlight ? 'verified' : 'warning')}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">{card.title}</h3>
                      {card.subtitle && (
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{card.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'metrics':
        return (
          <div className="relative z-10 max-w-[1000px] w-full px-4 md:px-6 my-auto animate-fade-in text-center">
            {slide.badge && (
              <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-2 block">
                {slide.badge}
              </span>
            )}
            <h2
              className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-tighter uppercase mb-3"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1.2px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-slate-300 text-sm md:text-base max-w-[600px] mx-auto mb-10">
                {slide.subtitle}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(slide.metrics || []).map((metric, mIdx) => (
                <div
                  key={mIdx}
                  className="bg-[#0d0d14] border border-white/10 p-6 rounded-xl relative group hover:border-primary/40 transition-colors"
                >
                  <div className="text-[clamp(2rem,3.5vw,3rem)] font-black tracking-tight text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <span className="text-primary">{metric.value.charAt(0) === '+' || metric.value.charAt(0) === '$' ? metric.value.charAt(0) : ''}</span>
                    {metric.value.replace(/^[+$]/, '')}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">{metric.label}</div>
                  {metric.subtext && <div className="text-[10px] text-slate-400">{metric.subtext}</div>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'roadmap':
        return (
          <div className="relative z-10 max-w-[1100px] w-full px-4 md:px-6 my-auto animate-fade-in">
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-2 block">
                  {slide.badge}
                </span>
              )}
              <h2
                className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-tighter uppercase"
                style={{
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStrokeColor: '#ffffff',
                  WebkitTextStrokeWidth: '1.2px',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[600px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(slide.timeline || []).map((step, sIdx) => (
                <div key={sIdx} className="bg-[#0d0d14] border border-white/10 p-6 rounded-xl relative">
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">{step.phase}</span>
                    {step.duration && <span className="text-[10px] font-bold text-slate-400">{step.duration}</span>}
                  </div>
                  <h3 className="text-base font-bold text-white mb-3">{step.title}</h3>
                  <ul className="space-y-1.5">
                    {step.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="material-icons text-[14px] text-primary mt-0.5">check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="relative z-10 max-w-[800px] w-full text-center px-4 md:px-6 my-auto animate-fade-in">
            {slide.badge && (
              <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-3 block">
                {slide.badge}
              </span>
            )}
            <h2
              className="text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-tighter leading-none mb-4 uppercase"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1.5px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-lg md:text-xl font-semibold text-white/90 mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {slide.subtitle}
              </p>
            )}
            {slide.content && (
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-[600px] mx-auto">
                {slide.content}
              </p>
            )}

            <div className="bg-[#0d0d14] border border-white/10 p-6 rounded-xl max-w-[450px] mx-auto mb-8 text-left space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto Directo</div>
              <div className="text-base font-bold text-white">{presenterName}</div>
              <div className="text-xs text-primary font-medium">{presenterRole}</div>
              <div className="text-xs text-slate-300 pt-2 border-t border-white/10">
                {companyProfile?.email || 'e.marval@themarvals.com'} • {companyProfile?.phone || '+569 94438833'}
              </div>
            </div>

            {slide.cta?.text && (
              <div className="inline-flex bg-primary text-black font-bold uppercase tracking-[0.2em] px-8 h-[50px] rounded-sm text-xs items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                <span className="material-icons mr-2 text-[18px]">rocket_launch</span>
                {slide.cta.text}
              </div>
            )}
          </div>
        );

      case 'custom':
      default:
        return (
          <div className="relative z-10 max-w-[900px] w-full px-4 md:px-6 my-auto animate-fade-in">
            {slide.badge && (
              <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-2 block text-center">
                {slide.badge}
              </span>
            )}
            <h2
              className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-tighter uppercase text-center mb-6"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1.2px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {slide.title}
            </h2>
            <div
              className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm md:text-base space-y-4"
              dangerouslySetInnerHTML={{ __html: slide.content || '' }}
            />
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-screen bg-[#07070b] text-white font-sans overflow-hidden select-none flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-[250px] -right-[150px] w-[600px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.22) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[200px] -left-[150px] w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,220,229,0.18) 0%, transparent 70%)' }}
        />
      </div>

      {/* Watermark */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none hidden md:block z-0">
        <h1
          className="whitespace-nowrap font-black tracking-tighter transform -rotate-90"
          style={{
            fontSize: '260px',
            WebkitTextFillColor: 'transparent',
            WebkitTextStrokeColor: '#ffffff',
            WebkitTextStrokeWidth: '2px',
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1,
          }}
        >
          {brandName}
        </h1>
      </div>

      {/* Top Bar Navigation */}
      {!isEditorPreview && (
        <header className="relative z-30 px-4 md:px-8 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="text-lg font-black tracking-tighter"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {brandName}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full hidden sm:inline">
              PITCH DECK
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-full p-1 text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setViewMode('deck')}
                className={`px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${
                  viewMode === 'deck' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-icons text-xs">slideshow</span>
                Deck
              </button>
              <button
                type="button"
                onClick={() => setViewMode('scroll')}
                className={`px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${
                  viewMode === 'scroll' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-icons text-xs">view_agenda</span>
                Scroll
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-primary/40 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
            >
              <span className="material-icons text-sm">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      {viewMode === 'deck' ? (
        <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4 md:p-8 min-h-0">
          {renderSlideContent(currentSlide, currentSlideIndex)}
        </main>
      ) : (
        <main className="flex-1 relative z-10 overflow-y-auto p-4 md:p-8 space-y-16">
          {slides.map((slide, idx) => (
            <section key={slide.id || idx} className="min-h-[70vh] flex flex-col items-center justify-center py-8 border-b border-white/5 last:border-none">
              {renderSlideContent(slide, idx)}
            </section>
          ))}
        </main>
      )}

      {/* Bottom Deck Controls (Deck Mode) */}
      {viewMode === 'deck' && !isEditorPreview && (
        <footer className="relative z-30 px-4 md:px-8 py-3 flex items-center justify-between border-t border-white/5 backdrop-blur-sm shrink-0">
          <div className="flex-1 min-w-0 text-left text-xs font-bold text-slate-400 tracking-wider truncate pr-4">
            {clientDisplayName ? <span className="text-white uppercase">{clientDisplayName}</span> : brandName}
          </div>

          {/* Slide Navigation Buttons - Absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              type="button"
              onClick={prevSlide}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 text-white flex items-center justify-center transition-colors"
              title="Anterior (←)"
            >
              <span className="material-icons text-lg">chevron_left</span>
            </button>

            <span className="text-xs font-black uppercase tracking-widest text-primary px-2 min-w-[52px] text-center">
              {currentSlideIndex + 1} / {totalSlides}
            </span>

            <button
              type="button"
              onClick={nextSlide}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 text-white flex items-center justify-center transition-colors"
              title="Siguiente (→)"
            >
              <span className="material-icons text-lg">chevron_right</span>
            </button>
          </div>

          <div className="flex-1 min-w-0 text-right text-[10px] uppercase tracking-widest text-slate-500 hidden sm:block pl-4">
            Usa las flechas ← → o barra espaciadora
          </div>
        </footer>
      )}
    </div>
  );
}
