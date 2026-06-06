import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import LandingCta from '@/components/landing/LandingCta';
import LandingNav from '@/components/landing/LandingNav';
import ShowcaseCarousel from '@/components/landing/ShowcaseCarousel';
import ContactForm from '@/components/landing/ContactForm';

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
      {/* Top Navigation */}
      <LandingNav />

      {/* ============================== */}
      {/* Hero Section */}
      {/* ============================== */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-lg py-xl relative overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Soft top-right glow */}
          <div className="absolute -top-[300px] right-[-200px] w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,98,255,0.25) 0%, transparent 70%)' }} />
          {/* Soft bottom-left glow */}
          <div className="absolute -bottom-[200px] left-[-200px] w-[400px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,220,229,0.2) 0%, transparent 70%)' }} />
        </div>

        {/* Background watermark */}
        <div className="absolute -left-24 top-1/2 -translate-y-1/2 opacity-[0.015] pointer-events-none select-none hidden md:block z-0">
          <h1
            className="whitespace-nowrap font-black tracking-tighter transform -rotate-90"
            style={{
              fontSize: '280px',
              WebkitTextFillColor: 'transparent',
              WebkitTextStrokeColor: '#ffffff',
              WebkitTextStrokeWidth: '2px',
              fontFamily: "'Outfit', sans-serif",
              lineHeight: 1,
            }}
          >
            LAUNCHPAD
          </h1>
        </div>

        {/* Hero Content */}
        <div className="max-w-[900px] w-full text-center relative z-10">
          {/* Pre-title */}
          <p className="animate-fade-in animation-delay-1 text-[clamp(0.55rem,1vw,0.75rem)] uppercase tracking-[0.3em] text-primary-active font-semibold mb-sm">
            {t('tagline')}
          </p>

          {/* Brand - LAUNCHPAD stroke text */}
          <h1
            className="animate-fade-in-scale animation-delay-2 text-[clamp(3.5rem,12vw,8rem)] font-black tracking-tighter leading-none mb-sm select-none"
            style={{
              WebkitTextFillColor: 'transparent',
              WebkitTextStrokeColor: '#ffffff',
              WebkitTextStrokeWidth: '1.5px',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {t('brand')}
          </h1>

          {/* Main Headline */}
          <p
            className="animate-fade-in-up animation-delay-3 text-[clamp(1.1rem,2vw,1.5rem)] font-semibold tracking-tight mb-md text-ink/80"
            style={{
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {t('headline')}
          </p>

          {/* Subtitle */}
          <p className="animate-fade-in-up animation-delay-4 text-body text-muted/90 max-w-[620px] mx-auto leading-relaxed mb-xl text-sm md:text-base">
            {t('subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animation-delay-5 flex flex-col sm:flex-row items-center justify-center gap-xs">
            <LandingCta
              isAuthenticated={isAuthenticated}
              ctaLabel={t('cta')}
              scrollToId="contact"
              icon="calendar_today"
            />
            <a
              href="#expertise"
              className="flex items-center justify-center gap-xxs border border-hairline text-muted hover:text-ink hover:border-primary/30 px-lg h-[52px] rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
            >
              <span className="material-icons text-[16px] group-hover:-translate-x-0.5 transition-transform">explore</span>
              {t('ctaSecondary')}
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-lg left-1/2 -translate-x-1/2 flex flex-col items-center gap-xxs text-muted opacity-40">
          <span className="material-icons text-[18px] animate-bounce">expand_more</span>
        </div>
      </section>

      {/* ============================== */}
      {/* Expertise Section */}
      {/* ============================== */}
      <section id="expertise" className="px-lg py-xl md:py-xxl border-t border-hairline relative z-10">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,98,255,0.15) 0%, transparent 70%)' }} />

        <div className="max-w-[1100px] mx-auto relative">
          {/* Section header */}
          <div className="text-center mb-lg">
            <span className="text-[9px] uppercase tracking-[0.2em] text-primary-active font-semibold mb-sm block">
              {t('whatWeDo')}
            </span>
            <h2
              className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black tracking-tighter"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',fontFamily: "'Montserrat', sans-serif",
            }}
          >
              {t('squads')}
            </h2>
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-sm" style={{ width: 'clamp(60px, 8vw, 100px)' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
            {/* Design & Creative */}
            <div className="group relative bg-[#0d0d12] border border-hairline/60 hover:border-primary/30 p-lg md:p-xl transition-all duration-400 ease-out rounded-xl hover:-translate-y-1 transform-gpu">
              {/* Top accent line on hover */}
              <div className="absolute top-0 left-5 right-5 h-[1.5px] bg-gradient-to-r from-transparent via-primary-active to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="w-11 h-11 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center mb-sm group-hover:border-primary-active/30 group-hover:bg-primary/12 transition-all duration-300">
                <span className="material-icons text-primary-active text-[22px] group-hover:scale-110 transition-transform duration-300">palette</span>
              </div>
              <h3 className="text-base font-semibold text-ink mb-xxs">
                {t('design.title')}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary-active font-semibold mb-xs">
                {t('design.subtitle')}
              </p>
              <p className="text-body text-muted-soft leading-relaxed text-sm mb-sm">
                {t('design.description')}
              </p>
              <div className="flex flex-wrap gap-xxs pt-sm border-t border-hairline/20">
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">Branding</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">Video</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">UI/UX</span>
              </div>
            </div>

            {/* Engineering & Architecture */}
            <div className="group relative bg-[#0d0d12] border border-hairline/60 hover:border-primary/30 p-lg md:p-xl transition-all duration-400 ease-out rounded-xl hover:-translate-y-1 transform-gpu">
              <div className="absolute top-0 left-5 right-5 h-[1.5px] bg-gradient-to-r from-transparent via-primary-active to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="w-11 h-11 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center mb-sm group-hover:border-primary-active/30 group-hover:bg-primary/12 transition-all duration-300">
                <span className="material-icons text-primary-active text-[22px] group-hover:scale-110 transition-transform duration-300">code</span>
              </div>
              <h3 className="text-base font-semibold text-ink mb-xxs">
                {t('engineering.title')}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary-active font-semibold mb-xs">
                {t('engineering.subtitle')}
              </p>
              <p className="text-body text-muted-soft leading-relaxed text-sm mb-sm">
                {t('engineering.description')}
              </p>
              <div className="flex flex-wrap gap-xxs pt-sm border-t border-hairline/20">
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">Web Apps</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">Cloud</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">DevOps</span>
              </div>
            </div>

            {/* Digital Strategy & Growth */}
            <div className="group relative bg-[#0d0d12] border border-hairline/60 hover:border-primary/30 p-lg md:p-xl transition-all duration-400 ease-out rounded-xl hover:-translate-y-1 transform-gpu">
              <div className="absolute top-0 left-5 right-5 h-[1.5px] bg-gradient-to-r from-transparent via-primary-active to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="w-11 h-11 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center mb-sm group-hover:border-primary-active/30 group-hover:bg-primary/12 transition-all duration-300">
                <span className="material-icons text-primary-active text-[22px] group-hover:scale-110 transition-transform duration-300">trending_up</span>
              </div>
              <h3 className="text-base font-semibold text-ink mb-xxs">
                {t('growth.title')}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary-active font-semibold mb-xs">
                {t('growth.subtitle')}
              </p>
              <p className="text-body text-muted-soft leading-relaxed text-sm mb-sm">
                {t('growth.description')}
              </p>
              <div className="flex flex-wrap gap-xxs pt-sm border-t border-hairline/20">
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">Campaigns</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">Content</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-soft bg-muted/5 border border-hairline/20 px-2.5 py-1 rounded-full font-medium">Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      {showcaseProjects.length > 0 && (
        <ShowcaseCarousel projects={JSON.parse(JSON.stringify(showcaseProjects))} />
      )}

      {/* ============================== */}
      {/* Contact Section */}
      {/* ============================== */}
      <section id="contact" className="px-lg py-xl md:py-xxl border-t border-hairline relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,220,229,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,98,255,0.2) 0%, transparent 70%)' }} />

        <div className="max-w-[900px] mx-auto relative z-10">
          <div className="text-center mb-lg">
            <span className="text-[9px] uppercase tracking-[0.2em] text-primary-active font-semibold mb-sm block">
              {t('contactTag')}
            </span>
            <h2
              className="text-[clamp(1.5rem,3vw,2.5rem)] font-black tracking-tighter"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',fontFamily: "'Montserrat', sans-serif",
            }}
          >
              {t('contactTitle')}
            </h2>
            <p className="text-body text-muted-soft max-w-[500px] mx-auto text-sm mt-sm leading-relaxed">
              {t('contactDescription')}
            </p>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline px-lg py-sm">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-xs">
          <div className="flex items-center space-x-xxs">
            <h3
              className="text-lg font-black tracking-tighter"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitTextStrokeColor: '#ffffff',
                WebkitTextStrokeWidth: '1px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {t('brand')}
            </h3>
          </div>
          <p className="text-caption-uppercase text-muted tracking-[0.1em] text-xs">
            © {new Date().getFullYear()} {t('brand')}. by Masterminds
          </p>
        </div>
      </footer>
    </div>
  );
}
