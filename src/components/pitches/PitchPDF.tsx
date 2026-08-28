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
  senderIdentities?: any[];
  showcaseProjects?: any[];
  locale?: string;
}

export default function PitchPDF({
  pitch,
  companyProfile,
  senderIdentities,
  showcaseProjects,
  locale = 'en',
}: PitchPDFProps) {
  const slides: PitchSlide[] = Array.isArray(pitch.slides) ? (pitch.slides as any[]).filter((s) => s.type !== 'emailConfig') : [];
  const clientDisplayName = pitch.client?.razonSocial || pitch.clientName;
  const brandName = companyProfile?.brandNameHeader || 'LAUNCHPAD';

  // Authorized Sender Identity / Signature from Settings (same as PitchViewer)
  const primarySender = senderIdentities?.[0] || null;
  const rawSig = primarySender?.signature?.trim() || '';
  const sigLines = rawSig.split('\n').map((l: string) => l.trim()).filter(Boolean);

  // Extract human presenter name (never use generic contact labels)
  let presenterName = pitch.user?.name || companyProfile?.user?.name || '';
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
  let presenterRole = pitch.user?.cargo || '';
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

  const presenterEmail = companyProfile?.email || 'e.marval@themarvals.com';
  const presenterPhone = companyProfile?.phone || '+569 94438833';

  // Dynamic Theme & Font resolution
  const { color: accentColor, font: titleFont, headerBadge } = parsePitchTheme(pitch.theme, pitch.title, clientDisplayName);
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
              className="absolute -top-16 -right-16 w-96 h-96 rounded-full filter blur-[90px] opacity-20"
              style={{ backgroundColor: accentColor }}
            />
            <div
              className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full filter blur-[90px] opacity-15"
              style={{ backgroundColor: '#0062ff' }}
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
                {headerBadge}
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

                {(() => {
                  const heroTitle = (slide.title && slide.title.toUpperCase() === 'LAUNCHPAD') 
                    ? 'LAUNCHPAD' 
                    : (slide.title && !slide.title.toLowerCase().includes('rfi') && !slide.title.toLowerCase().includes('proposal') && slide.title.length <= 15)
                      ? slide.title
                      : brandName || 'LAUNCHPAD';

                  const heroSubtitle = (slide.title && slide.title !== heroTitle && slide.title !== 'LAUNCHPAD')
                    ? slide.title
                    : slide.subtitle || pitch.subtitle || 'Global Internal Communications & Multimedia Production';

                  return (
                    <>
                      {renderStyledTitle(heroTitle, true)}
                      {heroSubtitle && (
                        <p className="text-lg md:text-xl font-bold text-white/90 w-full max-w-2xl mx-auto leading-snug">
                          {heroSubtitle}
                        </p>
                      )}
                    </>
                  );
                })()}

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
                  <p className="text-xs md:text-sm text-slate-300 w-full max-w-3xl mx-auto leading-relaxed pt-2">
                    {slide.content}
                  </p>
                )}
              </div>
            )}            {slide.type === 'pillars' && (
              <div className="w-full max-w-5xl space-y-4">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-3xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.content && (
                    <p className="text-[11px] text-slate-300 w-full max-w-3xl mx-auto mt-2 leading-relaxed">
                      {slide.content}
                    </p>
                  )}
                </div>

                <div className={`grid gap-4 text-left w-full ${(slide.columns === 2 || (!slide.columns && (slide.cards || []).length === 2)) ? 'grid-cols-2 max-w-3xl mx-auto' : (slide.columns === 4 || (!slide.columns && (slide.cards || []).length >= 4)) ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {(slide.cards || []).map((card, cIdx) => {
                    const cardImg = card.imageUrl || card.logoUrl || card.avatarUrl;
                    return (
                      <div key={cIdx} className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          {cardImg ? (
                            <div className="w-9 h-9 rounded-full overflow-hidden border mb-2 p-0.5" style={{ borderColor: accentColor }}>
                              <img src={cardImg} alt={card.title} className="w-full h-full object-cover rounded-full" />
                            </div>
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center border mb-2"
                              style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}
                            >
                              <span className="material-icons text-lg">{card.icon || 'star'}</span>
                            </div>
                          )}
                          <h3 className="text-sm font-bold text-white">{card.title}</h3>
                          {card.subtitle && (
                            <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: accentColor }}>
                              {card.subtitle}
                            </p>
                          )}
                          {card.description && <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{card.description}</p>}
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
                    );
                  })}
                </div>

                {slide.teamMembers && slide.teamMembers.length > 0 && (
                  <div className="w-full mt-3 pt-3 border-t border-white/10">
                    <span className="text-[8px] uppercase tracking-widest font-bold block mb-2 text-center" style={{ color: accentColor }}>
                      {slide.teamTitle || 'Core Team & Leadership'}
                    </span>
                    <div className="flex flex-wrap justify-center gap-2.5 text-center w-full mx-auto">
                      {slide.teamMembers.map((member, mIdx) => {
                        const img = member.imageUrl || member.avatarUrl;
                        const memberInitials = (member.name || 'TM').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'TM';
                        return (
                          <div key={mIdx} className="w-[160px] bg-[#0d0d14] border border-white/10 p-3 rounded-xl flex flex-col items-center">
                            <div className="mb-2">
                              {img ? (
                                <div className="w-13 h-13 rounded-full overflow-hidden border-2 p-0.5" style={{ borderColor: accentColor }}>
                                  <img src={img} alt={member.name || 'Member'} className="w-full h-full object-cover rounded-full" />
                                </div>
                              ) : (
                                <div className="w-13 h-13 rounded-full flex items-center justify-center font-bold text-sm border-2" style={{ backgroundColor: `${accentColor}15`, borderColor: accentColor, color: accentColor }}>
                                  {memberInitials}
                                </div>
                              )}
                            </div>
                            <h5 className="text-[11px] font-bold text-white mb-0.5 truncate max-w-full">{member.name || 'Member'}</h5>
                            <p className="text-[8px] uppercase tracking-wider font-bold mb-1 truncate max-w-full" style={{ color: accentColor }}>{member.role || 'Executive Role'}</p>
                            {member.bio && <p className="text-[9px] text-slate-300 leading-snug line-clamp-2">{member.bio}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {slide.type === 'problem_solution' && (
              <div className={`w-full ${(slide.columns === 3 || (!slide.columns && (slide.cards || []).length === 3)) ? 'max-w-5xl' : 'max-w-4xl'} space-y-4`}>
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-3xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.content && (
                    <p className="text-[11px] text-slate-300 w-full max-w-3xl mx-auto mt-2 leading-relaxed">
                      {slide.content}
                    </p>
                  )}
                </div>

                <div className={`grid gap-4 text-left w-full ${(slide.columns === 3 || (!slide.columns && (slide.cards || []).length === 3)) ? 'grid-cols-3' : (slide.columns === 4 || (!slide.columns && (slide.cards || []).length >= 4)) ? 'grid-cols-4' : 'grid-cols-2'}`}>
                  {(slide.cards || []).map((card, cIdx) => {
                    const cardImg = card.imageUrl || card.logoUrl || card.avatarUrl;
                    return (
                      <div
                        key={cIdx}
                        className={`p-4 rounded-xl border ${card.highlight ? 'bg-[#151210]' : 'bg-[#0d0d14] border-white/10'}`}
                        style={card.highlight ? { borderColor: `${accentColor}60` } : {}}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {cardImg ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border p-0.5 shrink-0" style={{ borderColor: accentColor }}>
                              <img src={cardImg} alt={card.title} className="w-full h-full object-cover rounded-full" />
                            </div>
                          ) : (
                            <span className="material-icons text-lg shrink-0" style={{ color: card.highlight ? accentColor : '#94a3b8' }}>
                              {card.icon || 'verified'}
                            </span>
                          )}
                          <h3 className="text-xs font-bold text-white truncate">{card.title}</h3>
                        </div>
                        {card.subtitle && (
                          <p className="text-[9px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider truncate">
                            {card.subtitle}
                          </p>
                        )}
                        {card.description && <p className="text-[11px] text-slate-300 leading-relaxed">{card.description}</p>}
                      </div>
                    );
                  })}
                </div>

                {slide.teamMembers && slide.teamMembers.length > 0 && (
                  <div className="w-full mt-3 pt-3 border-t border-white/10">
                    <span className="text-[8px] uppercase tracking-widest font-bold block mb-2 text-center" style={{ color: accentColor }}>
                      {slide.teamTitle || 'Core Team & Leadership'}
                    </span>
                    <div className="flex flex-wrap justify-center gap-2.5 text-center w-full mx-auto">
                      {slide.teamMembers.map((member, mIdx) => {
                        const img = member.imageUrl || member.avatarUrl;
                        const memberInitials = (member.name || 'TM').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'TM';
                        return (
                          <div key={mIdx} className="w-[160px] bg-[#0d0d14] border border-white/10 p-3 rounded-xl flex flex-col items-center">
                            <div className="mb-2">
                              {img ? (
                                <div className="w-13 h-13 rounded-full overflow-hidden border-2 p-0.5" style={{ borderColor: accentColor }}>
                                  <img src={img} alt={member.name || 'Member'} className="w-full h-full object-cover rounded-full" />
                                </div>
                              ) : (
                                <div className="w-13 h-13 rounded-full flex items-center justify-center font-bold text-sm border-2" style={{ backgroundColor: `${accentColor}15`, borderColor: accentColor, color: accentColor }}>
                                  {memberInitials}
                                </div>
                              )}
                            </div>
                            <h5 className="text-[11px] font-bold text-white mb-0.5 truncate max-w-full">{member.name || 'Member'}</h5>
                            <p className="text-[8px] uppercase tracking-wider font-bold mb-1 truncate max-w-full" style={{ color: accentColor }}>{member.role || 'Executive Role'}</p>
                            {member.bio && <p className="text-[9px] text-slate-300 leading-snug line-clamp-2">{member.bio}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                    <p className="text-xs text-slate-300 w-full max-w-3xl mx-auto mt-1 leading-relaxed">
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
                    <p className="text-xs text-slate-300 w-full max-w-3xl mx-auto mt-1 leading-relaxed">
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
                    <p className="text-xs text-slate-300 w-full max-w-3xl mx-auto mt-1 leading-relaxed">
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
              <div className="w-full max-w-4xl mx-auto space-y-5 flex flex-col items-center">
                <div className="w-full text-center">
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title || 'Empowering Global Comms')}
                  {slide.subtitle && (
                    <p className="text-sm font-medium text-slate-300 w-full max-w-2xl mx-auto mt-2 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                {slide.cards && slide.cards.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 text-left w-full max-w-3xl">
                    {slide.cards.map((card, cIdx) => (
                      <div key={cIdx} className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="material-icons text-base" style={{ color: accentColor }}>verified</span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            {card.title}
                          </h4>
                        </div>
                        {card.description && (
                          <p className="text-[11px] text-slate-300 leading-relaxed">{card.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-left w-full max-w-3xl">
                    <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-base" style={{ color: accentColor }}>speed</span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Agile Daily Comms
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Rapid <span className="font-bold text-white">&lt;24-48h turnaround</span> for banners, email templates, and D-Hub/D-Channel assets with bilingual EN/ES & CN agility.
                      </p>
                    </div>
                    <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-base" style={{ color: accentColor }}>verified_user</span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Major Events & VRA
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Multimedia production for <span className="font-bold text-white">Get-Together & Value Star</span> with 100% VRA InfoSec compliance readiness.
                      </p>
                    </div>
                  </div>
                )}

                {/* Presenter Sign-off (Ultra discreto, elegante, minimalista, idéntico al interactivo) */}
                <div className="w-full max-w-xs mx-auto pt-5 border-t border-white/5 text-center space-y-0.5 flex flex-col items-center">
                  <div className="text-sm md:text-base font-semibold text-slate-200 tracking-tight whitespace-nowrap">
                    {slide.presenterName || presenterName}
                  </div>
                  <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase whitespace-nowrap">
                    {(slide.presenterRole || presenterRole).replace(/\.$/, '')}
                  </div>
                </div>
              </div>
            )}

            {slide.type === 'team' && (
              <div className="w-full max-w-5xl space-y-4 text-center">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title || 'Leadership & Core Team')}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-3xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.content && (
                    <p className="text-[11px] text-slate-300 w-full max-w-3xl mx-auto mt-2 leading-relaxed">
                      {slide.content}
                    </p>
                  )}
                </div>

                <div className={`grid gap-4 text-center w-full ${(slide.cards || []).length <= 2 ? 'grid-cols-2 max-w-2xl mx-auto' : (slide.cards || []).length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {(slide.cards || []).map((member, mIdx) => {
                    const img = member.imageUrl || member.avatarUrl || member.logoUrl;
                    const memberInitials = (member.title || 'TM').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'TM';
                    return (
                      <div key={mIdx} className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl flex flex-col items-center">
                        <div className="mb-2">
                          {img ? (
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 p-0.5" style={{ borderColor: accentColor }}>
                              <img src={img} alt={member.title} className="w-full h-full object-cover rounded-full" />
                            </div>
                          ) : (
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm border-2"
                              style={{ backgroundColor: `${accentColor}15`, borderColor: accentColor, color: accentColor }}
                            >
                              {memberInitials}
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white mb-0.5">{member.title}</h4>
                        {member.subtitle && (
                          <p className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: accentColor }}>
                            {member.subtitle}
                          </p>
                        )}
                        {member.description && (
                          <p className="text-[10px] text-slate-300 leading-relaxed mb-2 line-clamp-3">{member.description}</p>
                        )}
                        {member.tags && member.tags.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1 mt-auto pt-1.5 border-t border-white/10 w-full">
                            {member.tags.map((t, tIdx) => (
                              <span key={tIdx} className="text-[8px] uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 text-slate-300 rounded-sm">
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
            )}

            {slide.type === 'logos' && (
              <div className="w-full max-w-5xl space-y-4 text-center">
                <div>
                  {slide.badge && (
                    <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                      {slide.badge}
                    </span>
                  )}
                  {renderStyledTitle(slide.title || 'Clients & Brand Ecosystem')}
                  {slide.subtitle && (
                    <p className="text-xs text-slate-300 w-full max-w-3xl mx-auto mt-1 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.content && (
                    <p className="text-[11px] text-slate-300 w-full max-w-3xl mx-auto mt-2 leading-relaxed">
                      {slide.content}
                    </p>
                  )}
                </div>

                <div className={`grid gap-3 text-center w-full ${(slide.cards || []).length <= 3 ? 'grid-cols-3 max-w-2xl mx-auto' : (slide.cards || []).length <= 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
                  {(slide.cards || []).map((item, lIdx) => {
                    const img = item.imageUrl || item.logoUrl || item.avatarUrl;
                    return (
                      <div key={lIdx} className="bg-[#0d0d14] border border-white/10 p-3 rounded-xl flex flex-col items-center justify-center min-h-[90px]">
                        {img ? (
                          <div className="h-9 w-full flex items-center justify-center mb-1.5 px-1">
                            <img src={img} alt={item.title} className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5 border" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}>
                            <span className="material-icons text-sm">{item.icon || 'business'}</span>
                          </div>
                        )}
                        <h5 className="text-[11px] font-bold text-white truncate max-w-full">{item.title}</h5>
                        {item.subtitle && (
                          <p className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold truncate max-w-full">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {slide.type === 'custom' && (
              <div className="w-full max-w-4xl space-y-4 text-center">
                {slide.badge && (
                  <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>
                    {slide.badge}
                  </span>
                )}
                {renderStyledTitle(slide.title)}
                <div
                  className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm space-y-3 mt-4"
                  dangerouslySetInnerHTML={{ __html: slide.content || '' }}
                />
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
