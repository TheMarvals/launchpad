'use client';

import React from 'react';
import { PitchSlide, parsePitchTheme, hexToRgba, getFontFamily } from './PitchViewer';

interface PitchPDFProps {
  pitch: {
    id?: string;
    correlativo?: number;
    title: string;
    subtitle?: string | null;
    clientName?: string | null;
    client?: any;
    user?: any;
    theme?: string;
    slides: PitchSlide[] | any;
  };
  companyProfile?: any;
  locale?: string;
}

export default function PitchPDF({ pitch, companyProfile, locale = 'en' }: PitchPDFProps) {
  const slides: PitchSlide[] = Array.isArray(pitch.slides) ? pitch.slides : [];
  const clientDisplayName = pitch.client?.razonSocial || pitch.clientName;
  const brandName = companyProfile?.brandNameHeader || 'LAUNCHPAD';
  const presenterName = pitch.user?.name || companyProfile?.user?.name || 'Eduardo Marval';
  const presenterRole = pitch.user?.cargo || companyProfile?.user?.cargo || 'Lead Solution Architect';
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

  const renderStyledTitle = (text: string, isHero: boolean = false) => {
    if (!text) return null;
    const isLaunchpadWordmark = text.trim().toUpperCase() === 'LAUNCHPAD' || brandName.toUpperCase() === text.trim().toUpperCase();
    const clientKeyword = clientDisplayName || 'DiDi';
    const escapedKeyword = clientKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword}|DiDi|DIDI|LAUNCHPAD)`, 'gi');
    const parts = text.split(regex);

    if (isHero && isLaunchpadWordmark) {
      return (
        <h1
          className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-3 uppercase"
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
      return (
        <h1
          className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-3 uppercase text-white"
          style={{
            fontFamily: titleFontFamily,
          }}
        >
          {text}
        </h1>
      );
    }

    return (
      <h2
        className="text-2xl md:text-3xl font-black tracking-normal uppercase leading-tight text-white mb-2"
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
                className="inline font-black"
                style={{ color: accentColor }}
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

  return (
    <div className="pdf-wrapper bg-[#07070b] text-white font-sans">
      {/* External Web Fonts for Puppeteer & Print rendering */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800&family=Geist:wght@400;600;700;800&display=swap"
      />

      <style>{`
        @page {
          size: 1123px 794px;
          margin: 0;
        }
        @media print {
          html, body {
            background-color: #07070b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        .pdf-page {
          width: 1123px !important;
          min-width: 1123px !important;
          max-width: 1123px !important;
          height: 794px !important;
          min-height: 794px !important;
          max-height: 794px !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: always !important;
          break-after: page !important;
        }
        .material-icons {
          font-family: 'Material Icons' !important;
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {slides.map((slide, sIdx) => (
        <div
          key={slide.id || sIdx}
          className="pdf-page relative overflow-hidden flex flex-col justify-between p-10 bg-[#07070b] border-b border-white/10"
          style={{
            pageBreakAfter: sIdx === slides.length - 1 ? 'auto' : 'always',
            breakAfter: sIdx === slides.length - 1 ? 'auto' : 'page',
          }}
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div
              className="absolute -top-[120px] -right-[80px] w-[500px] h-[500px]"
              style={{ background: `radial-gradient(ellipse at center, ${accentGlow} 0%, transparent 70%)` }}
            />
            <div
              className="absolute -bottom-[120px] -left-[80px] w-[400px] h-[400px]"
              style={{ background: 'radial-gradient(ellipse at center, rgba(0,98,255,0.12) 0%, transparent 70%)' }}
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span
                className="text-base font-black tracking-wider text-white uppercase"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {brandName}
              </span>
              <span
                className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}
              >
                {isDiDi ? 'DIDI RFI DECK' : 'PITCH DECK'}
              </span>
            </div>

            <div className="text-xs font-bold tracking-wider">
              {clientDisplayName && (
                <span className="uppercase text-white font-bold" style={{ color: accentColor }}>
                  {clientDisplayName}
                </span>
              )}
            </div>
          </div>

          {/* Slide Body Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center w-full px-6">
            {slide.type === 'hero' && (
              <div className="w-full max-w-4xl space-y-3">
                {slide.badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  </div>
                )}

                {renderStyledTitle(slide.title || brandName, true)}

                {slide.subtitle && (
                  <p className="text-lg md:text-xl font-bold text-white/90 w-full max-w-2xl mx-auto leading-snug">
                    {slide.subtitle}
                  </p>
                )}

                {clientDisplayName && (
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-white/5 border border-white/10 rounded-full my-2">
                    <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">
                      {locale === 'es' ? 'PREPARADO PARA:' : 'PREPARED FOR:'}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: accentColor }}>
                      {clientDisplayName}
                    </span>
                  </div>
                )}

                {slide.content && (
                  <p className="text-xs md:text-sm text-slate-300 w-full max-w-2xl mx-auto leading-relaxed pt-2">
                    {slide.content}
                  </p>
                )}
              </div>
            )}

            {slide.type === 'pillars' && (
              <div className="w-full max-w-5xl space-y-4">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-2xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-left w-full">
                  {(slide.cards || []).map((card, cIdx) => (
                    <div key={cIdx} className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                      <div>
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center border mb-2"
                          style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}
                        >
                          <span className="material-icons text-lg">{card.icon || 'star'}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{card.title}</h3>
                        {card.subtitle && (
                          <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: accentColor }}>
                            {card.subtitle}
                          </p>
                        )}
                        <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{card.description}</p>
                      </div>
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10 mt-2">
                          {card.tags.map((t, tIdx) => (
                            <span key={tIdx} className="text-[8px] uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 text-slate-300 rounded-sm">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'problem_solution' && (
              <div className="w-full max-w-4xl space-y-4">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-2xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5 text-left w-full">
                  {(slide.cards || []).map((card, cIdx) => (
                    <div
                      key={cIdx}
                      className={`p-5 rounded-xl border ${card.highlight ? 'bg-[#151210]' : 'bg-[#0d0d14] border-white/10'}`}
                      style={card.highlight ? { borderColor: `${accentColor}60` } : {}}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-icons text-xl" style={{ color: card.highlight ? accentColor : '#94a3b8' }}>
                          {card.icon || 'verified'}
                        </span>
                        <h3 className="text-sm font-bold text-white">{card.title}</h3>
                      </div>
                      {card.subtitle && (
                        <p className="text-[9px] uppercase font-semibold text-slate-400 mb-2 tracking-wider">
                          {card.subtitle}
                        </p>
                      )}
                      <p className="text-xs text-slate-300 leading-relaxed">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'showcase' && (
              <div className="w-full max-w-5xl space-y-4">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-2xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-left w-full">
                  {(slide.showcaseItems || []).slice(0, 3).map((item, idx) => {
                    const isVideo = item.mediaType === 'video' || (item.mediaUrl && item.mediaUrl.match(/\.(mp4|webm|mov)$/i));
                    const isSlide = item.mediaType === 'slide';
                    const mainImg = item.thumbnailUrl || (item.images && item.images[0]) || item.mediaUrl;
                    const galleryImages = Array.isArray(item.images) && item.images.length > 1 ? item.images.slice(1, 4) : [];
                    const clickUrl = item.externalUrl || item.mediaUrl;

                    return (
                      <a
                        key={idx}
                        href={clickUrl || '#'}
                        target={clickUrl ? '_blank' : undefined}
                        rel="noreferrer"
                        className="bg-[#0d0d14] border border-white/15 rounded-xl overflow-hidden flex flex-col no-underline text-inherit block"
                      >
                        {/* Main Featured Image Container */}
                        <div className="aspect-video bg-black/60 overflow-hidden relative">
                          {mainImg ? (
                            <img
                              src={mainImg}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">Image</div>
                          )}

                          {/* Media Type Badge */}
                          <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 text-[8px] uppercase font-bold text-white rounded border border-white/10 flex items-center gap-1">
                            <span className="material-icons text-[10px]" style={{ color: accentColor }}>
                              {isVideo ? 'play_circle' : isSlide ? 'slideshow' : 'collections'}
                            </span>
                            <span>{item.mediaType || 'Work'}</span>
                          </span>

                          {/* Client Tag */}
                          {item.client && (
                            <span className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 text-[8px] uppercase font-semibold text-slate-300 rounded border border-white/10">
                              {item.client}
                            </span>
                          )}

                          {/* Video Play Overlay */}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="w-9 h-9 rounded-full text-black flex items-center justify-center shadow-lg" style={{ backgroundColor: accentColor }}>
                                <span className="material-icons text-lg">play_arrow</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Mini Gallery Strip (Option A) */}
                        {galleryImages.length > 0 && (
                          <div className="px-2 pt-1.5 pb-0.5 bg-black/40 flex items-center justify-between gap-1.5 border-t border-white/5">
                            <div className="flex items-center gap-1">
                              {galleryImages.map((gImg, gIdx) => (
                                <img
                                  key={gIdx}
                                  src={gImg}
                                  alt=""
                                  className="w-8 h-6 object-cover rounded border border-white/10"
                                />
                              ))}
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                              +{(item.images || []).length} {locale === 'en' ? 'Photos' : 'Fotos'}
                            </span>
                          </div>
                        )}

                        {/* Card Info */}
                        <div className="p-3 space-y-1">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          {item.subtitle && (
                            <p className="text-[9px] uppercase font-semibold tracking-wider" style={{ color: accentColor }}>
                              {item.subtitle}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {slide.type === 'metrics' && (
              <div className="w-full max-w-4xl space-y-5">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-2xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4 w-full">
                  {(slide.metrics || []).map((m, mIdx) => (
                    <div key={mIdx} className="bg-[#0d0d14] border border-white/10 p-5 rounded-xl text-center">
                      <div className="text-3xl font-black mb-1" style={{ color: accentColor }}>
                        {m.value}
                      </div>
                      <div className="text-xs font-bold uppercase text-slate-200">{m.label}</div>
                      {m.subtext && <div className="text-[10px] text-slate-400 mt-1">{m.subtext}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'roadmap' && (
              <div className="w-full max-w-5xl space-y-4">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-2xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-left w-full">
                  {(slide.timeline || []).map((step, stIdx) => (
                    <div key={stIdx} className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                        <span className="text-xs font-bold" style={{ color: accentColor }}>
                          {step.phase}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">{step.duration}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{step.title}</h4>
                      <ul className="space-y-1 pt-1">
                        {step.deliverables.map((d, dIdx) => (
                          <li key={dIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <span style={{ color: accentColor }}>•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'cta' && (
              <div className="w-full max-w-2xl mx-auto space-y-4">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs font-medium text-slate-300 w-full max-w-lg mx-auto mt-1">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-left w-full">
                  <div className="bg-[#0d0d14] border border-white/10 p-3.5 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                      Agile Daily Comms
                    </h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      &lt;24-48h turnaround for banners, email templates, and D-Hub/D-Channel assets with bilingual EN/ES & CN agility.
                    </p>
                  </div>
                  <div className="bg-[#0d0d14] border border-white/10 p-3.5 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                      Major Events & VRA
                    </h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Multimedia production for Get-Together & Value Star with 100% VRA InfoSec compliance readiness.
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-sm mx-auto bg-[#12121a] border border-white/15 p-4 rounded-xl text-center space-y-1 shadow-lg">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Account Lead</div>
                  <div className="text-sm font-bold text-white">{presenterName}</div>
                  <div className="text-xs font-medium" style={{ color: accentColor }}>
                    {presenterRole}
                  </div>
                  <div className="text-xs text-slate-300 pt-2 border-t border-white/10">
                    <span>{presenterEmail}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
            <div>{brandName} • 2026 Creative & Multimedia Partner</div>
            <div className="font-bold tracking-wider" style={{ color: accentColor }}>
              {sIdx + 1} / {slides.length}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
