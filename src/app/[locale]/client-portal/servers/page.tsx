import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import ServerCard from '@/components/ServerCard';

export default async function ClientServersPage() {
  const session = await auth();
  const clientId = (session?.user as any)?.clientId;
  const t = await getTranslations('ClientPortal');

  if (!clientId) return null;

  const servers = await prisma.vpsService.findMany({
    where: { clientId }
  });

  return (
    <div className="space-y-md">
      <div>
        <h1 className="text-title-md font-medium text-ink tracking-tight">{t('servers.pageTitle')}</h1>
        <p className="text-body text-muted mt-[2px]">{t('servers.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xs">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}

        {servers.length === 0 && (
          <div className="col-span-full bg-canvas-elevated border border-dashed border-hairline p-lg text-center text-muted">
            <span className="material-icons text-5xl mb-xs opacity-20">cloud_off</span>
            <p className="text-body">{t('servers.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
