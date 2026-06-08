'use client';

import { ReactNode } from 'react';

type EmptyStateVariant =
  | 'inbox'       // tickets
  | 'search'      // no search results
  | 'folder'      // projects
  | 'note'        // notes
  | 'task'        // tasks
  | 'document'    // quotes, invoices
  | 'server'      // servers
  | 'people'      // clients, contacts
  | 'check'       // reminders (all good)
  | 'product'     // products
  | 'mail'        // contact submissions
  | 'event'       // calendar
  | 'shield'      // security/logs
  | 'payment'     // billing, payments
  | 'chart'       // analytics, reports
  | 'chat'        // messaging, conversations
  | 'cloud'       // upload, storage, sync
  | 'star'        // favorites, ratings
  | 'clock'       // history, timeline, past-due
  | 'image'       // gallery, media, photos
  | 'link'        // integrations, connections
  | 'code'        // API, developer tools
  | 'bell'        // notifications, alerts

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

function Illustration({ variant }: { variant: EmptyStateVariant }) {
  const svgProps = {
    width: "120",
    height: "120",
    viewBox: "0 0 120 120",
    fill: "none",
    className: "mb-xs empty-state-svg",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (variant) {
    case 'inbox':
      return (
        <svg {...svgProps}>
          <rect x="20" y="35" width="80" height="55" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M20 55L48 75C50 76.3333 52 77 54 77H66C68 77 70 76.3333 72 75L100 55" stroke="currentColor" strokeWidth="1.5" className="text-muted" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 20L60 35L80 20" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'drawLine 1.5s ease-out 0.5s forwards' }} />
          <circle cx="60" cy="20" r="3" fill="currentColor" className="text-primary animate-pulse-dot" />
          <path d="M75 82L85 88M85 88L95 82M85 88V95" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'drawLine 1.2s ease-out 0.8s forwards' }} />
          <circle cx="85" cy="100" r="12" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" fill="none" />
        </svg>
      );

    case 'search':
      return (
        <svg {...svgProps}>
          <circle cx="52" cy="52" r="24" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <circle cx="52" cy="52" r="16" stroke="currentColor" strokeWidth="1" className="text-muted/30" fill="none" />
          <path d="M70 70L90 90" stroke="currentColor" strokeWidth="2" className="text-muted" strokeLinecap="round" />
          <path d="M30 30L38 38" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 15, strokeDashoffset: 15, animation: 'drawLine 0.8s ease-out 0.3s forwards' }} />
          <path d="M66 38L74 30" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 15, strokeDashoffset: 15, animation: 'drawLine 0.8s ease-out 0.5s forwards' }} />
          <circle cx="52" cy="52" r="3" fill="currentColor" className="text-primary animate-pulse-dot" />
          <path d="M30 82L40 82" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" style={{ strokeDasharray: 15, strokeDashoffset: 15, animation: 'drawLine 0.6s ease-out 0.7s forwards' }} />
          <path d="M50 82L60 82" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" style={{ strokeDasharray: 15, strokeDashoffset: 15, animation: 'drawLine 0.6s ease-out 0.9s forwards' }} />
        </svg>
      );

    case 'folder':
      return (
        <svg {...svgProps}>
          <path d="M15 40C15 37.2386 17.2386 35 20 35H48L56 45H100C102.761 45 105 47.2386 105 50V95C105 97.7614 102.761 100 100 100H20C17.2386 100 15 97.7614 15 95V40Z" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M15 40C15 37.2386 17.2386 35 20 35H48L56 45H100C102.761 45 105 47.2386 105 50V95C105 97.7614 102.761 100 100 100H20C17.2386 100 15 97.7614 15 95V40Z" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="none" />
          <path d="M38 70H82" stroke="currentColor" strokeWidth="1.5" className="text-muted/40" strokeLinecap="round" />
          <path d="M38 78H70" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <circle cx="88" cy="74" r="12" stroke="currentColor" strokeWidth="1.5" className="text-primary animate-pulse-ring" fill="none" />
          <path d="M88 68V80M82 74H94" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawLine 1s ease-out 0.6s forwards' }} />
        </svg>
      );

    case 'note':
      return (
        <svg {...svgProps}>
          <rect x="25" y="15" width="70" height="90" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M45 15V105" stroke="currentColor" strokeWidth="1" className="text-hairline/50" />
          <line x1="50" y1="35" x2="80" y2="35" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 35, strokeDashoffset: 35, animation: 'drawLine 0.6s ease-out 0.3s forwards' }} />
          <line x1="38" y1="35" x2="42" y2="35" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 10, strokeDashoffset: 10, animation: 'drawLine 0.3s ease-out 0.4s forwards' }} />
          <line x1="50" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 35, strokeDashoffset: 35, animation: 'drawLine 0.6s ease-out 0.5s forwards' }} />
          <line x1="38" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 10, strokeDashoffset: 10, animation: 'drawLine 0.3s ease-out 0.6s forwards' }} />
          <line x1="50" y1="65" x2="70" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 25, strokeDashoffset: 25, animation: 'drawLine 0.5s ease-out 0.7s forwards' }} />
          <line x1="38" y1="65" x2="42" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" style={{ strokeDasharray: 10, strokeDashoffset: 10, animation: 'drawLine 0.3s ease-out 0.8s forwards' }} />
          <circle cx="82" cy="80" r="10" stroke="currentColor" strokeWidth="1.5" className="text-primary animate-pulse-ring" fill="none" />
          <path d="M82 76V84M78 80H86" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawLine 0.8s ease-out 1s forwards' }} />
        </svg>
      );

    case 'task':
      return (
        <svg {...svgProps}>
          <rect x="25" y="20" width="70" height="80" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <line x1="40" y1="40" x2="85" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <line x1="40" y1="55" x2="75" y2="55" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <line x1="40" y1="70" x2="65" y2="70" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <circle cx="33" cy="40" r="3" fill="currentColor" className="text-hairline" />
          <circle cx="33" cy="55" r="3" fill="currentColor" className="text-hairline" />
          <circle cx="33" cy="70" r="3" fill="currentColor" className="text-hairline" />
          <circle cx="80" cy="88" r="12" stroke="currentColor" strokeWidth="1.5" className="text-primary animate-pulse-ring" fill="none" />
          <path d="M75 88L79 92L85 84" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawLine 0.8s ease-out 0.8s forwards' }} />
          <path d="M50 30L35 95" stroke="currentColor" strokeWidth="1" className="text-primary/10" strokeDasharray="3 3" />
        </svg>
      );

    case 'document':
      return (
        <svg {...svgProps}>
          <rect x="30" y="15" width="65" height="90" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M42 38H80" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <path d="M42 50H80" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <path d="M42 62H68" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <path d="M42 74H60" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <rect x="58" y="78" width="26" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-primary" fill="none" />
          <path d="M65 87L71 90L77 84" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawLine 0.8s ease-out 0.6s forwards' }} />
        </svg>
      );

    case 'server':
      return (
        <svg {...svgProps}>
          <rect x="25" y="25" width="70" height="70" rx="6" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <rect x="35" y="35" width="50" height="8" rx="2" stroke="currentColor" strokeWidth="1" className="text-muted/30" fill="currentColor" fillOpacity="0.05" />
          <rect x="35" y="50" width="50" height="8" rx="2" stroke="currentColor" strokeWidth="1" className="text-muted/30" fill="currentColor" fillOpacity="0.05" />
          <rect x="35" y="65" width="50" height="8" rx="2" stroke="currentColor" strokeWidth="1" className="text-muted/30" fill="currentColor" fillOpacity="0.05" />
          <circle cx="42" cy="39" r="2" fill="currentColor" className="text-primary animate-pulse-dot" />
          <circle cx="42" cy="54" r="2" fill="currentColor" className="text-primary animate-pulse-dot" style={{ animationDelay: '1.5s' }} />
          <circle cx="42" cy="69" r="2" fill="currentColor" className="text-primary animate-pulse-dot" style={{ animationDelay: '3s' }} />
          <path d="M85 85L95 90M95 90L85 95M95 90H75" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" strokeLinecap="round" />
          <circle cx="95" cy="90" r="2" fill="currentColor" className="text-primary animate-pulse-dot" style={{ animationDelay: '0.5s' }} />
        </svg>
      );

    case 'people':
      return (
        <svg {...svgProps}>
          <circle cx="48" cy="42" r="14" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M28 85C28 72.8506 36.9506 63 48 63C59.0494 63 68 72.8506 68 85" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <circle cx="78" cy="50" r="10" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" fill="none" />
          <path d="M65 82C65 73.7157 70.7857 67 78 67C85.2143 67 91 73.7157 91 82" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" strokeLinecap="round" />
          <circle cx="48" cy="42" r="7" fill="currentColor" className="text-primary/10 animate-pulse-dot" />
          <circle cx="78" cy="50" r="5" fill="currentColor" className="text-primary/10 animate-pulse-dot" style={{ animationDelay: '2s' }} />
          <path d="M95 95L102 88" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" />
          <circle cx="105" cy="85" r="8" stroke="currentColor" strokeWidth="1" className="text-primary/20 animate-pulse-ring" fill="none" />
        </svg>
      );

    case 'check':
      return (
        <svg {...svgProps}>
          <circle cx="60" cy="60" r="35" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <circle cx="60" cy="60" r="25" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="none" />
          <path d="M45 60L55 70L75 50" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'drawLine 1s ease-out 0.3s forwards' }} />
          <circle cx="60" cy="60" r="5" fill="currentColor" className="text-primary/20 animate-pulse-dot" />
          <path d="M30 30L36 36" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <path d="M84 84L90 90" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <path d="M30 90L36 84" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <path d="M84 36L90 30" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
        </svg>
      );

    case 'product':
      return (
        <svg {...svgProps}>
          <rect x="30" y="25" width="60" height="50" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <rect x="38" y="33" width="44" height="8" rx="2" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="currentColor" fillOpacity="0.05" />
          <rect x="38" y="46" width="30" height="6" rx="2" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="currentColor" fillOpacity="0.05" />
          <rect x="38" y="57" width="20" height="6" rx="2" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="currentColor" fillOpacity="0.05" />
          <path d="M60 75V90" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <path d="M45 90H75" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <path d="M50 80L85 80" stroke="currentColor" strokeWidth="1" className="text-primary/30" strokeLinecap="round" strokeDasharray="2 3" />
          <path d="M83 72L95 80L83 88" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 25, strokeDashoffset: 25, animation: 'drawLine 0.8s ease-out 0.5s forwards' }} />
        </svg>
      );

    case 'mail':
      return (
        <svg {...svgProps}>
          <rect x="20" y="40" width="80" height="50" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M20 45L60 70L100 45" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="38" cy="62" r="3" fill="currentColor" className="text-primary/20 animate-pulse-dot" />
          <circle cx="50" cy="62" r="3" fill="currentColor" className="text-primary/20 animate-pulse-dot" style={{ animationDelay: '1.5s' }} />
          <path d="M40 25L60 35L80 25" stroke="currentColor" strokeWidth="1" className="text-primary/30" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="60" cy="25" r="2" fill="currentColor" className="text-primary animate-pulse-dot" />
          <path d="M85 85L95 90M95 90L105 85M95 90V98" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 35, strokeDashoffset: 35, animation: 'drawLine 1s ease-out 0.6s forwards' }} />
        </svg>
      );

    case 'event':
      return (
        <svg {...svgProps}>
          <rect x="25" y="30" width="70" height="65" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <rect x="25" y="48" width="70" height="5" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="currentColor" fillOpacity="0.05" />
          <line x1="40" y1="30" x2="40" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <line x1="80" y1="30" x2="80" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <text x="60" y="44" textAnchor="middle" fill="currentColor" className="text-muted/30 text-xs" fontSize="8" fontFamily="monospace" opacity="0.5">MAY</text>
          <text x="60" y="74" textAnchor="middle" fill="currentColor" fontSize="24" fontWeight="600" fontFamily="monospace" className="text-ink/40">15</text>
          <circle cx="85" cy="72" r="8" stroke="currentColor" strokeWidth="1" className="text-primary animate-pulse-ring" fill="none" />
          <path d="M85 68V76M81 72H89" stroke="currentColor" strokeWidth="1" className="text-primary/60" strokeLinecap="round" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawLine 0.8s ease-out 0.5s forwards' }} />
        </svg>
      );

    case 'shield':
      return (
        <svg {...svgProps}>
          <path d="M60 15L100 35V65C100 82.5 82.5 97.5 60 105C37.5 97.5 20 82.5 20 65V35L60 15Z" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M60 25L90 40V60C90 74 76 86 60 92C44 86 30 74 30 60V40L60 25Z" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="none" />
          <path d="M48 60L56 68L72 52" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'drawLine 1s ease-out 0.4s forwards' }} />
          <circle cx="60" cy="60" r="3" fill="currentColor" className="text-primary/30 animate-pulse-dot" />
        </svg>
      );

    case 'payment':
      return (
        <svg {...svgProps}>
          <rect x="25" y="30" width="70" height="55" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <rect x="25" y="48" width="70" height="25" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="currentColor" fillOpacity="0.05" />
          <circle cx="60" cy="40" r="12" stroke="currentColor" strokeWidth="1.5" className="text-primary animate-pulse-ring" fill="none" />
          <path d="M54 40L58 44L66 36" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawLine 0.8s ease-out 0.4s forwards' }} />
          <rect x="35" y="58" width="50" height="5" rx="1" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="currentColor" fillOpacity="0.1" />
          <rect x="35" y="66" width="30" height="3" rx="1" stroke="currentColor" strokeWidth="1" className="text-muted/10" fill="currentColor" fillOpacity="0.1" />
          <path d="M90 52L98 56L90 60" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'chart':
      return (
        <svg {...svgProps}>
          <rect x="20" y="25" width="80" height="70" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <line x1="35" y1="80" x2="35" y2="35" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <line x1="35" y1="80" x2="90" y2="80" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <rect x="42" y="60" width="10" height="20" rx="1" fill="currentColor" className="text-primary" fillOpacity="0.3" />
          <rect x="56" y="48" width="10" height="32" rx="1" fill="currentColor" className="text-primary" fillOpacity="0.5" />
          <rect x="70" y="38" width="10" height="42" rx="1" fill="currentColor" className="text-primary animate-pulse-dot" fillOpacity="0.7" style={{ animationDelay: '1s' }} />
          <path d="M52 88L56 84L62 90L68 82L74 88" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawLine 0.8s ease-out 0.6s forwards' }} />
        </svg>
      );

    case 'chat':
      return (
        <svg {...svgProps}>
          <rect x="15" y="25" width="80" height="55" rx="6" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M55 80L45 65H35C25 65 15 55 15 45V25" stroke="currentColor" strokeWidth="1.5" className="text-muted/20" fill="none" />
          <circle cx="35" cy="45" r="4" fill="currentColor" className="text-muted/40" />
          <circle cx="55" cy="45" r="4" fill="currentColor" className="text-muted/40" />
          <circle cx="75" cy="45" r="4" fill="currentColor" className="text-muted/40" />
          <path d="M60 82L68 90" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 15, strokeDashoffset: 15, animation: 'drawLine 0.5s ease-out 0.5s forwards' }} />
          <path d="M68 82L60 90" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 15, strokeDashoffset: 15, animation: 'drawLine 0.5s ease-out 0.7s forwards' }} />
          <circle cx="64" cy="86" r="8" stroke="currentColor" strokeWidth="1" className="text-primary/30 animate-pulse-ring" fill="none" />
        </svg>
      );

    case 'cloud':
      return (
        <svg {...svgProps}>
          <path d="M35 70C28 70 22 64 22 57C22 50 28 44 35 44C35 34 44 26 55 26C64 26 72 32 75 40C82 42 88 48 88 56C88 64 82 70 75 70" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M55 45V65" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" />
          <path d="M45 55H65" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" />
          <path d="M35 70L28 82H82L75 70" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'drawLine 1s ease-out 0.5s forwards' }} />
          <circle cx="55" cy="68" r="3" fill="currentColor" className="text-primary animate-pulse-dot" />
        </svg>
      );

    case 'star':
      return (
        <svg {...svgProps}>
          <path d="M60 15L72 42L100 45L78 66L84 95L60 80L36 95L42 66L20 45L48 42Z" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" strokeLinejoin="round" />
          <path d="M60 25L69 47L92 50L74 67L79 90L60 78L41 90L46 67L28 50L51 47Z" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="none" strokeLinejoin="round" />
          <path d="M60 15L72 42L100 45L78 66L84 95L60 80L36 95L42 66L20 45L48 42Z" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ strokeDasharray: 250, strokeDashoffset: 250, animation: 'drawLine 1.5s ease-out 0.3s forwards' }} />
          <circle cx="60" cy="58" r="4" fill="currentColor" className="text-primary animate-pulse-dot" />
        </svg>
      );

    case 'clock':
      return (
        <svg {...svgProps}>
          <circle cx="60" cy="55" r="30" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <circle cx="60" cy="55" r="22" stroke="currentColor" strokeWidth="1" className="text-muted/20" fill="none" />
          <line x1="60" y1="55" x2="60" y2="38" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawLine 0.6s ease-out 0.3s forwards' }} />
          <line x1="60" y1="55" x2="72" y2="55" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 15, strokeDashoffset: 15, animation: 'drawLine 0.6s ease-out 0.5s forwards' }} />
          <circle cx="60" cy="55" r="4" fill="currentColor" className="text-primary/20 animate-pulse-dot" />
          <path d="M20 25L30 30" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <path d="M100 25L90 30" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <path d="M60 15V20" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <line x1="45" y1="90" x2="55" y2="95" stroke="currentColor" strokeWidth="1" className="text-primary/30" strokeLinecap="round" />
          <line x1="75" y1="90" x2="65" y2="95" stroke="currentColor" strokeWidth="1" className="text-primary/30" strokeLinecap="round" />
        </svg>
      );

    case 'image':
      return (
        <svg {...svgProps}>
          <rect x="20" y="25" width="80" height="65" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <circle cx="42" cy="45" r="8" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" fill="currentColor" fillOpacity="0.05" />
          <path d="M20 75L45 55L60 70L75 50L100 70" stroke="currentColor" strokeWidth="1.5" className="text-muted/20" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M35 75L60 58L80 75" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 35, strokeDashoffset: 35, animation: 'drawLine 0.8s ease-out 0.5s forwards' }} />
          <circle cx="42" cy="45" r="4" fill="currentColor" className="text-primary/30 animate-pulse-dot" />
          <path d="M90 95L98 90" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" />
          <circle cx="100" cy="88" r="6" stroke="currentColor" strokeWidth="1" className="text-primary/20 animate-pulse-ring" fill="none" />
        </svg>
      );

    case 'link':
      return (
        <svg {...svgProps}>
          <path d="M35 60L25 50C18 43 18 32 25 25C32 18 43 18 50 25L65 40C72 47 72 58 65 65C58 72 47 72 40 65" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="none" strokeLinecap="round" />
          <path d="M85 60L95 70C102 77 102 88 95 95C88 102 77 102 70 95L55 80C48 73 48 62 55 55C62 48 73 48 80 55" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" fill="none" strokeLinecap="round" />
          <path d="M48 72L72 48" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 35, strokeDashoffset: 35, animation: 'drawLine 0.8s ease-out 0.4s forwards' }} />
          <circle cx="48" cy="72" r="3" fill="currentColor" className="text-primary animate-pulse-dot" />
          <circle cx="72" cy="48" r="3" fill="currentColor" className="text-primary animate-pulse-dot" style={{ animationDelay: '1.5s' }} />
        </svg>
      );

    case 'code':
      return (
        <svg {...svgProps}>
          <rect x="20" y="25" width="80" height="65" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <line x1="35" y1="50" x2="50" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 25, strokeDashoffset: 25, animation: 'drawLine 0.6s ease-out 0.3s forwards' }} />
          <line x1="50" y1="50" x2="35" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" style={{ strokeDasharray: 25, strokeDashoffset: 25, animation: 'drawLine 0.6s ease-out 0.5s forwards' }} />
          <circle cx="68" cy="50" r="3" fill="currentColor" className="text-hairline" />
          <circle cx="78" cy="50" r="3" fill="currentColor" className="text-hairline" />
          <circle cx="88" cy="50" r="3" fill="currentColor" className="text-hairline" />
          <line x1="68" y1="65" x2="88" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" />
          <circle cx="60" cy="28" r="2" fill="currentColor" className="text-primary animate-pulse-dot" />
          <path d="M85 78L92 85L85 92" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'bell':
      return (
        <svg {...svgProps}>
          <path d="M60 20C50 20 42 30 42 44V52L35 65H85L78 52V44C78 30 70 20 60 20Z" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="35" y1="65" x2="85" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <path d="M60 65V72C60 76 64 80 68 80H74" stroke="currentColor" strokeWidth="1.5" className="text-muted/30" strokeLinecap="round" />
          <circle cx="60" cy="40" r="3" fill="currentColor" className="text-primary animate-pulse-dot" />
          <path d="M60 20V15" stroke="currentColor" strokeWidth="1.5" className="text-primary/40" strokeLinecap="round" />
          <path d="M48 22L42 18" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <path d="M72 22L78 18" stroke="currentColor" strokeWidth="1" className="text-muted/20" strokeLinecap="round" />
          <circle cx="86" cy="30" r="8" fill="currentColor" className="text-primary/10 animate-pulse-dot" />
          <circle cx="86" cy="30" r="3" fill="currentColor" className="text-primary" />
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <circle cx="60" cy="55" r="25" stroke="currentColor" strokeWidth="1.5" className="text-hairline" fill="currentColor" fillOpacity="0.03" />
          <path d="M75 75L95 95" stroke="currentColor" strokeWidth="2" className="text-muted" strokeLinecap="round" />
          <circle cx="60" cy="55" r="3" fill="currentColor" className="text-primary/30 animate-pulse-dot" />
        </svg>
      );
  }
}

export default function EmptyState({
  variant = 'inbox',
  title,
  message,
  action,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`text-center py-xl px-sm empty-state-root ${className}`}>
      <div className="flex flex-col items-center">
        <div className={`${compact ? 'w-[80px] h-[80px]' : 'w-[120px] h-[120px]'} flex items-center justify-center mx-auto mb-xs text-muted`}>
          <Illustration variant={variant} />
        </div>
        {title && (
          <h3 className="text-title-sm font-medium text-ink mb-[4px] empty-state-title">{title}</h3>
        )}
        {message && (
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto empty-state-message">{message}</p>
        )}
        {action && (
          <div className="mt-sm empty-state-action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
