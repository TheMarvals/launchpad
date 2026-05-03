import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import ServerCard from '@/components/ServerCard';

export default async function ClientServersPage() {
  const session = await auth();
  const clientId = (session?.user as any)?.clientId;

  if (!clientId) return null;

  const servers = await prisma.vpsService.findMany({
    where: { clientId }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Mis Servidores</h1>
        <p className="text-gray-500 mt-1">Gestión de infraestructura Cloud administrada.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}

        {servers.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            <span className="material-icons text-5xl mb-4 opacity-20">cloud_off</span>
            <p>No tienes servidores vinculados a tu cuenta actualmente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
