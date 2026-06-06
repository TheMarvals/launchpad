import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import LandingCta from '@/components/landing/LandingCta';
import ShowcaseCarousel from '@/components/landing/ShowcaseCarousel';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getTranslations('Landing');
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const showcaseProjects = await prisma.showcaseProject.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      images: { orderBy: { order: 'asc' } },
    },
  });

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center px-lg py-xl relative overflow-hidden">
        {/* Background watermark */}
        <div className="absolute -left-24 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none hidden md:block">
          <h1
            className="whitespace-nowrap font-black tracking-tighter transform -rotate-90"
            style={{
              fontSize: '280px',
              WebkitTextFillColor: 'transparent',
              WebkitTextStrokeColor: '#ffffff',
              WebkitTextStrokeWidth: '2px',
              fontFamily: 'Outfit, sans-serif',
              lineHeight: 1,
            }}
          >
            LAUNCHPAD
          </h1>
        </div>
        <div className="max-w-[1000px] w-full text-center">
          {/* Brand */}
          <h1
            className="text-[clamp(3rem,10vw,7rem)] font-black tracking-tighter leading-none mb-lg select-none"
            style={{
              WebkitTextFillColor: 'transparent',
              WebkitTextStrokeColor: '#ffffff',
              WebkitTextStrokeWidth: '1.5px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {t('brand')}
          </h1>

          {/* Tagline */}
          <p className="text-[clamp(0.65rem,1.2vw,0.85rem)] uppercase tracking-[0.3em] text-primary font-bold mb-md">
            {t('tagline')}
          </p>

          {/* Description */}
          <p className="text-body text-muted max-w-[600px] mx-auto leading-relaxed mb-xl text-sm md:text-base">
            {t('description')}
          </p>

          {/* CTA Buttons */}
          <LandingCta
            isAuthenticated={isAuthenticated}
            ctaLabel={t('cta')}
          />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-lg left-1/2 -translate-x-1/2 flex flex-col items-center gap-xxs animate-bounce">
          <span className="material-icons text-muted text-[20px]">expand_more</span>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="px-lg py-xl md:py-xxl border-t border-hairline">
        <div className="max-w-[1100px] mx-auto">
          <h2
            className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tighter text-center mb-lg uppercase"
            style={{
              WebkitTextFillColor: 'transparent',
              WebkitTextStrokeColor: '#ffffff',
              WebkitTextStrokeWidth: '1px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {t('squads')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-xs">
            {/* Design & Creative */}
            <div className="bg-canvas-elevated border border-hairline p-lg md:p-xl group hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
              {/* Hover accent line */}
              <div className="absolute top-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-500" />
              <div className="w-[56px] h-[56px] rounded-none bg-primary/10 flex items-center justify-center mb-sm group-hover:bg-primary/20 transition-all">
                <span className="material-icons text-primary text-[28px]">palette</span>
              </div>
              <h3 className="text-title-sm md:text-title-md font-medium text-ink uppercase tracking-wider mb-xxs">
                {t('design.title')}
              </h3>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-primary font-bold mb-xs">
                {t('design.subtitle')}
              </p>
              <p className="text-body text-muted leading-relaxed text-sm">
                {t('design.description')}
              </p>
              {/* Tags */}
              <div className="flex flex-wrap gap-xxs mt-sm pt-sm border-t border-hairline/50">
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">Branding</span>
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">Video</span>
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">UI/UX</span>
              </div>
            </div>

            {/* Engineering & Architecture */}
            <div className="bg-canvas-elevated border border-hairline p-lg md:p-xl group hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-500" />
              <div className="w-[56px] h-[56px] rounded-none bg-primary/10 flex items-center justify-center mb-sm group-hover:bg-primary/20 transition-all">
                <span className="material-icons text-primary text-[28px]">code</span>
              </div>
              <h3 className="text-title-sm md:text-title-md font-medium text-ink uppercase tracking-wider mb-xxs">
                {t('engineering.title')}
              </h3>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-primary font-bold mb-xs">
                {t('engineering.subtitle')}
              </p>
              <p className="text-body text-muted leading-relaxed text-sm">
                {t('engineering.description')}
              </p>
              <div className="flex flex-wrap gap-xxs mt-sm pt-sm border-t border-hairline/50">
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">Web Apps</span>
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">Cloud</span>
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">DevOps</span>
              </div>
            </div>

            {/* Digital Strategy & Growth */}
            <div className="bg-canvas-elevated border border-hairline p-lg md:p-xl group hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-500" />
              <div className="w-[56px] h-[56px] rounded-none bg-primary/10 flex items-center justify-center mb-sm group-hover:bg-primary/20 transition-all">
                <span className="material-icons text-primary text-[28px]">trending_up</span>
              </div>
              <h3 className="text-title-sm md:text-title-md font-medium text-ink uppercase tracking-wider mb-xxs">
                {t('growth.title')}
              </h3>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-primary font-bold mb-xs">
                {t('growth.subtitle')}
              </p>
              <p className="text-body text-muted leading-relaxed text-sm">
                {t('growth.description')}
              </p>
              <div className="flex flex-wrap gap-xxs mt-sm pt-sm border-t border-hairline/50">
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">Campaigns</span>
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">Content</span>
                <span className="text-[9px] uppercase tracking-widest text-muted bg-canvas px-xxs py-[2px]">Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      {showcaseProjects.length > 0 && (
        <ShowcaseCarousel projects={JSON.parse(JSON.stringify(showcaseProjects))} />
      )}

      {/* Footer */}
      <footer className="border-t border-hairline px-lg py-sm">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row items-center justify-between gap-xs">
          <div className="flex items-center space-x-xxs">
            <h3
              className="text-lg font-black tracking-tighter"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {t('brand')}
            </h3>
            <span className="text-caption-uppercase text-muted hidden sm:inline">· Cloud Portal</span>
          </div>
          <p className="text-caption-uppercase text-muted tracking-[0.1em] text-xs">
            © {new Date().getFullYear()} {t('brand')}. {t('footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}
