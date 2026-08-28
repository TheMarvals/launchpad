'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import ProjectDetailModal from './ProjectDetailModal';

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

import { parsePitchTheme, hexToRgba, getFontFamily } from '@/lib/pitch-theme';
export { parsePitchTheme, hexToRgba, getFontFamily };

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

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
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

// ═══════════════════════════════════════════════════════════════════
// Jesper Landberg Showcase Slider — Faithful Replica
// Reference: https://jesperlandberg.com/
//
// Key characteristics from the original:
// • Cards are ~43.5svh tall, nearly half the viewport
// • Only the project title at bottom-left — no badges, pills, counters
// • Concave cylindrical curvature (rotateY + translateZ depth)
// • 3D perspective grid floor beneath cards
// • Fluid horizontal drag with momentum, no hard snapping
// • Rounded corners ~2rem, subtle shadow
// • Ultra-clean dark aesthetic — black background, white text
// ═══════════════════════════════════════════════════════════════════

export function Jesper3DCylinderShowcase({
  items,
  accentColor,
  accentGlow,
  locale,
  onOpen,
  isBlackHoleOpen = false,
}: {
  items: ShowcaseItem[];
  accentColor: string;
  accentGlow: string;
  locale: string;
  onOpen: (item: ShowcaseItem, startIdx?: number) => void;
  isBlackHoleOpen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollXRef = useRef(0);
  const targetScrollXRef = useRef(0);
  const previousScrollXRef = useRef(0);
  const velocityXRef = useRef(0);
  const [, forceRender] = useState(0);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  const didDragRef = useRef(false);
  const gestureRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startScrollX: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    didDrag: false,
  });
  const animFrameId = useRef<number | null>(null);

  // Repeat items virtually if count is small for continuous 3D track
  const minItemsForLoop = 6;
  const repeatCount = items.length > 0 ? Math.max(1, Math.ceil(minItemsForLoop / items.length)) : 1;
  const virtualItems: Array<{ item: ShowcaseItem; originalIndex: number; virtualId: string }> = [];
  for (let r = 0; r < repeatCount; r++) {
    items.forEach((item, oIdx) => {
      virtualItems.push({
        item,
        originalIndex: oIdx,
        virtualId: `${item.id || oIdx}-${r}`,
      });
    });
  }

  // Dimensions & Layout
  const cardHeight = typeof window !== 'undefined' ? Math.min(480, Math.max(280, window.innerHeight * 0.42)) : 380;
  const cardWidth = Math.min(640, Math.round(cardHeight * 1.55));
  const cardGap = Math.max(48, Math.round(cardWidth * 0.14));
  const itemStride = cardWidth + cardGap;
  const totalTrackWidth = virtualItems.length * itemStride;

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 60fps RequestAnimationFrame Physics & Render Loop
  useEffect(() => {
    const loop = () => {
      const diff = targetScrollXRef.current - scrollXRef.current;
      if (Math.abs(diff) > 0.05) {
        scrollXRef.current += diff * 0.085;
      } else {
        scrollXRef.current = targetScrollXRef.current;
      }

      velocityXRef.current = scrollXRef.current - previousScrollXRef.current;
      previousScrollXRef.current = scrollXRef.current;

      if (containerRef.current) {
        containerRef.current.style.setProperty('--velocity-x', velocityXRef.current.toFixed(3));
        containerRef.current.style.setProperty('--velocity', Math.abs(velocityXRef.current).toFixed(3));
      }

      forceRender((n) => n + 1);
      animFrameId.current = requestAnimationFrame(loop);
    };
    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Wheel scroll (horizontal & vertical)
  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 1) {
      targetScrollXRef.current += delta * 1.0;
    }
  };

  // Drag Gesture Handlers on Container
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    targetScrollXRef.current = scrollXRef.current;
    setIsPointerDown(true);
    didDragRef.current = false;

    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollX: scrollXRef.current,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocity: 0,
      didDrag: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== e.pointerId) return;

    const now = performance.now();
    const dt = Math.max(1, now - gesture.lastTime);
    const dx = e.clientX - gesture.lastX;
    gesture.velocity = (dx / dt) * 16;
    gesture.lastX = e.clientX;
    gesture.lastTime = now;

    const totalDx = e.clientX - gesture.startX;
    const totalDy = e.clientY - gesture.startY;
    const moveDist = Math.hypot(totalDx, totalDy);

    if (moveDist >= 15) {
      gesture.didDrag = true;
      didDragRef.current = true;
      targetScrollXRef.current = gesture.startScrollX - totalDx * 1.2;
    }
  };

  const finishPointerGesture = (e: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== e.pointerId) return;

    setIsPointerDown(false);
    if (gesture.didDrag) {
      targetScrollXRef.current += gesture.velocity * -18;
      setTimeout(() => {
        didDragRef.current = false;
      }, 80);
    } else {
      didDragRef.current = false;
    }
    gesture.pointerId = -1;
  };

  const scrollX = scrollXRef.current;
  const halfTotal = totalTrackWidth / 2;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerGesture}
      onPointerCancel={finishPointerGesture}
      onWheel={handleWheel}
      className={`relative w-full flex items-center justify-center select-none overflow-hidden touch-none ${
        isPointerDown ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        height: `${cardHeight + 80}px`,
        perspective: '1600px',
        perspectiveOrigin: '50% 48%',
      }}
    >
      {/* 3D Perspective Spacetime Grid Floor */}
      <div
        className="absolute left-[-60%] w-[220%] pointer-events-none z-0 transition-transform duration-700"
        style={{
          bottom: '-24px',
          height: '360px',
          transform: isBlackHoleOpen ? 'rotateX(82deg) scale(1.08)' : 'rotateX(78deg)',
          transformOrigin: '50% 100%',
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 75% 55% at 50% 10%, #000 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 55% at 50% 10%, #000 25%, transparent 80%)',
        }}
      />

      {/* 3D Infinite Track with True Modulo Wrapping & Spacetime Curvature */}
      <div className="relative w-full h-full flex items-center justify-center">
        {virtualItems.map((vItem, idx) => {
          const baseX = idx * itemStride;
          const rawOffset = baseX - scrollX;

          const wrappedOffset = totalTrackWidth > 0
            ? ((((rawOffset + halfTotal) % totalTrackWidth) + totalTrackWidth) % totalTrackWidth) - halfTotal
            : rawOffset;

          const halfWidth = containerWidth * 0.5 || 600;
          const normDist = wrappedOffset / halfWidth;
          const absNorm = Math.abs(normDist);

          const rotateY = normDist * (isBlackHoleOpen ? -32 : -27);
          const translateZ = -Math.min(320, absNorm * (isBlackHoleOpen ? 220 : 170));
          const translateY = Math.pow(absNorm, 2) * (isBlackHoleOpen ? 22 : 12);
          const scale = isBlackHoleOpen
            ? Math.max(0.8, 1 - absNorm * 0.1)
            : Math.max(0.85, 1 - absNorm * 0.07);
          const opacity = isBlackHoleOpen
            ? Math.max(0.3, 1 - absNorm * 0.45)
            : Math.max(0.45, 1 - absNorm * 0.4);
          const isCenter = absNorm < 0.38;

          // Dynamic z-index: center cards always have the highest stacking context
          const dynamicZIndex = Math.max(1, Math.round(100 - absNorm * 50));
          const isClickable = absNorm <= 1.25;

          return (
            <div
              key={vItem.virtualId}
              style={{
                position: 'absolute',
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transform: `perspective(1100px) translate3d(${wrappedOffset.toFixed(1)}px, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
                transformOrigin: '50% 50%',
                opacity,
                zIndex: dynamicZIndex,
                pointerEvents: isClickable ? 'auto' : 'none',
                transition: isPointerDown ? 'none' : 'opacity 0.15s ease-out',
                filter: absNorm > 0.6 ? `brightness(${Math.max(0.65, 1 - absNorm * 0.35)})` : 'none',
              }}
            >
              <JesperCard
                item={vItem.item}
                index={vItem.originalIndex}
                isCenter={isCenter}
                accentColor={accentColor}
                locale={locale}
                onOpen={() => {
                  if (!didDragRef.current) {
                    onOpen(vItem.item, 0);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// JesperCard — Clean, minimal card matching jesperlandberg.com
// ═══════════════════════════════════════════════════════════════════
export function JesperCard({
  item,
  index,
  isCenter,
  accentColor,
  locale,
  onOpen,
}: {
  item: ShowcaseItem;
  index: number;
  isCenter: boolean;
  accentColor: string;
  locale: string;
  onOpen?: () => void;
}) {
  const firstImg = Array.isArray(item.images) && item.images.length > 0
    ? item.images[0]
    : (item.mediaUrl || item.thumbnailUrl || '');

  return (
    <article
      data-showcase-idx={index}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
      className="group relative w-full h-full rounded-[2rem] overflow-hidden cursor-pointer bg-black select-none"
      style={{
        transform: 'skewX(calc(var(--velocity-x, 0) * -0.06deg))',
        transition: 'transform 0.15s ease-out, box-shadow 0.4s ease',
      }}
    >
      {/* Full-bleed media — image or animated video */}
      <div className="absolute inset-0 overflow-hidden">
        {item.mediaType === 'video' || (firstImg && firstImg.match(/\.(mp4|webm|mov)(\?.*)?$/i)) ? (
          <video
            src={firstImg}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : firstImg ? (
          <img
            src={firstImg}
            alt={item.title}
            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}
      </div>

      {/* Subtle bottom gradient for title legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Bottom title — Jesper style: clean minimal name */}
      <div className="absolute bottom-[1rem] inset-x-[1rem] md:bottom-[1.2rem] md:inset-x-[2rem] flex items-end justify-between pointer-events-none z-10">
        <span className="text-[1.1rem] md:text-[1.25rem] font-bold tracking-[-0.04em] text-white whitespace-nowrap drop-shadow-lg">
          {item.title}
        </span>

        {/* Small circle arrow button — visible across ALL cards on hover */}
        <span className="inline-flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full bg-white/20 group-hover:bg-white text-white group-hover:text-black border border-white/30 backdrop-blur-md text-sm transition-all duration-300 shadow-xl opacity-75 group-hover:opacity-100 group-hover:scale-110">
          <span className="material-icons text-sm">arrow_outward</span>
        </span>
      </div>
    </article>
  );
}

// Legacy alias so existing JSX references still compile
export const Jesper3DCard = JesperCard;

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  avatarUrl?: string;
  tags?: string[];
}

export interface PitchSlide {
  id: string;
  type: 'hero' | 'pillars' | 'problem_solution' | 'metrics' | 'roadmap' | 'showcase' | 'cta' | 'custom' | 'team' | 'logos';
  badge?: string;
  title: string;
  subtitle?: string;
  content?: string;
  columns?: number;
  cards?: Array<{
    title: string;
    subtitle?: string;
    description?: string;
    icon?: string;
    tags?: string[];
    highlight?: boolean;
    imageUrl?: string;
    avatarUrl?: string;
    logoUrl?: string;
    role?: string;
  }>;
  teamTitle?: string;
  teamMembers?: TeamMember[];
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
  senderIdentities?: any[];
  showcaseProjects?: any[];
  isEditorPreview?: boolean;
  initialMode?: 'deck' | 'scroll';
  initialSlideIndex?: number;
}

export default function PitchViewer({
  pitch,
  companyProfile,
  senderIdentities = [],
  showcaseProjects = [],
  isEditorPreview = false,
  initialMode = 'deck',
  initialSlideIndex = 0,
}: PitchViewerProps) {
  const locale = useLocale();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [viewMode, setViewMode] = useState<'deck' | 'scroll'>(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<ShowcaseItem | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openMediaModal = (item: ShowcaseItem) => {
    setActiveMediaModal(item);
  };

  const rawSlides = Array.isArray(pitch.slides) ? (pitch.slides as any[]).filter((s) => s.type !== 'emailConfig') : [];
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

  // Authorized Sender Identity / Signature from Settings
  const primarySender = senderIdentities?.[0] || null;
  const rawSig = primarySender?.signature?.trim() || '';
  const sigLines = rawSig.split('\n').map((l: string) => l.trim()).filter(Boolean);

  // Extract human presenter name (never use generic contact labels)
  let presenterName = currentSlide.presenterName || pitch.user?.name || companyProfile?.user?.name || '';
  if (!presenterName || presenterName.toLowerCase().includes('contact') || presenterName.toLowerCase().includes('launchpad')) {
    if (primarySender?.displayName && !primarySender.displayName.toLowerCase().includes('contact') && !primarySender.displayName.toLowerCase().includes('launchpad')) {
      presenterName = primarySender.displayName;
    } else if (sigLines[0] && !sigLines[0].toLowerCase().includes('contact') && !sigLines[0].toLowerCase().includes('launchpad')) {
      presenterName = sigLines[0];
    } else {
      presenterName = 'Eduardo Marval';
    }
  }

  // Extract human presenter role
  let presenterRole = currentSlide.presenterRole || pitch.user?.cargo || '';
  if (!presenterRole) {
    if (sigLines.length > 1) {
      presenterRole = sigLines.slice(1).join(' • ');
    } else if (sigLines.length === 1 && sigLines[0].toLowerCase() !== presenterName.toLowerCase()) {
      presenterRole = sigLines[0];
    } else if (companyProfile?.user?.cargo || companyProfile?.systemsTitle) {
      presenterRole = companyProfile?.user?.cargo || companyProfile?.systemsTitle;
    } else {
      presenterRole = 'Lead Solution Architect';
    }
  }

  // Dynamic Theme & Font resolution
  const { color: accentColor, font: titleFont, style: titleStyle, headerBadge } = parsePitchTheme(pitch.theme, pitch.title, clientDisplayName);
  const accentGlow = hexToRgba(accentColor, 0.25);
  const titleFontFamily = getFontFamily(titleFont);
  const isOutline = titleStyle === 'outline';
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

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGeneratingPdf || !pitch.id) return;
    setIsGeneratingPdf(true);
    try {
      const response = await fetch(`/api/pitches/${pitch.id}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanTitle = (pitch.title || 'pitch').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `${cleanTitle}-deck.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(locale === 'en' ? 'Failed to generate PDF. Please try again.' : 'Error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      setIsGeneratingPdf(false);
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
  }, [isEditorPreview, viewMode, nextSlide, prevSlide, activeMediaModal, showContactModal]);

  // Title styling helper: clean typography with glowing brand/client highlights
  const renderStyledTitle = (text: string, isHero: boolean = false) => {
    if (!text) return null;
    const isLaunchpadWordmark = text.trim().toUpperCase() === 'LAUNCHPAD' || brandName.toUpperCase() === text.trim().toUpperCase();
    const clientKeyword = clientDisplayName || 'DiDi';
    const escapedKeyword = clientKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword}|DiDi|DIDI|LAUNCHPAD)`, 'gi');
    const parts = text.split(regex);

    // Official LAUNCHPAD Brand Wordmark: ALWAYS maintain iconic Outfit Outlined Stroke style
    if (isHero && isLaunchpadWordmark) {
      return (
        <h1
          className="text-[clamp(3.5rem,11vw,7.5rem)] font-black tracking-tighter leading-none mb-3 select-none text-transparent"
          style={{
            WebkitTextFillColor: 'transparent',
            WebkitTextStrokeColor: '#ffffff',
            WebkitTextStrokeWidth: '1.5px',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {text}
        </h1>
      );
    }

    if (isHero) {
      const isLongTitle = text.length > 25;
      return (
        <h1
          className={`${
            isLongTitle
              ? 'text-[clamp(1.75rem,4.5vw,3rem)] leading-tight max-w-[850px] mx-auto tracking-tight'
              : 'text-[clamp(2.75rem,8vw,5.5rem)] leading-none tracking-tighter'
          } font-black mb-3 select-none text-white`}
          style={{
            fontFamily: titleFontFamily,
            WebkitTextFillColor: '#ffffff',
            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.6))',
          }}
        >
          {text}
        </h1>
      );
    }

    // Slide Titles (Slide 2, 3, 4, 5, 6, 7, 8, etc.): Use selected Title Typography
    return (
      <h2
        className="text-[clamp(1.8rem,3.5vw,3rem)] font-black tracking-tight uppercase leading-tight text-white"
        style={{
          fontFamily: titleFontFamily,
          WebkitTextFillColor: '#ffffff',
        }}
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
                  WebkitTextFillColor: accentColor,
                  WebkitTextStrokeColor: 'transparent',
                  WebkitTextStrokeWidth: '0px',
                  filter: `drop-shadow(0 0 25px ${accentGlow})`,
                }}
              >
                {part}
              </span>
            );
          }
          return (
            <span key={pIdx}>
              {part}
            </span>
          );
        })}
      </h2>
    );
  };

  // Render an integrated Team Section inside any slide
  const renderTeamSection = (teamMembers?: TeamMember[], customTitle?: string) => {
    if (!teamMembers || teamMembers.length === 0) return null;
    const titleText = customTitle?.trim() || (locale === 'es' ? 'Equipo Clave & Liderazgo' : 'Core Team & Leadership');
    const teamGridClass = teamMembers.length === 1
      ? 'max-w-xs mx-auto'
      : teamMembers.length === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto'
      : teamMembers.length === 3
      ? 'grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto';

    return (
      <div className="w-full mt-8 pt-6 border-t border-white/10">
        <div className="text-center mb-5">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold block" style={{ color: accentColor }}>
            {titleText}
          </span>
        </div>
        <div className={teamGridClass}>
          {teamMembers.map((member, mIdx) => {
            const memberInitials = (member.name || 'TM').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'TM';
            const img = member.imageUrl || member.avatarUrl;
            return (
              <div
                key={mIdx}
                className="w-full bg-gradient-to-b from-[#12111a] to-[#0a0a10] border border-white/10 hover:border-white/30 p-4 sm:p-5 rounded-2xl transition-all duration-300 flex flex-col items-center text-center group shadow-xl hover:-translate-y-1"
                style={{ borderColor: `${accentColor}30` }}
              >
                <div className="relative mb-3">
                  {img ? (
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 p-0.5 shadow-xl" style={{ borderColor: accentColor }}>
                      <img src={img} alt={member.name || 'Team Member'} className="w-full h-full object-cover rounded-full" />
                    </div>
                  ) : (
                    <div
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl border-2 shadow-xl"
                      style={{
                        backgroundColor: `${accentColor}15`,
                        borderColor: accentColor,
                        color: accentColor,
                      }}
                    >
                      {memberInitials}
                    </div>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white mb-0.5 w-full px-1 truncate">
                  {member.name || (locale === 'es' ? 'Nombre del Miembro' : 'Team Member')}
                </h4>
                <p className="text-[10px] uppercase tracking-wider font-bold mb-2 w-full px-1 line-clamp-2" style={{ color: accentColor }}>
                  {member.role || (locale === 'es' ? 'Cargo / Rol' : 'Executive Role')}
                </p>
                {member.bio && (
                  <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3 px-1 whitespace-pre-wrap">{member.bio}</p>
                )}
                {member.tags && member.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-auto pt-2.5 border-t border-white/10 w-full">
                    {member.tags.map((t, tIdx) => (
                      <span key={tIdx} className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render a single slide
  const renderSlideContent = (slide: PitchSlide, index: number) => {
    switch (slide.type) {
      case 'hero':
        const heroTitle = (slide.title && slide.title.toUpperCase() === 'LAUNCHPAD') 
          ? 'LAUNCHPAD' 
          : (slide.title && !slide.title.toLowerCase().includes('rfi') && !slide.title.toLowerCase().includes('proposal') && slide.title.length <= 15)
            ? slide.title
            : brandName || 'LAUNCHPAD';

        const heroSubtitle = (slide.title && slide.title !== heroTitle && slide.title !== 'LAUNCHPAD')
          ? slide.title
          : slide.subtitle || pitch.subtitle || 'Global Internal Communications & Multimedia Production';

        return (
          <div className="relative z-10 max-w-[960px] w-full text-center px-4 md:px-6 my-auto animate-fade-in">
            {slide.badge && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-full mb-4 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                <span className="text-[clamp(0.65rem,1.2vw,0.8rem)] uppercase tracking-[0.25em] font-bold" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              </div>
            )}

            {renderStyledTitle(heroTitle, true)}

            {heroSubtitle && (
              <p
                className="text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold tracking-tight mb-4 text-white/90"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {heroSubtitle}
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
              <p className="text-body text-slate-300 max-w-[920px] mx-auto leading-relaxed mb-8 text-sm md:text-base whitespace-pre-wrap">
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
        const pillarsCols = slide.columns || ((slide.cards || []).length === 2 ? 2 : (slide.cards || []).length >= 4 ? 4 : 3);
        const pillarsGrid = pillarsCols === 2
          ? 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'
          : pillarsCols === 4
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'
          : 'grid grid-cols-1 md:grid-cols-3 gap-4';

        return (
          <div className="relative z-10 max-w-[1150px] w-full px-4 md:px-6 my-auto animate-fade-in">
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title)}
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[850px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
              {slide.content && (
                <p className="text-slate-300 text-xs md:text-sm max-w-[850px] mx-auto mt-3 leading-relaxed whitespace-pre-wrap">
                  {slide.content}
                </p>
              )}
              <div className="h-[2px] mx-auto mt-3 w-24" style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}></div>
            </div>

            <div className={pillarsGrid}>
              {(slide.cards || []).map((card, cIdx) => {
                const cardImg = card.imageUrl || card.logoUrl || card.avatarUrl;
                return (
                  <div
                    key={cIdx}
                    className="relative bg-[#0d0d14] border border-white/10 hover:border-white/40 p-6 rounded-xl transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className="absolute top-0 left-4 right-4 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }} />
                    {cardImg ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden mb-4 border p-0.5" style={{ borderColor: accentColor }}>
                        <img src={cardImg} alt={card.title} className="w-full h-full object-cover rounded-full" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 border" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}>
                        <span className="material-icons text-[24px]">{card.icon || 'star'}</span>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                    {card.subtitle && (
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: accentColor }}>
                        {card.subtitle}
                      </p>
                    )}
                    {card.description && <p className="text-slate-300 text-xs leading-relaxed mb-4 whitespace-pre-wrap">{card.description}</p>}
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
                );
              })}
            </div>

            {/* Integrated Team Section on Slide */}
            {renderTeamSection(slide.teamMembers, slide.teamTitle)}
          </div>
        );

      case 'problem_solution':
        const probCols = slide.columns || ((slide.cards || []).length === 3 ? 3 : (slide.cards || []).length >= 4 ? 4 : 2);
        const probGrid = probCols === 3
          ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
          : probCols === 4
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'
          : 'grid grid-cols-1 md:grid-cols-2 gap-6';
        const probMaxWidth = probCols >= 3 ? 'max-w-[1150px]' : 'max-w-[1000px]';

        return (
          <div className={`relative z-10 ${probMaxWidth} w-full px-4 md:px-6 my-auto animate-fade-in`}>
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title)}
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[850px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
              {slide.content && (
                <p className="text-slate-300 text-xs md:text-sm max-w-[850px] mx-auto mt-3 leading-relaxed whitespace-pre-wrap">
                  {slide.content}
                </p>
              )}
            </div>

            <div className={probGrid}>
              {(slide.cards || []).map((card, cIdx) => {
                const cardImg = card.imageUrl || card.logoUrl || card.avatarUrl;
                return (
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
                      {cardImg ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border p-0.5 shrink-0" style={{ borderColor: accentColor }}>
                          <img src={cardImg} alt={card.title} className="w-full h-full object-cover rounded-full" />
                        </div>
                      ) : (
                        <span className="material-icons text-2xl shrink-0" style={{ color: card.highlight ? accentColor : '#94a3b8' }}>
                          {card.icon || (card.highlight ? 'verified' : 'warning')}
                        </span>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-white">{card.title}</h3>
                        {card.subtitle && (
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{card.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {card.description && <p className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{card.description}</p>}
                  </div>
                );
              })}
            </div>

            {/* Integrated Team Section on Slide */}
            {renderTeamSection(slide.teamMembers, slide.teamTitle)}
          </div>
        );

      case 'team':
        const teamCols = slide.columns || ((slide.cards || []).length <= 2 ? 2 : (slide.cards || []).length === 4 ? 4 : 3);
        const teamGrid = teamCols === 2
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto'
          : teamCols === 4
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5';

        return (
          <div className="relative z-10 max-w-[1150px] w-full px-4 md:px-6 my-auto animate-fade-in">
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title || 'Leadership & Core Team')}
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[850px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
              {slide.content && (
                <p className="text-slate-300 text-xs md:text-sm max-w-[850px] mx-auto mt-3 leading-relaxed whitespace-pre-wrap">
                  {slide.content}
                </p>
              )}
              <div className="h-[2px] mx-auto mt-3 w-24" style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}></div>
            </div>

            <div className={`flex flex-wrap justify-center gap-5 w-full mx-auto ${(slide.cards || []).length === 1 ? 'max-w-xs' : (slide.cards || []).length === 2 ? 'max-w-2xl' : 'max-w-5xl'}`}>
              {(slide.cards || []).map((member, mIdx) => {
                const img = member.imageUrl || member.avatarUrl || member.logoUrl;
                const memberInitials = (member.title || 'TM').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'TM';
                return (
                  <div
                    key={mIdx}
                    className="w-full sm:w-[260px] md:w-[280px] bg-gradient-to-b from-[#12111a] to-[#0d0d14] border border-white/10 hover:border-white/40 p-5 rounded-2xl transition-all duration-300 group hover:-translate-y-1 flex flex-col items-center text-center shadow-xl"
                  >
                    <div className="relative mb-3.5">
                      {img ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 p-0.5 shadow-xl" style={{ borderColor: accentColor }}>
                          <img src={img} alt={member.title || 'Team Member'} className="w-full h-full object-cover rounded-full" />
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl border-2 shadow-xl"
                          style={{
                            backgroundColor: `${accentColor}15`,
                            borderColor: accentColor,
                            color: accentColor,
                          }}
                        >
                          {memberInitials}
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-0.5 w-full px-1">{member.title || (locale === 'es' ? 'Nombre del Miembro' : 'Team Member')}</h3>
                    {member.subtitle && (
                      <p className="text-[10px] uppercase tracking-wider font-bold mb-2 w-full px-1" style={{ color: accentColor }}>
                        {member.subtitle}
                      </p>
                    )}
                    {member.description && (
                      <p className="text-slate-300 text-xs leading-relaxed mb-3 line-clamp-3 px-1 whitespace-pre-wrap">{member.description}</p>
                    )}
                    {member.tags && member.tags.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mt-auto pt-3 border-t border-white/10 w-full">
                        {member.tags.map((tag, tIdx) => (
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
                );
              })}
            </div>
          </div>
        );

      case 'logos':
        const logoCols = slide.columns || ((slide.cards || []).length <= 2 ? 2 : (slide.cards || []).length === 3 ? 3 : (slide.cards || []).length <= 4 ? 4 : 6);
        const logoGrid = logoCols === 2
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto'
          : logoCols === 3
          ? 'grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto'
          : logoCols === 4
          ? 'grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto'
          : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';

        return (
          <div className="relative z-10 max-w-[1150px] w-full px-4 md:px-6 my-auto animate-fade-in">
            <div className="text-center mb-8">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title || 'Clients & Brand Ecosystem')}
              {slide.subtitle && (
                <p className="text-slate-300 text-sm md:text-base max-w-[850px] mx-auto mt-2">
                  {slide.subtitle}
                </p>
              )}
              {slide.content && (
                <p className="text-slate-300 text-xs md:text-sm max-w-[850px] mx-auto mt-3 leading-relaxed whitespace-pre-wrap">
                  {slide.content}
                </p>
              )}
              <div className="h-[2px] mx-auto mt-3 w-24" style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}></div>
            </div>

            <div className={logoGrid}>
              {(slide.cards || []).map((item, lIdx) => {
                const img = item.imageUrl || item.logoUrl || item.avatarUrl;
                return (
                  <div
                    key={lIdx}
                    className="relative bg-[#0d0d14] border border-white/10 hover:border-white/40 p-4 rounded-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[130px]"
                  >
                    {img ? (
                      <div className="h-12 w-full flex items-center justify-center mb-2 px-2">
                        <img src={img} alt={item.title} className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 border" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}>
                        <span className="material-icons text-lg">{item.icon || 'business'}</span>
                      </div>
                    )}
                    <h3 className="text-xs font-bold text-white truncate max-w-full">{item.title}</h3>
                    {item.subtitle && (
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold truncate max-w-full mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'showcase':
        const rawShowcaseList = slide.showcaseItems || [];
        const enrichedShowcaseList: ShowcaseItem[] = rawShowcaseList.map((item) => {
          const existingImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [];
          const matchedProject = (showcaseProjects || []).find(
            (p: any) =>
              p.id === item.id ||
              p.title?.toLowerCase() === item.title?.toLowerCase() ||
              p.titleEn?.toLowerCase() === item.title?.toLowerCase() ||
              (p.images && p.images.some((img: any) => (img.url === item.mediaUrl || img.url === item.thumbnailUrl))) ||
              p.featuredImage === item.mediaUrl
          );

          if (matchedProject && matchedProject.images && matchedProject.images.length > 0) {
            const projectImages = matchedProject.images
              .map((i: any) => (typeof i === 'string' ? i : i.url))
              .filter(Boolean);

            if (projectImages.length > existingImages.length) {
              return {
                ...item,
                images: projectImages,
                mediaUrl: item.mediaUrl || projectImages[0],
                thumbnailUrl: item.thumbnailUrl || projectImages[0],
              };
            }
          }

          return {
            ...item,
            images: existingImages.length > 0 ? existingImages : (item.mediaUrl ? [item.mediaUrl] : (item.thumbnailUrl ? [item.thumbnailUrl] : [])),
          };
        });

        return (
          <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto animate-fade-in">
            <div className="text-center mb-2 px-4">
              {slide.badge && (
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1 block" style={{ color: accentColor }}>
                  {slide.badge}
                </span>
              )}
              {renderStyledTitle(slide.title)}
              {slide.subtitle && (
                <p className="text-slate-300 text-xs md:text-sm max-w-[850px] mx-auto mt-0.5">
                  {slide.subtitle}
                </p>
              )}
            </div>

            {/* Jesper Landberg 3D Curved Cylinder Carousel & 3D Grid Floor */}
            <Jesper3DCylinderShowcase
              items={enrichedShowcaseList}
              accentColor={accentColor}
              accentGlow={accentGlow}
              locale={locale}
              onOpen={openMediaModal}
              isBlackHoleOpen={Boolean(activeMediaModal)}
            />
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
              <p className="text-slate-300 text-sm md:text-base max-w-[850px] mx-auto mb-10 mt-2">
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
                <p className="text-slate-300 text-sm md:text-base max-w-[850px] mx-auto mt-2">
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

            {renderStyledTitle(slide.title || 'Empowering Global Comms')}

            {slide.subtitle && (
              <p className="text-base md:text-lg font-semibold text-white/90 mb-6 max-w-[850px] mx-auto mt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {slide.subtitle}
              </p>
            )}

            {/* Two Value Proposition Pillars on Closing */}
            {slide.cards && slide.cards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mx-auto mb-6 text-left">
                {slide.cards.map((card, cIdx) => (
                  <div key={cIdx} className="bg-[#0d0d14] border border-white/10 p-5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-lg" style={{ color: accentColor }}>verified</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{card.title}</h4>
                    </div>
                    {card.description && (
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{card.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : isDiDi ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mx-auto mb-6 text-left">
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
            ) : null}

            {/* Presenter Sign-off (Ultra discreto, elegante, minimalista) */}
            <div className="w-full max-w-xs mx-auto pt-5 border-t border-white/5 text-center space-y-0.5 flex flex-col items-center">
              <div className="text-sm md:text-base font-semibold text-slate-200 tracking-tight whitespace-nowrap">
                {presenterName}
              </div>
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase whitespace-nowrap">
                {presenterRole.replace(/\.$/, '')}
              </div>
            </div>

            {slide.cta?.text && (
              <div className="pt-5 text-center">
                <button
                  type="button"
                  onClick={() => handlePrimaryCtaClick(slide.cta?.link, slide.type)}
                  className="inline-flex items-center justify-center px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-[0.18em] text-white cursor-pointer transition-all transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: accentColor,
                    color: accentColor.toUpperCase() === '#FFFFFF' ? '#000000' : '#ffffff',
                    boxShadow: `0 0 24px ${accentGlow}`,
                  }}
                >
                  <span className="material-icons text-[16px] mr-2">send</span>
                  {slide.cta.text}
                </button>
              </div>
            )}
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
            {renderTeamSection(slide.teamMembers, slide.teamTitle)}
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isEditorPreview ? 'h-full min-h-full' : 'min-h-screen'} bg-[#07070b] text-white font-sans overflow-hidden select-none flex flex-col ${
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
              {headerBadge}
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

            {/* Download PDF Button with Loader & Click Guard */}
            {pitch.id && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                title={locale === 'en' ? (isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Deck') : (isGeneratingPdf ? 'Generando PDF...' : 'Descargar Presentación en PDF')}
              >
                {isGeneratingPdf ? (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: accentColor }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                ) : (
                  <span className="material-icons text-sm" style={{ color: accentColor }}>picture_as_pdf</span>
                )}
                <span className="hidden sm:inline">
                  {isGeneratingPdf
                    ? (locale === 'en' ? 'Generando…' : 'Generando…')
                    : 'PDF'}
                </span>
              </button>
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

      {/* ═══ Project Detail Modal ═══ */}
      <ProjectDetailModal
        isOpen={Boolean(activeMediaModal)}
        onClose={() => setActiveMediaModal(null)}
        item={activeMediaModal}
        accentColor={accentColor}
        accentGlow={accentGlow}
        locale={locale}
        brandName={brandName}
      />
    </div>
  );
}
