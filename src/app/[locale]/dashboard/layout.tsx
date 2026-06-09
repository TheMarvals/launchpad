import React from 'react';
import { Link } from '@/i18n/routing';
import { auth, signOut } from '@/lib/auth';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PERMISSIONS } from '@/lib/permissions';
import { createPermissionChecker } from '@/lib/permissions-utils';
import { prisma } from '@/lib/prisma';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import DashboardMobileNav, { MobileNavTrigger } from '@/components/DashboardMobileNav';
import { MobileNavProvider } from '@/components/MobileNavProvider';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Navigation');
  const session = await auth();
  
  if (!session?.user) {
    redirect({ href: '/login', locale });
    return null; // Satisfy TypeScript
  }

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Fetch permissions directly from DB so changes take effect without re-login
  const dbUser = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { permissions: true },
  });
  // Unread contacts count for sidebar badge
  const unreadContacts = await prisma.contactSubmission.count({
    where: { read: false },
  });

  const can = createPermissionChecker(dbUser?.permissions as string[] | undefined);

  return (
    <MobileNavProvider>
    <div className="flex min-h-screen bg-canvas text-ink font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-canvas border-r border-hairline text-ink hidden md:flex flex-col">
        <div className="p-sm">
          <h1 className="text-2xl font-black tracking-tighter stroke-text">LAUNCHPAD</h1>
        </div>
        
        <nav className="flex-grow mt-xs">
          <ul className="space-y-[2px]">
            {can(PERMISSIONS.DASHBOARD) && (
              <li>
                <Link href="/dashboard" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">dashboard</span> {t('dashboard')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.QUOTES) && (
              <li>
                <Link href="/dashboard/quotes" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">description</span> {t('quotes')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.INVOICES) && (
              <li>
                <Link href="/dashboard/invoices" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">receipt_long</span> {t('invoices')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.CLIENTS) && (
              <li>
                <Link href="/dashboard/clients" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">people</span> {t('clients')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.SHOWCASE) && (
              <li>
                <Link href="/dashboard/showcase" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">collections_bookmark</span> {t('showcase')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.PRODUCTS) && (
              <li>
                <Link href="/dashboard/products" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">inventory_2</span> {t('products')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.TICKETS) && (
              <li>
                <Link href="/dashboard/tickets" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">support_agent</span> {t('tickets')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.LOGS) && (
              <li>
                <Link href="/dashboard/logs" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">policy</span> {t('audit')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.CONTACTS) && (
              <li>
                <Link href="/dashboard/contacts" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">mail</span> {t('contacts')}
                  {unreadContacts > 0 && (
                    <span className="ml-auto bg-primary text-on-primary text-[9px] font-bold px-[5px] py-[1px] leading-none">
                      {unreadContacts > 99 ? '99+' : unreadContacts}
                    </span>
                  )}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.SETTINGS) && (
              <li>
                <Link href="/dashboard/settings" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">settings</span> {t('settings')}
                </Link>
              </li>
            )}

            <div className="px-sm py-xxs mt-xxs">
              <p className="text-caption-uppercase tracking-widest text-muted font-bold">{t('productivity')}</p>
            </div>
            {can(PERMISSIONS.PROJECTS) && (
              <li>
                <Link href="/dashboard/productivity/projects" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">folder</span> {t('projects')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.TASKS) && (
              <li>
                <Link href="/dashboard/productivity/tasks" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">task_alt</span> {t('tasks')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.NOTES) && (
              <li>
                <Link href="/dashboard/productivity/notes" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">note_alt</span> {t('notes')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.CALENDAR) && (
              <li>
                <Link href="/dashboard/productivity/calendar" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">calendar_month</span> {t('calendar')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.REMINDERS) && (
              <li>
                <Link href="/dashboard/productivity/reminders" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">notifications_active</span> {t('reminders')}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="p-sm border-t border-hairline text-caption-uppercase text-muted text-center tracking-[0.1em]">
          © 2026 Launchpad
        </div>
      </aside>

      {/* Mobile Navigation - drawer panel */}
      <DashboardMobileNav>
        <nav className="flex-grow mt-xs">
          <ul className="space-y-[2px]">
            {can(PERMISSIONS.DASHBOARD) && (
              <li>
                <Link href="/dashboard" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">dashboard</span> {t('dashboard')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.QUOTES) && (
              <li>
                <Link href="/dashboard/quotes" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">description</span> {t('quotes')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.INVOICES) && (
              <li>
                <Link href="/dashboard/invoices" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">receipt_long</span> {t('invoices')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.CLIENTS) && (
              <li>
                <Link href="/dashboard/clients" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">people</span> {t('clients')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.SHOWCASE) && (
              <li>
                <Link href="/dashboard/showcase" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">collections_bookmark</span> {t('showcase')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.PRODUCTS) && (
              <li>
                <Link href="/dashboard/products" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">inventory_2</span> {t('products')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.TICKETS) && (
              <li>
                <Link href="/dashboard/tickets" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">support_agent</span> {t('tickets')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.LOGS) && (
              <li>
                <Link href="/dashboard/logs" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">policy</span> {t('audit')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.CONTACTS) && (
              <li>
                <Link href="/dashboard/contacts" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">mail</span> {t('contacts')}
                  {unreadContacts > 0 && (
                    <span className="ml-auto bg-primary text-on-primary text-[9px] font-bold px-[5px] py-[1px] leading-none">
                      {unreadContacts > 99 ? '99+' : unreadContacts}
                    </span>
                  )}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.SETTINGS) && (
              <li>
                <Link href="/dashboard/settings" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">settings</span> {t('settings')}
                </Link>
              </li>
            )}

            <div className="px-sm py-xxs mt-xxs">
              <p className="text-caption-uppercase tracking-widest text-muted font-bold">{t('productivity')}</p>
            </div>
            {can(PERMISSIONS.PROJECTS) && (
              <li>
                <Link href="/dashboard/productivity/projects" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">folder</span> {t('projects')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.TASKS) && (
              <li>
                <Link href="/dashboard/productivity/tasks" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">task_alt</span> {t('tasks')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.NOTES) && (
              <li>
                <Link href="/dashboard/productivity/notes" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">note_alt</span> {t('notes')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.CALENDAR) && (
              <li>
                <Link href="/dashboard/productivity/calendar" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">calendar_month</span> {t('calendar')}
                </Link>
              </li>
            )}
            {can(PERMISSIONS.REMINDERS) && (
              <li>
                <Link href="/dashboard/productivity/reminders" className="h-[48px] flex items-center px-sm hover:bg-canvas-elevated text-xs font-semibold uppercase tracking-[0.65px] transition-colors rounded-sm text-body hover:text-ink">
                  <span className="material-icons mr-xxs text-sm opacity-70">notifications_active</span> {t('reminders')}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </DashboardMobileNav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden bg-canvas">
        <header className="h-16 bg-canvas border-b border-hairline flex items-center justify-between px-sm md:px-lg shrink-0">
          <div className="flex items-center">
            <MobileNavTrigger />
            <h2 className="text-title-md font-medium text-ink hidden sm:block">{t('dashboard')}</h2>
          </div>
          <div className="flex items-center space-x-sm">
            <LocaleSwitcher />
            <div className="flex items-center space-x-xxs">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-ink">{session.user.name}</div>
                <div className="text-caption text-muted">{session.user.email}</div>
              </div>

              <div className="w-[32px] h-[32px] rounded-full bg-canvas-elevated border border-hairline flex items-center justify-center text-ink font-bold text-xs select-none">
                {initials}
              </div>
            </div>
            
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="text-muted hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                title={t('logout')}
              >
                <span className="material-icons text-[20px]">logout</span>
              </button>
            </form>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto px-sm py-md md:p-lg">
          {children}
        </div>
      </main>
    </div>
    </MobileNavProvider>
  );
}
