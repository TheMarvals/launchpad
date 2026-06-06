'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Intersection Observer for staggered card animations
  useEffect(() => {
    if (projects.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleCards((prev) => new Set(prev).add(index));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    cardsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [projects.length]);

  // Parallax effect on mouse move for each card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, card: HTMLButtonElement | null) => {
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    const img = card.querySelector('img') as HTMLImageElement;
    if (img) {
      img.style.transform = `scale(1.1) translate(${(x - centerX) / 30}px, ${(y - centerY) / 30}px)`;
    }
  };

  const handleMouseLeave = (card: HTMLButtonElement | null) => {
    if (!card) return;
    const img = card.querySelector('img') as HTMLImageElement;
    if (img) {
      img.style.transform = '';
    }
  };

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (projects.length === 0) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const cardWidth = 320 + 4; // 320px card + 4px gap
        const nextScroll = scrollLeft + cardWidth;
        const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        scrollRef.current.scrollTo({
          left: nextScroll > maxScroll ? 0 : nextScroll,
          behavior: 'smooth',
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [projects.length]);

  if (projects.length === 0) return null;

  const openProject = (project: Project) => {
    setSelectedProject(project);
    setGalleryIndex(0);
  };

  const nextImage = () => {
    if (!selectedProject) return;
    setGalleryIndex((prev) => (prev + 1) % selectedProject.images.length);
  };

  const prevImage = () => {
    if (!selectedProject) return;
    setGalleryIndex((prev) => (prev - 1 + selectedProject.images.length) % selectedProject.images.length);
  };

  return (
    <section className="px-lg py-xl md:py-xxl border-t border-hairline relative">
      {/* Ambient section glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1100px] mx-auto relative z-10">
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

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="overflow-x-auto pt-1 pb-sm scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-xs min-w-max px-[2px]">
            {projects.map((project, idx) => {
              const featured = project.images.find((img) => img.isFeatured) || project.images[0];
              const isVisible = visibleCards.has(idx);
              return (
                <button
                  key={project.id}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  data-index={idx}
                  onClick={() => openProject(project)}
                  className={`group relative w-[280px] md:w-[320px] flex-shrink-0 text-left bg-[#0d0d12] border border-hairline/60 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] transition-all duration-400 ease-out cursor-pointer rounded-xl ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${idx * 100}ms` : '0ms',
                    transitionDuration: '400ms',
                    transitionProperty: 'opacity, transform, border-color, box-shadow',
                  }}
                >
                  {/* Image with parallax */}
                  <div
                    className="aspect-[4/3] bg-canvas relative overflow-hidden rounded-t-xl"
                    onMouseMove={(e) => handleMouseMove(e, cardsRef.current[idx])}
                    onMouseLeave={() => handleMouseLeave(cardsRef.current[idx])}
                  >
                    {featured ? (
                      <img
                        src={featured.url}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110"
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

                  {/* Info */}
                  <div className="p-sm pb-md relative z-10">
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

      {/* Gallery Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-[#03020a]/80 z-[100] flex items-center justify-center p-lg backdrop-blur-md"
          onClick={() => setSelectedProject(null)}
          style={{ animation: 'fadeIn 250ms ease-out' }}
        >
          <div
            className="bg-surface-card border border-hairline w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden rounded-xl shadow-large"
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
                className="text-muted hover:text-primary-active w-8 h-8 rounded-sm bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-300 hover:rotate-90 cursor-pointer"
              >
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>

            {/* Gallery */}
            <div className="flex-grow overflow-y-auto">
              {selectedProject.images.length > 0 ? (
                <div className="relative">
                  <div className="relative overflow-hidden bg-[#03020a]/50 flex items-center justify-center">
                    <img
                      key={galleryIndex}
                      src={selectedProject.images[galleryIndex].url}
                      alt={selectedProject.images[galleryIndex].caption || selectedProject.title}
                      className="w-full max-h-[55vh] object-contain transition-opacity duration-300"
                      style={{ animation: 'fadeIn 300ms ease-out' }}
                    />
                  </div>
                  {selectedProject.images[galleryIndex].caption && (
                    <p className="text-xs text-center text-muted/90 py-xxs px-sm bg-black/20 italic">{selectedProject.images[galleryIndex].caption}</p>
                  )}

                  {/* Gallery navigation */}
                  {selectedProject.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-sm top-1/2 -translate-y-1/2 w-[44px] h-[44px] rounded-sm bg-surface-card border border-hairline text-ink hover:text-primary-active hover:bg-surface-card-hover flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-medium cursor-pointer"
                      >
                        <span className="material-icons text-xl">chevron_left</span>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-sm top-1/2 -translate-y-1/2 w-[44px] h-[44px] rounded-sm bg-surface-card border border-hairline text-ink hover:text-primary-active hover:bg-surface-card-hover flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-medium cursor-pointer"
                      >
                        <span className="material-icons text-xl">chevron_right</span>
                      </button>

                      {/* Dots */}
                      <div className="flex items-center justify-center gap-xxs py-sm">
                        {selectedProject.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGalleryIndex(idx)}
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
                {selectedProject.description && (
                  <p className="text-sm text-body-strong leading-relaxed">{selectedProject.description}</p>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm pt-xs">
                  {selectedProject.technologies && (
                    <div className="flex flex-wrap gap-xxs">
                      {selectedProject.technologies.split(',').map((tech) => (                          <span key={tech.trim()} className="text-[9px] uppercase tracking-widest text-primary-active bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-sm font-semibold">{tech.trim()}</span>
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
      `}</style>
    </section>
  );
}
