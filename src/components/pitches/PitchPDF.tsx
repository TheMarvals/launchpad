'use client';

import React from 'react';
import { PitchSlide } from './PitchViewer';

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

  const isDiDi = Boolean(
    pitch.theme === 'orange' ||
    pitch.theme === 'didi' ||
    (pitch.title && pitch.title.toLowerCase().includes('didi')) ||
    (clientDisplayName && clientDisplayName.toLowerCase().includes('didi'))
  );

  const accentColor = isDiDi ? '#FF7D00' : '#a855f7';
  const accentGlow = isDiDi ? 'rgba(255, 125, 0, 0.25)' : 'rgba(168, 85, 247, 0.22)';

  const renderStyledTitle = (text: string, isHero: boolean = false) => {
    if (!text) return null;
    const parts = text.split(/(DiDi|DIDI)/i);

    if (isHero) {
      return (
        <h1
          className="text-6xl font-black tracking-tighter leading-none mb-3 select-none"
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

    return (
      <h2
        className="text-3xl font-black tracking-tight uppercase leading-tight"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {parts.map((part, pIdx) => {
          if (part.toLowerCase() === 'didi') {
            return (
              <span
                key={pIdx}
                className="text-[#FF7D00] inline-block font-black"
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

  return (
    <div className="pdf-wrapper bg-[#07070b] text-white font-sans">
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          html, body {
            background-color: #07070b !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pdf-page {
            page-break-after: always;
            break-after: page;
            height: 100vh;
            width: 100vw;
          }
        }
      `}</style>

      {slides.map((slide, sIdx) => (
        <div
          key={slide.id || sIdx}
          className="pdf-page relative w-full h-[794px] overflow-hidden flex flex-col justify-between p-12 bg-[#07070b] border-b border-white/10"
          style={{
            pageBreakAfter: sIdx === slides.length - 1 ? 'auto' : 'always',
            breakAfter: sIdx === slides.length - 1 ? 'auto' : 'page',
          }}
        >
          {/* Subtle glow background */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div
              className="absolute -top-[150px] -right-[100px] w-[500px] h-[500px]"
              style={{ background: `radial-gradient(ellipse at center, ${accentGlow} 0%, transparent 70%)` }}
            />
            <div
              className="absolute -bottom-[150px] -left-[100px] w-[400px] h-[400px]"
              style={{ background: 'radial-gradient(ellipse at center, rgba(0,220,229,0.15) 0%, transparent 70%)' }}
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
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
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}>
                {isDiDi ? 'DIDI RFI DECK' : 'PITCH DECK'}
              </span>
            </div>

            <div className="text-xs font-bold text-slate-400">
              {clientDisplayName && <span className="uppercase text-white">{clientDisplayName}</span>}
            </div>
          </div>

          {/* Slide Body Content */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
            {slide.type === 'hero' && (
              <div className="max-w-3xl space-y-4">
                {slide.badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: accentColor }}>{slide.badge}</span>
                  </div>
                )}
                {renderStyledTitle(slide.title || brandName, true)}
                {slide.subtitle && <p className="text-xl font-bold text-white/90">{slide.subtitle}</p>}
                {slide.content && <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">{slide.content}</p>}
              </div>
            )}

            {slide.type === 'pillars' && (
              <div className="w-full max-w-5xl space-y-6">
                <div>
                  {slide.badge && <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>{slide.badge}</span>}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && <p className="text-xs text-slate-300 max-w-xl mx-auto mt-1">{slide.subtitle}</p>}
                </div>
                <div className="grid grid-cols-3 gap-4 text-left">
                  {(slide.cards || []).map((card, cIdx) => (
                    <div key={cIdx} className="bg-[#0d0d14] border border-white/10 p-5 rounded-xl space-y-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border mb-2" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}>
                        <span className="material-icons text-xl">{card.icon || 'star'}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{card.title}</h3>
                      {card.subtitle && <p className="text-[9px] uppercase font-bold" style={{ color: accentColor }}>{card.subtitle}</p>}
                      <p className="text-xs text-slate-300 leading-relaxed">{card.description}</p>
                      {card.tags && (
                        <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
                          {card.tags.map((t, tIdx) => (
                            <span key={tIdx} className="text-[8px] uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 text-slate-300">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'problem_solution' && (
              <div className="w-full max-w-4xl space-y-6">
                <div>
                  {slide.badge && <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>{slide.badge}</span>}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && <p className="text-xs text-slate-300 max-w-xl mx-auto mt-1">{slide.subtitle}</p>}
                </div>
                <div className="grid grid-cols-2 gap-5 text-left">
                  {(slide.cards || []).map((card, cIdx) => (
                    <div key={cIdx} className={`p-6 rounded-xl border ${card.highlight ? 'bg-[#151210]' : 'bg-[#0d0d14] border-white/10'}`} style={card.highlight ? { borderColor: `${accentColor}50` } : {}}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-icons text-xl" style={{ color: card.highlight ? accentColor : '#94a3b8' }}>{card.icon || 'verified'}</span>
                        <h3 className="text-sm font-bold text-white">{card.title}</h3>
                      </div>
                      {card.subtitle && <p className="text-[9px] uppercase font-semibold text-slate-400 mb-2">{card.subtitle}</p>}
                      <p className="text-xs text-slate-300 leading-relaxed">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'showcase' && (
              <div className="w-full max-w-5xl space-y-4">
                <div>
                  {slide.badge && <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>{slide.badge}</span>}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && <p className="text-xs text-slate-300 max-w-xl mx-auto mt-1">{slide.subtitle}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3 text-left">
                  {(slide.showcaseItems || []).slice(0, 6).map((item, idx) => (
                    <div key={idx} className="bg-[#0d0d14] border border-white/10 rounded-lg overflow-hidden flex flex-col">
                      <div className="aspect-video bg-black/60 overflow-hidden relative">
                        {item.thumbnailUrl || item.mediaUrl ? (
                          <img src={item.thumbnailUrl || item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">Image</div>
                        )}
                        <span className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 text-[8px] uppercase font-bold text-white rounded">
                          {item.mediaType || 'Work'}
                        </span>
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'metrics' && (
              <div className="w-full max-w-4xl space-y-6">
                <div>
                  {slide.badge && <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>{slide.badge}</span>}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && <p className="text-xs text-slate-300 max-w-xl mx-auto mt-1">{slide.subtitle}</p>}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {(slide.metrics || []).map((m, mIdx) => (
                    <div key={mIdx} className="bg-[#0d0d14] border border-white/10 p-5 rounded-xl text-center">
                      <div className="text-3xl font-black text-white mb-1" style={{ color: accentColor }}>{m.value}</div>
                      <div className="text-xs font-bold uppercase text-slate-200">{m.label}</div>
                      {m.subtext && <div className="text-[10px] text-slate-400 mt-1">{m.subtext}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'roadmap' && (
              <div className="w-full max-w-5xl space-y-6">
                <div>
                  {slide.badge && <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>{slide.badge}</span>}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && <p className="text-xs text-slate-300 max-w-xl mx-auto mt-1">{slide.subtitle}</p>}
                </div>
                <div className="grid grid-cols-3 gap-4 text-left">
                  {(slide.timeline || []).map((step, sIdx) => (
                    <div key={sIdx} className="bg-[#0d0d14] border border-white/10 p-5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-xs font-bold" style={{ color: accentColor }}>{step.phase}</span>
                        <span className="text-[9px] text-slate-400">{step.duration}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{step.title}</h4>
                      <ul className="space-y-1">
                        {step.deliverables.map((d, dIdx) => (
                          <li key={dIdx} className="text-[11px] text-slate-300 flex items-start gap-1">
                            <span className="text-primary">•</span>
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
              <div className="w-full max-w-3xl space-y-6">
                <div>
                  {slide.badge && <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: accentColor }}>{slide.badge}</span>}
                  {renderStyledTitle(slide.title)}
                  {slide.subtitle && <p className="text-sm font-semibold text-white/90 max-w-lg mx-auto mt-1">{slide.subtitle}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase" style={{ color: accentColor }}>Agile Daily Comms</h4>
                    <p className="text-[11px] text-slate-300">&lt;24-48h turnaround for banners, email templates, and D-Hub/D-Channel assets.</p>
                  </div>
                  <div className="bg-[#0d0d14] border border-white/10 p-4 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase" style={{ color: accentColor }}>Major Events & VRA</h4>
                    <p className="text-[11px] text-slate-300">Multimedia production for Get-Together & Value Star with 100% VRA InfoSec compliance.</p>
                  </div>
                </div>
                <div className="bg-[#12121a] border border-white/15 p-4 rounded-xl max-w-md mx-auto text-left space-y-1">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Account Lead Contact</div>
                  <div className="text-sm font-bold text-white">{presenterName}</div>
                  <div className="text-xs text-primary font-medium">{presenterRole}</div>
                  <div className="text-xs text-slate-300 pt-1 border-t border-white/10">
                    {presenterEmail} • {presenterPhone}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
            <div>{brandName} • 2026 Creative & Multimedia Partner</div>
            <div className="font-bold" style={{ color: accentColor }}>{sIdx + 1} / {slides.length}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
