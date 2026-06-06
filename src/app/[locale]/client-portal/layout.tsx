import React from 'react';
import { Link } from '@/i18n/routing';
import { auth, signOut } from '@/lib/auth';
import { redirect } from '@/i18n/routing';
import { MobileClientNav } from '@/components/MobileClientNav';
import { getTranslations } from 'next-intl/server';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default async function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Navigation');
  const session = await auth();
  
  if (!session?.user || (session.user as any).role !== 'CLIENT') {
    redirect({ href: '/login', locale });
    return null; // Satisfy TypeScript
  }

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'C';

  return (
    <div className="flex min-h-screen bg-canvas text-ink font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-canvas border-r border-hairline text-ink hidden md:flex flex-col">
        <div className="p-sm">
          <h1 className="text-2xl font-black tracking-tighter stroke-text">LAUNCHPAD</h1>
        </div>
        
        <nav className="flex-grow mt-xs">
          <ul className="space-y-[2px]">
            <li>
              <Link href="/client-portal" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">dashboard</span> {t('dashboard')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/servers" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">dns</span> {t('servers')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/quotes" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">receipt_long</span> {t('quotes')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/tickets" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                <span className="material-icons mr-xxs text-sm opacity-70">support_agent</span> {t('tickets')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-sm border-t border-hairline">
          <LocaleSwitcher />
        </div>

        <div className="p-sm border-t border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-xxs overflow-hidden">
            <div className="w-[32px] h-[32px] rounded-full bg-canvas-elevated border border-hairline flex items-center justify-center text-ink font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <div className="text-sm font-medium truncate text-ink">{session.user.name}</div>
              <div className="text-caption text-muted truncate">{session.user.email}</div>
            </div>
          </div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button title={t('logout')} className="text-muted hover:text-primary transition-colors cursor-pointer">
              <span className="material-icons text-[18px]">logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden bg-canvas">
        <header className="md:hidden h-16 bg-canvas border-b border-hairline flex items-center justify-between px-sm shrink-0 z-50">
          <div className="flex items-center">
            <MobileClientNav />
            <h1 className="text-2xl font-black tracking-tighter stroke-text">LAUNCHPAD</h1>
          </div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
             <button className="text-muted hover:text-primary transition-colors cursor-pointer" title={t('logout')}><span className="material-icons">logout</span></button>
          </form>
        </header>

        <div className="flex-grow overflow-y-auto p-lg">
          <div className="max-w-6xl w-full mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
