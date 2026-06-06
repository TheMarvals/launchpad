import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { PortalManagerButtons } from '@/components/PortalManager';
import PortalUsersList from '@/components/PortalUsersList';
import PortalServersList from '@/components/PortalServersList';
import { getTranslations } from 'next-intl/server';

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('ClientDetails');

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      users: true,
      servers: true,
    }
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-sm">
        <div>
          <Link href="/dashboard/clients" className="text-muted hover:text-ink text-[10px] font-bold uppercase tracking-widest flex items-center mb-xs transition-colors">
            <span className="material-icons text-[14px] mr-xxs">arrow_back</span> {t('back')}
          </Link>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{client.razonSocial}</h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
        </div>
        <PortalManagerButtons clientId={client.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-sm">
        {/* Users Section */}
        <div className="bg-canvas-elevated border border-hairline p-sm">
          <div className="flex justify-between items-center pb-xs border-b border-hairline">
            <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
              <span className="material-icons mr-xxs text-primary">people</span> {t('users')}
            </h2>
          </div>

          <PortalUsersList users={client.users} clientId={client.id} />
        </div>

        {/* Servers Section */}
        <div className="bg-canvas-elevated border border-hairline p-sm">
          <div className="flex justify-between items-center pb-xs border-b border-hairline">
            <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
              <span className="material-icons mr-xxs text-primary">dns</span> {t('servers')}
            </h2>
          </div>

          <PortalServersList servers={client.servers} />
        </div>
      </div>
    </div>
  );
}
