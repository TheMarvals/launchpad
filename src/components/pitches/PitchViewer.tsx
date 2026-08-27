'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';

export interface ShowcaseItem {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  mediaType?: 'image' | 'video' | 'slide' | 'embed';
  mediaUrl: string;
  thumbnailUrl?: string;
  images?: string[];
  tags?: string[];
  client?: string;
  externalUrl?: string;
}

export const parsePitchTheme = (themeStr?: string, pitchTitle?: string, clientName?: string) => {
  const isDiDi = Boolean(
    (pitchTitle && pitchTitle.toLowerCase().includes('didi')) ||
    (clientName && clientName.toLowerCase().includes('didi')) ||
    themeStr === 'orange' ||
    themeStr === 'didi'
  );

  let color = isDiDi ? '#FF7D00' : '#A855F7';
  let font = 'outfit'; // 'outfit' | 'montserrat' | 'inter' | 'geist'

  if (themeStr) {
    if (themeStr.includes('|')) {
      const [c, f] = themeStr.split('|');
      if (c) color = c.trim();
      if (f) font = f.trim();
    } else if (themeStr.startsWith('#')) {
      color = themeStr.trim();
    } else if (themeStr === 'orange' || themeStr === 'didi') {
      color = '#FF7D00';
    } else if (themeStr === 'purple' || themeStr === 'midnight' || themeStr === 'launchpad') {
      color = '#A855F7';
    } else if (themeStr === 'blue' || themeStr === 'cyber') {
      color = '#0062FF';
    } else if (themeStr === 'cyan') {
      color = '#00DCE5';
    } else if (themeStr === 'emerald') {
      color = '#10B981';
    } else if (themeStr === 'crimson') {
      color = '#EF4444';
    } else if (themeStr === 'amber') {
      color = '#F59E0B';
    }
  }

  return { color, font };
};

export const hexToRgba = (hex: string, alpha: number = 0.25) => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(255, 125, 0, ${alpha})`;
};

export const getFontFamily = (fontName: string) => {
  switch (fontName) {
    case 'montserrat':
      return "'Montserrat', sans-serif";
    case 'inter':
      return "'Inter', sans-serif";
    case 'geist':
      return "'Geist', sans-serif";
    case 'outfit':
    default:
      return "'Outfit', sans-serif";
  }
};

// Interactive 3D Tilt Card with dynamic cursor spotlight (Jesper Landberg / GSAP Aesthetic)
export function TiltCard({
  children,
  className = '',
  onClick,
  accentColor = '#FF7D00',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  accentColor?: string;
  style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5.5; // max 5.5 deg
    const rotateY = ((x - centerX) / centerX) * 5.5;  // max 5.5 deg

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`);
    setSpotlight({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-all duration-300 ease-out will-change-transform ${className}`}
      style={{
        ...style,
        transform: transform || undefined,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dynamic Cursor Spotlight Overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300 z-20"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(circle 240px at ${spotlight.x}% ${spotlight.y}%, ${accentColor} 0%, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}

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
  showcaseItems?: ShowcaseItem[];
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
  initialSlideIndex?: number;
}

export default function PitchViewer({
  pitch,
  companyProfile,
  isEditorPreview = false,
  initialMode = 'deck',
  initialSlideIndex = 0,
}: PitchViewerProps) {
  const locale = useLocale();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [viewMode, setViewMode] = useState<'deck' | 'scroll'>(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<ShowcaseItem | null>(null);
  const [modalGalleryIndex, setModalGalleryIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openMediaModal = (item: ShowcaseItem) => {
    setActiveMediaModal(item);
    setModalGalleryIndex(0);
  };

  const modalImages: string[] = activeMediaModal ? (
    Array.isArray(activeMediaModal.images) && activeMediaModal.images.length > 0
      ? activeMediaModal.images
      : (activeMediaModal.mediaUrl ? [activeMediaModal.mediaUrl] : [])
  ) : [];

  const currentModalMedia = modalImages[modalGalleryIndex] || activeMediaModal?.mediaUrl || '';

  const navigateModalImage = (direction: 'next' | 'prev', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (modalImages.length <= 1) return;
    if (direction === 'next') {
      setModalGalleryIndex((prev) => (prev + 1) % modalImages.length);
    } else {
      setModalGalleryIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
    }
  };

  const rawSlides = Array.isArray(pitch.slides) ? pitch.slides : [];
  const slides: PitchSlide[] = rawSlides.length > 0 ? rawSlides : [
    {
      id: 'default-1',
      type: 'hero',
      badge: '360° Creative & Technology Support',
      title: pitch.title || 'LAUNCHPAD',
      subtitle: pitch.subtitle || 'Where ideas take off',
      content: 'We design, build, and scale high-performance digital ecosystems that drive measurable growth.',
      clientName: pitch.client?.razonSocial || pitch.clientName || 'Special Client',
      cta: {
        text: 'Explore Proposal',
        secondaryText: 'View Case Studies',
      },
    },
  ];

  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const clientDisplayName = pitch.client?.razonSocial || pitch.clientName || currentSlide.clientName;
  const brandName = companyProfile?.brandNameHeader || 'LAUNCHPAD';
  const presenterName = currentSlide.presenterName || pitch.user?.name || companyProfile?.user?.name || 'Eduardo Marval';
  const presenterRole = currentSlide.presenterRole || pitch.user?.cargo || companyProfile?.user?.cargo || 'Lead Solution Architect';
  const presenterEmail = companyProfile?.email || 'e.marval@themarvals.com';
  const presenterPhone = companyProfile?.phone || '+569 94438833';

  // Dynamic Theme & Font resolution
  const { color: accentColor, font: titleFont } = parsePitchTheme(pitch.theme, pitch.title, clientDisplayName);
  const accentGlow = hexToRgba(accentColor, 0.25);
  const titleFontFamily = getFontFamily(titleFont);
  const isDiDi = Boolean(
    (pitch.title && pitch.title.toLowerCase().includes('didi')) ||
    (clientDisplayName && clientDisplayName.toLowerCase().includes('didi')) ||
    accentColor.toUpperCase() === '#FF7D00'
  );

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  }, [totalSlides]);

  const goToSlideByType = useCallback((type: string) => {
    const targetIdx = slides.findIndex((s) => s.type === type);
    if (targetIdx !== -1) {
      setCurrentSlideIndex(targetIdx);
    } else {
      nextSlide();
    }
  }, [slides, nextSlide]);

  const handlePrimaryCtaClick = (link?: string, slideType?: string) => {
    if (link) {
      if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('tel:')) {
        window.open(link, '_blank');
      } else {
        window.location.href = link;
      }
    } else if (slideType === 'hero') {
      nextSlide();
    } else {
      setShowContactModal(true);
    }
  };

  const handleSecondaryCtaClick = (link?: string) => {
    if (link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        window.location.href = link;
      }
    } else {
      goToSlideByType('showcase');
    }
  };

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
      if (activeMediaModal) {
        if (e.key === 'Escape') setActiveMediaModal(null);
        if (e.key === 'ArrowRight') navigateModalImage('next');
        if (e.key === 'ArrowLeft') navigateModalImage('prev');
        return;
      }
      if (showContactModal) {
        if (e.key === 'Escape') setShowContactModal(false);
        return;
      }
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
  }, [isEditorPreview, viewMode, nextSlide, prevSlide, activeMediaModal, showContactModal, modalImages.length]);

  // Title styling helper: clean typography with glowing brand/client highlights
  const renderStyledTitle = (text: string, isHero: boolean = false) => {
    if (!text) return null;
    const clientKeyword = clientDisplayName || 'DiDi';
    const escapedKeyword = clientKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword}|DiDi|DIDI|LAUNCHPAD)`, 'gi');
    const parts = text.split(regex);

    if (isHero) {
      return (
        <h1
          className="text-[clamp(3.5rem,11vw,7.5rem)] font-black tracking-tighter leading-none mb-3 select-none"
          style={{
            WebkitTextFillColor: 'transparent',
            WebkitTextStrokeColor: '#ffffff',
            WebkitTextStrokeWidth: '1.5px',
            fontFamily: titleFontFamily,
          }}
        >
          {text}
        </h1>
      );
    }

    return (
      <h2
        className="text-[clamp(2rem,3.8vw,3.2rem)] font-black tracking-tight uppercase leading-tight"
        style={{ fontFamily: titleFontFamily }}
      >
        {parts.map((part, pIdx) => {
          const isHighlight =
            part.toLowerCase() === clientKeyword.toLowerCase() ||
            part.toLowerCase() === 'didi' ||
            part.toLowerCase() === 'launchpad';

          if (isHighlight) {
            return (
              <span
                key={pIdx}
                className="inline-block font-black"
                style={{
                  color: accentColor,
                  filter: `drop-shadow(0 0 25px ${accentGlow})`,
                }}
              >
                {part}
              </span>
            );
          }
          return (
            <span key={pIdx} className="text-white">
              {part}
            </span>
          );
        })}
      </h2>
    );
  };

  // Render a single slide
  const renderSlideContent = (slide: PitchSlide, index: number) => {
    switch (slide.type) {
      case 'hero':
        return (
          <div className="relative z-10 max-w-[900px] w-full text-center px-4 md:px-6 my-auto animate-fade-in">
            {slide.badge && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-full mb-4 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                <span className="text-[clamp(0.65rem,1.2vw,0.8rem)] uppercase tracking-[0.25em] font-bold" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              </div>
            )}

            {renderStyledTitle(slide.title || brandName, true)}

            {slide.subtitle && (
              <p
                className="text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold tracking-tight mb-4 text-white/90"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {slide.subtitle}
              </p>
            )}

            {clientDisplayName && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                  {locale === 'es' ? 'PREPARADO PARA:' : 'PREPARED FOR:'}
                </span>
                <span
                  className="text-xs font-black uppercase tracking-wider"
                  style={{
                    color: accentColor,
                    filter: `drop-shadow(0 0 12px ${accentGlow})`,
                  }}
                >
                  {clientDisplayName}
                </span>
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
                  <button
                    type="button"
                    onClick={() => handlePrimaryCtaClick(slide.cta?.link, slide.type)}
                    className="text-black font-extrabold uppercase tracking-[0.2em] px-8 h-[48px] rounded-sm text-xs flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 25px ${accentGlow}`,
                    }}
                  >
                    <span className="material-icons mr-2 text-[18px]">explore</span>
                    {slide.cta.text}
                  </button>
                )}
                {slide.cta.secondaryText && (
                  <button
                    type="button"
                    onClick={() => handleSecondaryCtaClick(slide.cta?.secondaryLink)}
                    className="border border-white/20 hover:border-white/50 text-white px-6 h-[48px] rounded-sm text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer bg-white/5 hover:bg-white/10"
                  >
                    <span className="material-icons mr-2 text-[16px]">collections</span>
                    {slide.cta.secondaryText}
                  </button>
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
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title)}
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[600px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
              <div className="h-[2px] mx-auto mt-3 w-24" style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(slide.cards || []).map((card, cIdx) => (
                <div
                  key={cIdx}
                  className="relative bg-[#0d0d14] border border-white/10 hover:border-white/40 p-6 rounded-xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-4 right-4 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }} />
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 border" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}>
                    <span className="material-icons text-[24px]">{card.icon || 'star'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                  {card.subtitle && (
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: accentColor }}>
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
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title)}
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
                      ? 'bg-gradient-to-b from-[#191410] to-[#0d0d14] shadow-2xl'
                      : 'bg-[#0d0d14] border-white/10'
                  }`}
                  style={card.highlight ? { borderColor: `${accentColor}50` } : {}}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-icons text-2xl" style={{ color: card.highlight ? accentColor : '#94a3b8' }}>
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

      case 'showcase':
        const showcaseList = slide.showcaseItems || [];
        return (
          <div className="relative z-10 max-w-[1200px] w-full px-4 md:px-6 my-auto animate-fade-in">
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title)}
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[650px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {showcaseList.map((item, sIdx) => {
                const isVideo = item.mediaType === 'video' || (item.mediaUrl && item.mediaUrl.match(/\.(mp4|webm|mov)$/i));
                const isSlide = item.mediaType === 'slide';
                const previewImg = item.thumbnailUrl || (item.images && item.images[0]) || item.mediaUrl;
                const imagesCount = item.images && item.images.length > 0 ? item.images.length : (item.mediaUrl ? 1 : 0);

                return (
                  <div
                    key={sIdx}
                    onClick={() => openMediaModal(item)}
                    className="group relative bg-[#0d0d14] border border-white/10 hover:border-white/40 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-lg"
                  >
                    {/* Media Thumbnail Container */}
                    <div className="aspect-video w-full relative overflow-hidden bg-black/50">
                      {previewImg ? (
                        <img
                          src={previewImg}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-slate-500">
                          <span className="material-icons text-3xl">image</span>
                        </div>
                      )}

                      {/* Type Badge & Play Icon */}
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-white">
                        <span className="material-icons text-xs" style={{ color: accentColor }}>
                          {isVideo ? 'play_circle' : isSlide ? 'slideshow' : 'collections'}
                        </span>
                        <span>{item.mediaType || (isVideo ? 'Video' : isSlide ? 'Slide' : 'Image')}</span>
                      </div>

                      {item.client && (
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-sm border border-white/10 text-[9px] uppercase tracking-widest text-slate-300 font-semibold">
                          {item.client}
                        </div>
                      )}

                      {/* Multiple Photos Badge Indicator */}
                      {imagesCount > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-bold text-white flex items-center gap-1">
                          <span className="material-icons text-xs" style={{ color: accentColor }}>collections</span>
                          <span>{imagesCount} {locale === 'en' ? 'photos' : 'fotos'}</span>
                        </div>
                      )}

                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                          <div className="w-12 h-12 rounded-full text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: accentColor }}>
                            <span className="material-icons text-2xl">play_arrow</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-sm md:text-base font-bold text-white transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {item.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[8px] uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'metrics':
        return (
          <div className="relative z-10 max-w-[1000px] w-full px-4 md:px-6 my-auto animate-fade-in text-center">
            {slide.badge && (
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                {slide.badge}
              </span>
            )}
            {renderStyledTitle(slide.title)}
            {slide.subtitle && (
              <p className="text-slate-300 text-sm md:text-base max-w-[600px] mx-auto mb-10 mt-2">
                {slide.subtitle}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(slide.metrics || []).map((metric, mIdx) => (
                <div
                  key={mIdx}
                  className="bg-[#0d0d14] border border-white/10 p-6 rounded-xl relative group hover:border-white/30 transition-colors"
                >
                  <div className="text-[clamp(2rem,3.5vw,3rem)] font-black tracking-tight text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <span style={{ color: accentColor }}>
                      {metric.value.charAt(0) === '+' || metric.value.charAt(0) === '$' || metric.value.charAt(0) === '<' ? metric.value.charAt(0) : ''}
                    </span>
                    {metric.value.replace(/^[+$<]/, '')}
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
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title)}
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
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>{step.phase}</span>
                    {step.duration && <span className="text-[10px] font-bold text-slate-400">{step.duration}</span>}
                  </div>
                  <h3 className="text-base font-bold text-white mb-3">{step.title}</h3>
                  <ul className="space-y-1.5">
                    {step.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="material-icons text-[14px] mt-0.5" style={{ color: accentColor }}>check_circle</span>
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
          <div className="relative z-10 max-w-[950px] w-full text-center px-4 md:px-6 my-auto animate-fade-in">
            {slide.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              </div>
            )}

            {renderStyledTitle(slide.title)}

            {slide.subtitle && (
              <p className="text-base md:text-lg font-semibold text-white/90 mb-6 max-w-[700px] mx-auto mt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {slide.subtitle}
              </p>
            )}

            {/* Two Value Proposition Pillars on Closing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-6 text-left">
              <div className="bg-[#0d0d14] border border-white/10 p-5 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-lg" style={{ color: accentColor }}>speed</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Agile Daily Comms</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Rapid <span className="font-bold text-white">&lt;24-48h turnaround</span> for banners, email templates, D-Hub & D-Channel assets with bilingual English/Spanish agility and Chinese (CN) support.
                </p>
              </div>

              <div className="bg-[#0d0d14] border border-white/10 p-5 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-lg" style={{ color: accentColor }}>verified_user</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Major Events & VRA</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  End-to-end multimedia for <span className="font-bold text-white">Get-Together & Value Star</span>, with 100% compliance readiness for DiDi Vendor Risk Assessment (VRA).
                </p>
              </div>
            </div>

            {/* Direct Contact Box */}
            <div className="bg-[#12121a] border border-white/15 p-5 rounded-xl max-w-xl mx-auto text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isDiDi || locale === 'en' ? 'Direct Contact' : 'Direct Contact'}
                </div>
                <div className="text-base font-bold text-white">{presenterName}</div>
                <div className="text-xs font-medium" style={{ color: accentColor }}>{presenterRole}</div>
                <div className="text-xs text-slate-300 pt-1">
                  {presenterEmail} • {presenterPhone}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${presenterEmail}?subject=${encodeURIComponent('[DiDi RFI 2026] Creative & Multimedia Support - Launchpad')}`}
                  className="px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md text-white hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  <span className="material-icons text-sm">email</span>
                  Email
                </a>
              </div>
            </div>
          </div>
        );

      case 'custom':
      default:
        return (
          <div className="relative z-10 max-w-[900px] w-full px-4 md:px-6 my-auto animate-fade-in">
            {slide.badge && (
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block text-center" style={{ color: accentColor }}>
                {slide.badge}
              </span>
            )}
            {renderStyledTitle(slide.title)}
            <div
              className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm md:text-base space-y-4 mt-6"
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
          className="absolute -top-[250px] -right-[150px] w-[600px] h-[600px] pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at center, ${accentGlow} 0%, transparent 70%)` }}
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
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full hidden sm:inline border" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}>
              {isDiDi ? 'DIDI RFI DECK' : 'PITCH DECK'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-full p-1 text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setViewMode('deck')}
                className={`px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${
                  viewMode === 'deck' ? 'text-black font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
                style={viewMode === 'deck' ? { backgroundColor: accentColor } : {}}
              >
                <span className="material-icons text-xs">slideshow</span>
                Deck
              </button>
              <button
                type="button"
                onClick={() => setViewMode('scroll')}
                className={`px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${
                  viewMode === 'scroll' ? 'text-black font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
                style={viewMode === 'scroll' ? { backgroundColor: accentColor } : {}}
              >
                <span className="material-icons text-xs">view_agenda</span>
                Scroll
              </button>
            </div>

            {/* Download PDF Button */}
            {pitch.id && (
              <a
                href={`/api/pitches/${pitch.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                download
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                title={locale === 'en' ? 'Download PDF Deck' : 'Descargar Presentación en PDF'}
              >
                <span className="material-icons text-sm" style={{ color: accentColor }}>picture_as_pdf</span>
                <span className="hidden sm:inline">{locale === 'en' ? 'PDF' : 'PDF'}</span>
              </a>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/40 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? (locale === 'en' ? 'Exit fullscreen (F)' : 'Salir de pantalla completa (F)') : (locale === 'en' ? 'Fullscreen (F)' : 'Pantalla completa (F)')}
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
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-white/40 text-white flex items-center justify-center transition-colors"
              title={locale === 'en' ? 'Previous (←)' : 'Anterior (←)'}
            >
              <span className="material-icons text-lg">chevron_left</span>
            </button>

            <span className="text-xs font-black uppercase tracking-widest px-2 min-w-[52px] text-center" style={{ color: accentColor }}>
              {currentSlideIndex + 1} / {totalSlides}
            </span>

            <button
              type="button"
              onClick={nextSlide}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-white/40 text-white flex items-center justify-center transition-colors"
              title={locale === 'en' ? 'Next (→)' : 'Siguiente (→)'}
            >
              <span className="material-icons text-lg">chevron_right</span>
            </button>
          </div>

          <div className="flex-1 min-w-0 text-right text-[10px] uppercase tracking-widest text-slate-500 hidden sm:block pl-4">
            {locale === 'en' ? 'Use arrow keys ← → or spacebar' : 'Usa las flechas ← → o barra espaciadora'}
          </div>
        </footer>
      )}

      {/* Interactive Media Lightbox Modal */}
      {activeMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            {activeMediaModal.externalUrl && (
              <a
                href={activeMediaModal.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <span className="material-icons text-sm">open_in_new</span>
                {locale === 'en' ? 'View Project' : 'Ver Proyecto'}
              </a>
            )}
            <button
              type="button"
              onClick={() => setActiveMediaModal(null)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <span className="material-icons text-sm">close</span>
              {locale === 'en' ? 'Close (Esc)' : 'Cerrar (Esc)'}
            </button>
          </div>

          <div className="max-w-5xl w-full max-h-[85vh] flex flex-col bg-[#0d0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Media Gallery / Lightbox Frame */}
            <div className="flex-1 overflow-hidden bg-black flex items-center justify-center relative min-h-[300px] group/gallery">
              {/* Media Count Badge */}
              {modalImages.length > 1 && (
                <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                  <span className="material-icons text-xs" style={{ color: accentColor }}>collections</span>
                  <span>{modalGalleryIndex + 1} / {modalImages.length}</span>
                </div>
              )}

              {/* Navigation Left / Right Chevrons */}
              {modalImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => navigateModalImage('prev', e)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-white/40 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xl opacity-80 hover:opacity-100"
                    title={locale === 'en' ? 'Previous image (←)' : 'Imagen anterior (←)'}
                  >
                    <span className="material-icons text-2xl">chevron_left</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => navigateModalImage('next', e)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-white/40 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xl opacity-80 hover:opacity-100"
                    title={locale === 'en' ? 'Next image (→)' : 'Siguiente imagen (→)'}
                  >
                    <span className="material-icons text-2xl">chevron_right</span>
                  </button>
                </>
              )}

              {/* Media Content Display */}
              {activeMediaModal.mediaType === 'video' || (currentModalMedia && currentModalMedia.match(/\.(mp4|webm|mov)$/i)) ? (
                <video
                  key={currentModalMedia}
                  src={currentModalMedia}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-full object-contain"
                />
              ) : currentModalMedia.includes('youtube.com') || currentModalMedia.includes('vimeo.com') ? (
                <iframe
                  key={currentModalMedia}
                  src={currentModalMedia}
                  className="w-full h-full min-h-[450px]"
                  allow="autoplay; fullscreen; encrypted-media"
                />
              ) : (
                <img
                  key={currentModalMedia}
                  src={currentModalMedia}
                  alt={activeMediaModal.title}
                  className="max-h-[65vh] w-full object-contain transition-opacity duration-300"
                />
              )}

              {/* Interactive Dots Pagination */}
              {modalImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  {modalImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalGalleryIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === modalGalleryIndex
                          ? 'w-6 shadow-md'
                          : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      style={idx === modalGalleryIndex ? { backgroundColor: accentColor } : {}}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/10 space-y-2 bg-[#0a0a0f]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeMediaModal.title}</h3>
                  {activeMediaModal.subtitle && (
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>{activeMediaModal.subtitle}</p>
                  )}
                </div>
                {activeMediaModal.client && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300">
                    {activeMediaModal.client}
                  </span>
                )}
              </div>
              {activeMediaModal.description && (
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {activeMediaModal.description}
                </p>
              )}
              {activeMediaModal.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeMediaModal.tags.map((t, idx) => (
                    <span key={idx} className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-sm">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
