import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { PortalManagerButtons } from '@/components/PortalManager';
import UserAccessToggle from '@/components/UserAccessToggle';
import VpsEditModal from '@/components/VpsEditModal';
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

          {client.users.length > 0 ? (
            <ul className="space-y-xs">
              {client.users.map(user => (
                <li key={user.id} className="flex justify-between items-center py-xs border-b border-hairline last:border-0">
                  <div>
                    <div className="font-medium text-sm text-ink">{user.name}</div>
                    <div className="text-xs text-muted mt-xxs">{user.email}</div>
                  </div>
                  <UserAccessToggle user={user} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-xl text-muted">
              <p className="text-sm">{t('noUsers')}</p>
            </div>
          )}
        </div>

        {/* Servers Section */}
        <div className="bg-canvas-elevated border border-hairline p-sm">
          <div className="flex justify-between items-center pb-xs border-b border-hairline">
            <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
              <span className="material-icons mr-xxs text-primary">dns</span> {t('servers')}
            </h2>
          </div>

          {client.servers.length > 0 ? (
            <ul className="space-y-xs">
              {client.servers.map(server => (
                <li key={server.id} className="flex justify-between items-center py-xs border-b border-hairline last:border-0">
                  <div>
                    <div className="font-medium text-sm text-ink flex items-center">
                      {server.name}
                      <span className={`ml-sm text-[10px] font-bold uppercase tracking-wider px-xxs py-[2px] rounded-full ${server.status === 'active' ? 'bg-semantic-info/15 text-semantic-info' : 'bg-semantic-danger/15 text-semantic-danger'}`}>
                        {server.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-xxs">IP: {server.ipAddress || 'No asignada'} • ID: {server.providerId}</div>
                    {server.dueDate && (
                      <div className="text-xs text-muted mt-[2px]">
                        <span className="font-semibold text-ink">Vencimiento:</span> {new Date(server.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <VpsEditModal server={server} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-xl text-muted">
              <p className="text-sm">{t('noServers')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
