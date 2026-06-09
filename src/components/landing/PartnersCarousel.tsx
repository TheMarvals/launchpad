'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
}

interface Props {
  partners: Partner[];
}

export default function PartnersCarousel({ partners }: Props) {
  const t = useTranslations('Landing');
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Infinite auto-scroll
  useEffect(() => {
    if (partners.length === 0) return;
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    let animationId: number;
    let speed = 0.5; // pixels per frame

    const scroll = () => {
      if (!scrollEl) return;
      scrollEl.scrollLeft += speed;

      // Reset to start when reaching the end (for seamless loop with duplicated content)
      if (scrollEl.scrollLeft >= scrollEl.scrollWidth / 2) {
        scrollEl.scrollLeft = 0;
      }

      animationId = requestAnimationFrame(scroll);
    };

    // Pause on hover
    const handleMouseEnter = () => { speed = 0; };
    const handleMouseLeave = () => { speed = 0.5; };
    scrollEl.addEventListener('mouseenter', handleMouseEnter);
    scrollEl.addEventListener('mouseleave', handleMouseLeave);

    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
      scrollEl.removeEventListener('mouseenter', handleMouseEnter);
      scrollEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [partners.length]);

  // Intersection Observer for section entrance
  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setSectionVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
  }, []);

  if (partners.length === 0) return null;

  // Duplicate partners for seamless infinite scroll
  const duplicatedPartners = [...partners, ...partners];

  return (
    <section ref={sectionRef} className={`py-xl md:py-xxl border-t border-hairline relative overflow-hidden transition-all duration-700 ease-out ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />

      <div className="max-w-[1100px] mx-auto relative z-10 px-xs md:px-0">
        {/* Section title */}
        <div className="text-center mb-lg">
          <span className="text-[9px] uppercase tracking-[0.2em] text-primary-active font-semibold mb-sm block">
            {t('partnersTag')}
          </span>
          <h2
            className="text-[clamp(1.2rem,2.5vw,2rem)] font-black tracking-tighter"
            style={{
              WebkitTextFillColor: 'transparent',
              WebkitTextStrokeColor: '#ffffff',
              WebkitTextStrokeWidth: '1px',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {t('partnersTitle')}
          </h2>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-sm" style={{ width: 'clamp(60px, 8vw, 100px)' }} />
        </div>

        {/* Scrolling logos */}
        <div
          ref={scrollRef}
          className="overflow-hidden"
          style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
        >
            <div className="flex gap-xl md:gap-xxl items-center py-sm">
              {duplicatedPartners.map((partner, idx) => (
                <a
                  key={`${partner.id}-${idx}`}
                  href={partner.websiteUrl || undefined}
                  target={partner.websiteUrl ? '_blank' : undefined}
                  rel={partner.websiteUrl ? 'noopener noreferrer' : undefined}
                  className="group flex-shrink-0 transition-all duration-300 hover:scale-105"
                  title={partner.name}
                >
                  <div className="w-[120px] h-[60px] md:w-[160px] md:h-[70px] flex items-center justify-center">
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain opacity-40 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0"
                      loading="lazy"
                    />
                  </div>
                </a>
              ))}
            </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-logos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
