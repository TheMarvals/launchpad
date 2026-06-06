'use client';

import { Link } from '@/i18n/routing';

interface LandingCtaProps {
  isAuthenticated: boolean;
  ctaLabel: string;
  variant?: 'white' | 'dark' | 'blurple' | 'navbar' | 'purple';
  icon?: string;
  className?: string;
  /** If provided, clicking the button scrolls to the element with this ID */
  scrollToId?: string;
  /** If provided, renders as a Link to this href */
  href?: string;
}

export default function LandingCta({
  isAuthenticated,
  ctaLabel,
  variant = 'blurple',
  icon,
  className = '',
  scrollToId,
  href,
}: LandingCtaProps) {
  // Styling based on variant
  const getButtonStyles = () => {
    const base = "flex items-center justify-center transition-all duration-300 font-bold tracking-[0.2em] cursor-pointer text-center select-none ";

    switch (variant) {
      case 'white':
        return base + "bg-white hover:bg-slate-100 text-[#131314] px-lg h-[52px] rounded-sm text-xs uppercase hover:-translate-y-0.5 shadow-small hover:shadow-medium";
      case 'dark':
        return base + "bg-transparent hover:bg-surface-card-hover text-ink border border-hairline px-lg h-[52px] rounded-sm text-xs uppercase hover:-translate-y-0.5";
      case 'navbar':
        return base + "bg-primary text-white hover:bg-primary-hover px-[16px] h-[38px] rounded-sm text-xs uppercase tracking-[0.1em] shadow-[0_0_16px_rgba(168,85,247,0.3)] hover:shadow-[0_0_24px_rgba(168,85,247,0.5)]";
      case 'purple':
        return base + "bg-primary hover:bg-primary-hover text-white px-lg h-[52px] rounded-sm text-xs uppercase hover:-translate-y-0.5 shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]";
      case 'blurple':
      default:
        return base + "bg-primary hover:bg-primary-hover text-white px-lg h-[52px] rounded-sm text-xs uppercase border border-primary/20 hover:-translate-y-0.5 shadow-[0_0_12px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] active:bg-primary-hover transition-all duration-300";
    }
  };

  const handleScroll = (e: React.MouseEvent) => {
    if (scrollToId) {
      e.preventDefault();
      const el = document.getElementById(scrollToId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // If authenticated and no custom behavior, link to dashboard
  if (isAuthenticated && !scrollToId && !href) {
    return (
      <Link
        href="/dashboard"
        className={`${getButtonStyles()} ${className}`}
      >
        {icon && <span className="material-icons mr-xxs text-[18px]">{icon}</span>}
        {ctaLabel}
      </Link>
    );
  }

  // Scroll-to-section mode
  if (scrollToId) {
    return (
      <button
        onClick={handleScroll}
        className={`${getButtonStyles()} ${className}`}
      >
        {icon && <span className="material-icons mr-xxs text-[18px]">{icon}</span>}
        {ctaLabel}
      </button>
    );
  }

  // Custom href link
  if (href) {
    return (
      <Link
        href={href}
        className={`${getButtonStyles()} ${className}`}
      >
        {icon && <span className="material-icons mr-xxs text-[18px]">{icon}</span>}
        {ctaLabel}
      </Link>
    );
  }

  // Fallback: plain button
  return (
    <button className={`${getButtonStyles()} ${className}`}>
      {icon && <span className="material-icons mr-xxs text-[18px]">{icon}</span>}
      {ctaLabel}
    </button>
  );
}
