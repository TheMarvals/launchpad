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
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a041a] text-white hidden md:flex flex-col relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute -left-24 top-60 opacity-[0.05] pointer-events-none select-none">
          <h1 className="whitespace-nowrap font-black tracking-tighter transform -rotate-90" style={{ fontSize: '180px', WebkitTextFillColor: 'transparent', WebkitTextStrokeColor: '#ffffff', WebkitTextStrokeWidth: '2px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>MARVAL</h1>
        </div>

        <div className="p-8 relative z-10">
          <h1 className="text-2xl font-black tracking-tighter" style={{ WebkitTextStroke: '1px white', color: 'transparent' }}>MARVAL</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mt-2 text-blue-400 font-bold">Cloud Portal</p>
        </div>
        
        <nav className="flex-grow mt-8 relative z-10 px-4">
          <ul className="space-y-2">
            <li>
              <Link href="/client-portal" className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                <span className="material-icons mr-3 text-[18px] text-blue-400">dashboard</span> {t('dashboard')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/servers" className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                <span className="material-icons mr-3 text-[18px] text-blue-400">dns</span> {t('servers')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/quotes" className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                <span className="material-icons mr-3 text-[18px] text-blue-400">receipt_long</span> {t('quotes')}
              </Link>
            </li>
            <li>
              <Link href="/client-portal/tickets" className="flex items-center px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                <span className="material-icons mr-3 text-[18px] text-blue-400">support_agent</span> {t('tickets')}
              </Link>
            </li>
          </ul>
        </nav>


        <div className="px-6 py-4">
          <LocaleSwitcher />
        </div>

        <div className="p-6 relative z-10">
          <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/10">

            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold truncate">{session.user.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{session.user.email}</div>
              </div>
            </div>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
              <button title={t('logout')} className="text-gray-400 hover:text-red-400 transition-colors">
                <span className="material-icons text-[18px]">logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-screen overflow-y-auto">
        <header className="md:hidden h-16 bg-[#0a041a] text-white flex items-center justify-between px-6 shrink-0 relative z-50">
          <div className="flex items-center">
            <MobileClientNav />
            <h1 className="text-xl font-black tracking-tighter" style={{ WebkitTextStroke: '1px white', color: 'transparent' }}>MARVAL</h1>
          </div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
             <button className="text-gray-400 hover:text-white" title={t('logout')}><span className="material-icons">logout</span></button>
          </form>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
