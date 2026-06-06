import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function ClientPortalDashboard() {
  const session = await auth();
  const clientId = (session?.user as any)?.clientId;
  const t = await getTranslations('ClientPortal');

  if (!clientId) return null;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      servers: true,
      _count: { select: { tickets: true } }
    }
  });

  if (!client) return null;

  const activeServers = client.servers.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-md">
      <div>
        <h1 className="text-display-md font-medium tracking-tight text-ink">{t('dashboard.title', { name: session?.user?.name?.split(' ')[0] || '' })}</h1>
        <p className="text-body text-muted mt-[4px]">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xs">
        {/* Servers Card */}
        <div className="bg-canvas-elevated border border-hairline p-sm flex flex-col">
          <div className="flex items-center justify-between mb-xs">
            <div className="w-[48px] h-[48px] bg-canvas flex items-center justify-center">
              <span className="material-icons text-primary">dns</span>
            </div>
            <span className="text-xl font-medium text-ink tracking-tight">{client.servers.length}</span>
          </div>
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('servers.title')}</h2>
          <p className="text-body text-muted text-sm mt-xxs flex-grow">{t('servers.description', { count: activeServers })}</p>
          <Link href="/client-portal/servers" className="mt-xs text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center uppercase tracking-wider">
            {t('servers.action')} <span className="material-icons text-sm ml-xxs">arrow_forward</span>
          </Link>
        </div>

        {/* Tickets Card */}
        <div className="bg-canvas-elevated border border-hairline p-sm flex flex-col">
          <div className="flex items-center justify-between mb-xs">
            <div className="w-[48px] h-[48px] bg-canvas flex items-center justify-center">
              <span className="material-icons text-primary">support_agent</span>
            </div>
            <span className="text-xl font-medium text-ink tracking-tight">{client._count.tickets}</span>
          </div>
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('tickets.title')}</h2>
          <p className="text-body text-muted text-sm mt-xxs flex-grow">{t('tickets.description')}</p>
          <Link href="/client-portal/tickets" className="mt-xs text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center uppercase tracking-wider">
            {t('tickets.action')} <span className="material-icons text-sm ml-xxs">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
