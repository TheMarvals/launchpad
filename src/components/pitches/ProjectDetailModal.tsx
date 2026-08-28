'use client';

import React, { useState, useEffect } from 'react';
import { ShowcaseItem } from './PitchViewer';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShowcaseItem | null;
  accentColor?: string;
  accentGlow?: string;
  locale?: string;
  brandName?: string;
}

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  return Boolean(
    url.match(/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i) ||
    url.includes('/video/upload/') ||
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com')
  );
};

const getVideoPoster = (url?: string) => {
  if (!url) return '';
  if (url.includes('/video/upload/') || url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)) {
    return url.replace(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, '.jpg');
  }
  return '';
};

export default function ProjectDetailModal({
  isOpen,
  onClose,
  item,
  accentColor = '#ffffff',
  accentGlow = 'rgba(255,255,255,0.2)',
  locale = 'es',
  brandName = 'LAUNCHPAD',
}: ProjectDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Extract images
  const images: string[] = item
    ? (Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.mediaUrl ? [item.mediaUrl] : (item.thumbnailUrl ? [item.thumbnailUrl] : [])))
    : [];

  // Reset image index on item change
  useEffect(() => {
    setActiveImageIndex(0);
    setIsZoomed(false);
  }, [item]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isZoomed, images.length, onClose]);

  if (!isOpen || !item) return null;

  const currentImage = images[activeImageIndex] || item.mediaUrl || item.thumbnailUrl || '';
  const isCurrentVideo = item.mediaType === 'video' || isVideoUrl(currentImage);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in"
      onClick={onClose}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Top Floating Close Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto px-4 py-1.5 bg-white/10 hover:bg-white hover:text-black border border-white/20 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] text-white transition-all duration-300 shadow-2xl flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
        >
          <span>{locale === 'en' ? 'Close' : 'Cerrar'}</span>
          <span className="text-xs">✕</span>
        </button>
      </div>

      {/* Main Modal Card */}
      <div
        className="relative w-full max-w-5xl max-h-[88vh] bg-zinc-950/95 border border-white/15 rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.9)] flex flex-col lg:flex-row pointer-events-auto select-text text-white"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 0 60px -15px ${accentGlow}`,
        }}
      >
        {/* LEFT / TOP: Interactive Hero Media Gallery */}
        <div className="lg:w-[58%] bg-black/60 flex flex-col justify-between p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10 relative">
          {/* Main Featured Image Container */}
          <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group">
            {isCurrentVideo ? (
              <video
                key={currentImage}
                src={currentImage}
                poster={getVideoPoster(currentImage) || undefined}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : currentImage ? (
              <img
                src={currentImage}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm font-mono">
                No Preview Available
              </div>
            )}

            {/* Image Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Navigation Overlay Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-white hover:text-black border border-white/20 text-white flex items-center justify-center transition-all duration-200 shadow-xl opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-md"
                  aria-label="Previous image"
                >
                  <span className="material-icons text-base">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev + 1) % images.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-white hover:text-black border border-white/20 text-white flex items-center justify-center transition-all duration-200 shadow-xl opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-md"
                  aria-label="Next image"
                >
                  <span className="material-icons text-base">chevron_right</span>
                </button>
              </>
            )}

            {/* Top Image Badges */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
              {images.length > 1 && (
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-black/70 border border-white/15 text-white/80 backdrop-blur-md">
                  {String(activeImageIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                </span>
              )}
              {!isCurrentVideo && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="pointer-events-auto p-1.5 rounded-full bg-black/70 hover:bg-white hover:text-black border border-white/15 text-white/80 transition-colors shadow-lg cursor-pointer backdrop-blur-md"
                  title={locale === 'en' ? 'Click to enlarge' : 'Clic para agrandar'}
                >
                  <span className="material-icons text-sm block">fullscreen</span>
                </button>
              )}
            </div>
          </div>

          {/* Thumbnails Filmstrip Carousel */}
          {images.length > 1 && (
            <div className="mt-4 flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {images.map((img, idx) => {
                const isVid = isVideoUrl(img);
                const poster = isVid ? getVideoPoster(img) : '';
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-13 rounded-xl overflow-hidden border transition-all duration-200 shrink-0 cursor-pointer bg-zinc-900 ${
                      idx === activeImageIndex
                        ? 'border-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white/40'
                        : 'border-white/15 opacity-50 hover:opacity-90'
                    }`}
                  >
                    {isVid ? (
                      poster ? (
                        <div className="w-full h-full relative">
                          <img src={poster} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="material-icons text-sm text-white drop-shadow">play_circle</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 relative">
                          <video src={img} className="w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="material-icons text-sm text-white drop-shadow">play_circle</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT / BOTTOM: Editorial Story & Specifications */}
        <div className="lg:w-[42%] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] lg:max-h-none space-y-6">
          <div className="space-y-4">
            {/* Client & Category Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.client && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white shadow-sm">
                  {item.client}
                </span>
              )}
              {item.subtitle && (
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-400">
                  {item.subtitle}
                </span>
              )}
            </div>

            {/* Project Title */}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {item.title}
            </h2>

            {/* Divider */}
            <div className="w-12 h-[2px] rounded-full" style={{ backgroundColor: accentColor }} />

            {/* Narrative Description */}
            {item.description ? (
              <p className="text-sm text-zinc-300 leading-relaxed font-light whitespace-pre-line">
                {item.description}
              </p>
            ) : (
              <p className="text-sm text-zinc-500 italic">
                {locale === 'en' ? 'No detailed description provided.' : 'Sin descripción detallada.'}
              </p>
            )}

            {/* Tags / Deliverables */}
            {item.tags && item.tags.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 block">
                  {locale === 'en' ? 'Scope / Tags' : 'Alcance / Etiquetas'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono tracking-wide text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Links */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            {item.externalUrl ? (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-lg"
              >
                <span>{locale === 'en' ? 'Visit Project' : 'Visitar Proyecto'}</span>
                <span className="material-icons text-sm">arrow_outward</span>
              </a>
            ) : (
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {locale === 'en' ? 'Confidential Client Case' : 'Caso de Estudio Confidencial'}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {locale === 'en' ? 'Back to Deck' : 'Volver a la Presentación'}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Mode */}
      {isZoomed && currentImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 animate-fade-in p-4 sm:p-8"
          onClick={() => setIsZoomed(false)}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-8 px-4 py-1.5 bg-black/80 hover:bg-white hover:text-black border border-white/20 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] text-white transition-all shadow-2xl z-20 cursor-pointer"
          >
            {locale === 'en' ? 'Exit Fullscreen' : 'Salir'} ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-white hover:text-black border border-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
              >
                <span className="material-icons text-xl">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev + 1) % images.length);
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-white hover:text-black border border-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
              >
                <span className="material-icons text-xl">chevron_right</span>
              </button>
            </>
          )}

          {isCurrentVideo ? (
            <video
              src={currentImage}
              controls
              autoPlay
              playsInline
              className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={currentImage}
              alt=""
              className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
