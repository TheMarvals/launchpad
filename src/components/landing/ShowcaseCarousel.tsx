'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';

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
  images: Image[];
}

interface Props {
  projects: Project[];
}

export default function ShowcaseCarousel({ projects }: Props) {
  const t = useTranslations('Showcase');
  const locale = useLocale();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [prevImageUrl, setPrevImageUrl] = useState<string | null>(null);
  const [imageTransitioning, setImageTransitioning] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [sectionVisible, setSectionVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const autoSpeedRef = useRef<number>(0.6);
  const pausedRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);


  // Intersection Observer for staggered card animations
  useEffect(() => {
    // Observe section entrance
    if (sectionRef.current) {
      const sectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setSectionVisible(true);
            sectionObserver.unobserve(entry.target);
          }
        },
        { threshold: 0.1 }
      );
      sectionObserver.observe(sectionRef.current);
      return () => sectionObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (projects.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {          entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleCards((prev) => new Set(prev).add(index));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe all cards (original + cloned) for staggered entrance
    Object.values(cardsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [projects.length]);

  // The showcase carousel image should stay stable while scrolling.
  const handleMouseMove = (_: React.MouseEvent<HTMLDivElement>, _card: HTMLButtonElement | null) => {
    return;
  };

  const handleMouseLeave = (_: HTMLButtonElement | null) => {
    return;
  };

  // Scroll by one card width with infinite wrap-around
  const scrollByCard = useCallback((direction: 'prev' | 'next') => {
    const container = scrollRef.current;
    if (!container) return;

    const firstCard = cardsRef.current.find(Boolean) as HTMLButtonElement | null;
    const track = container.querySelector('[data-carousel-track]') as HTMLDivElement | null;
    if (!firstCard || !track) return;

    const cardWidth = firstCard.offsetWidth;
    const style = getComputedStyle(track);
    const gapRaw = style.gap || style.columnGap || '0px';
    const gap = parseFloat(gapRaw) || 0;
    const totalCardStep = cardWidth + gap;

    // Pause auto-scroll while animating the manual scroll
    pausedRef.current = true;
    container.scrollTo({
      left: container.scrollLeft + (direction === 'next' ? totalCardStep : -totalCardStep),
      behavior: 'smooth',
    });

    // Resume auto-scroll after smooth scroll completes (timeout ~= 450ms)
    setTimeout(() => {
      pausedRef.current = false;
    }, 500);
  }, []);

  // Clone projects for seamless infinite scroll
  const clonedProjects = [...projects, ...projects];

  // Continuous auto-scroll with seamless subtraction reset at midpoint
  useEffect(() => {
    if (projects.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;

    // use refs so handlers and raf use mutable state
    autoSpeedRef.current = 1.0;
    pausedRef.current = false;

    if (process.env.NODE_ENV !== 'production') {
      console.debug('ShowcaseCarousel init', { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, projectsLength: projects.length });
    }

    const scroll = () => {
      if (!el) return;
      if (!pausedRef.current) {
        el.scrollLeft += autoSpeedRef.current;
      }

      // When reaching the duplicated half, subtract half to continue seamlessly
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollLeft -= half;
        el.scrollLeft = Math.round(el.scrollLeft);
        if (process.env.NODE_ENV !== 'production') console.debug('ShowcaseCarousel reset', { scrollLeft: el.scrollLeft, half });
      }

      rafRef.current = requestAnimationFrame(scroll);
    };

    const handleMouseEnter = () => { pausedRef.current = true; };
    const handleMouseLeave = () => { pausedRef.current = false; };
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    rafRef.current = requestAnimationFrame(scroll);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [projects.length]);

  // Inicializar en la mitad del track duplicado para un loop suave
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    requestAnimationFrame(() => {
      el.scrollLeft = Math.round(el.scrollWidth / 2 - el.clientWidth / 2);
    });
  }, [projects.length]);

  if (projects.length === 0) return null;

  const openProject = (project: Project) => {
    setSelectedProject(project);
    setPrevImageUrl(null);
    setImageTransitioning(false);
    setGalleryIndex(0);
  };

  const navigateImage = (direction: 'next' | 'prev') => {
    if (!selectedProject || imageTransitioning) return;
    const currentUrl = selectedProject.images[galleryIndex].url;
    setPrevImageUrl(currentUrl);
    
    if (direction === 'next') {
      setGalleryIndex((prev) => (prev + 1) % selectedProject.images.length);
    } else {
      setGalleryIndex((prev) => (prev - 1 + selectedProject.images.length) % selectedProject.images.length);
    }
    
    // Trigger the fade-out animation on the old image
    setImageTransitioning(true);
  };

  const handlePrevFadeEnd = () => {
    setPrevImageUrl(null);
    setImageTransitioning(false);
  };

  return (
    <>
      <section ref={sectionRef} className={`px-0 md:px-lg py-xl md:py-xxl border-t border-hairline relative transition-all duration-700 ease-out ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {/* Ambient section glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,98,255,0.12) 0%, transparent 70%)' }} />

      <div className="max-w-[1100px] mx-auto relative z-10 px-xs md:px-0">
        {/* Animated title */}
        <div className="text-center mb-lg">
          <div className="inline-block relative">
            <h2
              className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tighter uppercase"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {t('sectionTitle')}
            </h2>
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-sm animate-pulse" style={{ width: 'clamp(60px, 8vw, 100px)' }} />
          </div>
          <p className="text-body text-muted max-w-[500px] mx-auto text-sm mt-sm">
            {t('sectionSubtitle')}
          </p>
        </div>

        {/* Carousel wrapper with nav buttons */}
        <div className="relative group/carousel">
          {/* Previous button (always visible) */}
          <button
            onClick={() => scrollByCard('prev')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0d0d12] border border-hairline/60 text-ink hover:text-primary-active hover:border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-medium hover:shadow-large opacity-100 cursor-pointer"
            aria-label="Previous projects"
          >
            <span className="material-icons text-xl">chevron_left</span>
          </button>

          {/* Next button (always visible) */}
          <button
            onClick={() => scrollByCard('next')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0d0d12] border border-hairline/60 text-ink hover:text-primary-active hover:border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-medium hover:shadow-large opacity-100 cursor-pointer"
            aria-label="Next projects"
          >
            <span className="material-icons text-xl">chevron_right</span>
          </button>

          {/* Carousel track */}
          <div
            ref={scrollRef}
            className="overflow-hidden pt-1 pb-sm"
            style={{ scrollbarWidth: 'none' }}
          >
          <div className="flex gap-xs min-w-max px-[2px] snap-x" data-carousel-track>

              {clonedProjects.map((project, idx) => {
                const featured = project.images.find((img) => img.isFeatured) || project.images[0];
                const isVisible = visibleCards.has(idx);
                return (
                  <button
                    key={`${project.id}-${idx}`}
                    ref={(el) => { cardsRef.current[idx] = el; }}
                    data-index={idx}
                    onClick={() => openProject(project)}
                    className={`group relative w-[280px] md:w-[320px] flex-none flex flex-col text-left bg-[#0d0d12] border border-hairline/60 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] transition-all duration-400 ease-out cursor-pointer rounded-xl snap-start snap-always ${
                      isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      transitionDelay: isVisible ? `${Math.min(idx * 60, 600)}ms` : '0ms',
                      transitionDuration: '500ms',
                      transitionProperty: 'opacity, transform, border-color, box-shadow',
                    }}
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] flex-shrink-0 bg-[#0d0d12] relative overflow-hidden rounded-t-xl -mt-px">
                      {featured ? (
                        <img
                          src={featured.url}
                          alt={featured.caption || project.title}
                          className="absolute inset-0 w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <span className="material-icons text-4xl">image</span>
                        </div>
                      )}
                      {/* Category badge */}
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest label-caps bg-canvas/80 text-primary-active border border-hairline/50 backdrop-blur-md rounded-sm shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                        {t(`categories.${project.category}`)}
                      </span>
                      {/* Image count */}
                      {project.images.length > 1 && (
                        <span className="absolute bottom-3 left-3 bg-canvas/80 text-body-strong border border-hairline/30 text-[9px] px-2 py-0.5 flex items-center gap-[4px] backdrop-blur-md rounded-sm label-caps">
                          <span className="material-icons text-[11px] text-primary-active">collections</span>
                          {project.images.length}
                        </span>
                      )}
                    </div>

                    {/* Info - flex-1 fills remaining space so all cards have equal height */}
                    <div className="p-sm pb-md relative z-10 flex-1">
                      <h3 className="text-base font-semibold text-ink mb-xxs truncate group-hover:text-primary-active transition-colors">{project.title}</h3>
                      {project.clientName && (
                        <p className="text-xs text-muted/80 mt-[2px] font-medium">{project.clientName}</p>
                      )}
                      {project.technologies && (
                        <div className="flex flex-wrap gap-xxs mt-sm">
                          {project.technologies.split(',').slice(0, 3).map((tech) => (
                            <span key={tech.trim()} className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium transition-all duration-300 group-hover:border-primary-active/30 group-hover:bg-primary/15">{tech.trim()}</span>
                          ))}
                          {project.technologies.split(',').length > 3 && (
                            <span className="text-[8px] text-muted self-center font-bold pl-xxxs">+{project.technologies.split(',').length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Animated hover accent line (top) */}
                    <div className="absolute top-0 left-5 right-5 h-[1.5px] bg-gradient-to-r from-transparent via-primary-active to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scroll hint - fades after first scroll */}
          <div className="flex items-center justify-center gap-xxs mt-sm text-muted">
            <span className="material-icons text-sm animate-pulse">chevron_left</span>
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">{t('scrollHint')}</span>
            <span className="material-icons text-sm animate-pulse">chevron_right</span>
          </div>
        </div>
      </div>
      </section>

      {/* Gallery Modal - outside section to avoid translate clipping fixed positioning */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-[#03020a]/80 z-[100] flex items-center justify-center p-xs md:p-lg backdrop-blur-md"
          onClick={() => setSelectedProject(null)}
          style={{ animation: 'fadeIn 250ms ease-out' }}
        >
          <div
            className="bg-[#0d0d12] border border-hairline w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden rounded-xl shadow-large"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 350ms ease-out' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-sm border-b border-primary/10">
              <div>
                <h2 className="text-title-sm font-semibold uppercase tracking-wide text-ink">{selectedProject.title}</h2>
                {selectedProject.clientName && (
                  <p className="text-xs text-muted/80">{selectedProject.clientName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-muted hover:text-primary-active w-10 h-10 md:w-8 md:h-8 rounded-sm bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-300 hover:rotate-90 cursor-pointer"
              >
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>

            {/* Gallery */}
            <div className="flex-grow overflow-y-auto">
              {selectedProject.images.length > 0 ? (
                <div className="relative group">
                  <div className="relative overflow-hidden bg-[#03020a]/50 flex items-center justify-center min-h-[200px] max-h-[55vh] aspect-[16/9]">
                    {/* Previous image fading out via CSS keyframe animation */}
                    {prevImageUrl && (
                      <img
                        src={prevImageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{ animation: 'galleryFadeOut 400ms ease-out forwards' }}
                        onAnimationEnd={handlePrevFadeEnd}
                      />
                    )}
                    {/* Current image fades in */}
                    <img
                      key={galleryIndex}
                      src={selectedProject.images[galleryIndex].url}
                      alt={selectedProject.images[galleryIndex].caption || selectedProject.title}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ animation: prevImageUrl ? 'galleryFadeIn 400ms ease-out' : 'none' }}
                    />
                  </div>
                  {/* Gallery navigation */}
                  {selectedProject.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                        className="absolute left-sm top-1/2 -translate-y-1/2 w-[44px] h-[44px] rounded-sm bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-primary-active hover:bg-black/50 hover:border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-medium opacity-30 group-hover:opacity-100 cursor-pointer"
                      >
                        <span className="material-icons text-xl">chevron_left</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                        className="absolute right-sm top-1/2 -translate-y-1/2 w-[44px] h-[44px] rounded-sm bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-primary-active hover:bg-black/50 hover:border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-medium opacity-30 group-hover:opacity-100 cursor-pointer"
                      >
                        <span className="material-icons text-xl">chevron_right</span>
                      </button>

                      {/* Dots */}
                      <div className="flex items-center justify-center gap-xxs py-sm">
                        {selectedProject.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!imageTransitioning && idx !== galleryIndex) {
                                const currentUrl = selectedProject.images[galleryIndex].url;
                                setPrevImageUrl(currentUrl);
                                setGalleryIndex(idx);
                                setImageTransitioning(true);
                              }
                            }}
                            className={`transition-all duration-300 cursor-pointer h-1.5 rounded-full ${
                              idx === galleryIndex ? 'bg-primary-active w-6' : 'bg-muted/30 hover:bg-muted w-1.5'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-xl text-center text-muted text-sm">{t('noImages')}</div>
              )}

              {/* Project details */}
              <div className="p-sm border-t border-primary/10 space-y-sm bg-black/10">
                {(selectedProject.descriptionEs || selectedProject.descriptionEn || selectedProject.description) && (
                  <p className="text-sm text-body-strong leading-relaxed">
                    {locale === 'es' ? (selectedProject.descriptionEs || selectedProject.description || selectedProject.descriptionEn) : (selectedProject.descriptionEn || selectedProject.description || selectedProject.descriptionEs)}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm pt-xs">
                  {selectedProject.technologies && (
                    <div className="flex flex-wrap gap-xxs">
                      {selectedProject.technologies.split(',').map((tech) => (
                        <span key={tech.trim()} className="text-[9px] uppercase tracking-widest text-primary-active bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-sm font-semibold">{tech.trim()}</span>
                      ))}
                    </div>
                  )}

                  {selectedProject.projectUrl && (
                    <a
                      href={selectedProject.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start sm:self-center inline-flex items-center gap-xs text-xs font-bold uppercase tracking-wider text-primary-active bg-primary/10 hover:bg-primary/20 border border-primary/30 px-4 py-2 rounded-sm transition-all duration-300 hover:gap-sm shadow-small hover:shadow-medium"
                    >
                      <span className="material-icons text-sm">open_in_new</span>
                      {t('viewProject')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes galleryFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes galleryFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
