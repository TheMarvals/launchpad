import React from 'react';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import ClientManager from '@/components/ClientManager';

export default async function ClientsPage() {
  const t = await getTranslations('Clients');
  const clients = await prisma.client.findMany({
    orderBy: { razonSocial: 'asc' },
    include: {
      _count: { select: { quotes: true } }
    }
  });

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
        </div>
      </div>

      <ClientManager clients={clients} />
    </div>
  );
}
