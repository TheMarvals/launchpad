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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <ClientManager clients={clients} />
    </div>
  );
}
