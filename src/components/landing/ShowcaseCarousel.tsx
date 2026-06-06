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
    <section className="px-lg py-xl md:py-xxl border-t border-hairline overflow-hidden">
      <div className="max-w-[1100px] mx-auto">
        {/* Animated title */}
        <div className="text-center mb-lg">
          <div className="inline-block relative">
            <h2
              className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tighter uppercase"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {t('sectionTitle')}
            </h2>
            <div className="h-[2px] bg-primary mx-auto mt-sm animate-pulse" style={{ width: 'clamp(60px, 8vw, 100px)' }} />
          </div>
          <p className="text-body text-muted max-w-[500px] mx-auto text-sm mt-sm">
            {t('sectionSubtitle')}
          </p>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="overflow-x-auto pb-sm scroll-smooth"
          style={{ scrollbarWidth: 'thin' }}
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
                  className={`group relative w-[280px] md:w-[320px] flex-shrink-0 text-left bg-canvas-elevated border border-hairline overflow-hidden hover:border-primary/40 transition-all duration-300 cursor-pointer ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${idx * 100}ms` : '0ms',
                    transitionDuration: '600ms',
                    transitionProperty: 'opacity, transform, border-color',
                  }}
                >
                  {/* Image with parallax */}
                  <div
                    className="aspect-[4/3] bg-canvas relative overflow-hidden"
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
                    <span className="absolute top-xxs right-xxs px-xxs py-[2px] text-[9px] font-bold uppercase tracking-wider bg-ink/60 text-white backdrop-blur-sm">
                      {t(`categories.${project.category}`)}
                    </span>
                    {/* Image count */}
                    {project.images.length > 1 && (
                      <span className="absolute bottom-xxs left-xxs bg-ink/60 text-white text-[10px] px-xxs py-[2px] flex items-center gap-[2px] backdrop-blur-sm">
                        <span className="material-icons text-[12px]">collections</span>
                        {project.images.length}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-sm">
                    <h3 className="font-medium text-ink text-sm truncate group-hover:text-primary transition-colors">{project.title}</h3>
                    {project.clientName && (
                      <p className="text-xs text-muted mt-[2px]">{project.clientName}</p>
                    )}
                    {project.technologies && (
                      <div className="flex flex-wrap gap-xxxs mt-xs">
                        {project.technologies.split(',').slice(0, 3).map((tech) => (
                          <span key={tech.trim()} className="text-[8px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[1px]">{tech.trim()}</span>
                        ))}
                        {project.technologies.split(',').length > 3 && (
                          <span className="text-[8px] text-muted">+{project.technologies.split(',').length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Animated hover accent */}
                  <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-500 ease-out" />
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
          className="fixed inset-0 bg-ink/80 z-[100] flex items-center justify-center p-lg"
          onClick={() => setSelectedProject(null)}
          style={{ animation: 'fadeIn 200ms ease-out' }}
        >
          <div
            className="bg-canvas-elevated border border-hairline w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 300ms ease-out' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-sm border-b border-hairline">
              <div>
                <h2 className="text-title-sm font-medium text-ink">{selectedProject.title}</h2>
                {selectedProject.clientName && (
                  <p className="text-xs text-muted">{selectedProject.clientName}</p>
                )}
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-muted hover:text-ink transition-colors cursor-pointer">
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Gallery */}
            <div className="flex-grow overflow-y-auto">
              {selectedProject.images.length > 0 ? (
                <div className="relative">
                  <div className="relative overflow-hidden bg-canvas">
                    <img
                      key={galleryIndex}
                      src={selectedProject.images[galleryIndex].url}
                      alt={selectedProject.images[galleryIndex].caption || selectedProject.title}
                      className="w-full max-h-[55vh] object-contain transition-opacity duration-300"
                      style={{ animation: 'fadeIn 300ms ease-out' }}
                    />
                  </div>
                  {selectedProject.images[galleryIndex].caption && (
                    <p className="text-xs text-center text-muted py-xxs px-sm">{selectedProject.images[galleryIndex].caption}</p>
                  )}

                  {/* Gallery navigation */}
                  {selectedProject.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-sm top-1/2 -translate-y-1/2 w-[40px] h-[40px] bg-ink/50 hover:bg-ink/70 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
                      >
                        <span className="material-icons">chevron_left</span>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-sm top-1/2 -translate-y-1/2 w-[40px] h-[40px] bg-ink/50 hover:bg-ink/70 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
                      >
                        <span className="material-icons">chevron_right</span>
                      </button>

                      {/* Dots */}
                      <div className="flex items-center justify-center gap-xxxs py-xs">
                        {selectedProject.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGalleryIndex(idx)}
                            className={`transition-all duration-300 cursor-pointer ${
                              idx === galleryIndex ? 'bg-primary w-[20px] h-[8px] rounded-full' : 'bg-hairline hover:bg-muted w-[8px] h-[8px] rounded-full'
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
              <div className="p-sm border-t border-hairline space-y-xs">
                {selectedProject.description && (
                  <p className="text-sm text-ink leading-relaxed">{selectedProject.description}</p>
                )}
                {selectedProject.technologies && (
                  <div className="flex flex-wrap gap-xxxs">
                    {selectedProject.technologies.split(',').map((tech) => (
                      <span key={tech.trim()} className="text-[9px] uppercase tracking-widest text-muted bg-canvas border border-hairline px-xxs py-[2px]">{tech.trim()}</span>
                    ))}
                  </div>
                )}
                {selectedProject.projectUrl && (
                  <a
                    href={selectedProject.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-xxs text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-all duration-200 hover:gap-sm"
                  >
                    <span className="material-icons text-sm">open_in_new</span>
                    {t('viewProject')}
                  </a>
                )}
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
