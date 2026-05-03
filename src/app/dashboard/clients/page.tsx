import React from 'react';
import { prisma } from '@/lib/prisma';
import ClientManager from '@/components/ClientManager';

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { razonSocial: 'asc' },
    include: {
      _count: { select: { quotes: true } }
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 mt-1">Gestión de base de datos de clientes.</p>
      </div>

      <ClientManager clients={clients} />
    </div>
  );
}
