import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Link } from '@/i18n/routing';

export default async function ClientPortalDashboard() {
  const session = await auth();
  const clientId = (session?.user as any)?.clientId;

  if (!clientId) return null;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      servers: true,
      _count: { select: { quotes: true } }
    }
  });

  if (!client) return null;

  const activeServers = client.servers.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Hola, {session?.user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 mt-1">Bienvenido a tu panel de gestión en la nube de MARVAL.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Servers Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-icons">dns</span>
            </div>
            <span className="text-3xl font-black text-gray-900">{client.servers.length}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Servidores Cloud</h2>
          <p className="text-sm text-gray-500 mt-1 flex-grow">Tienes {activeServers} servidor(es) corriendo actualmente.</p>
          <Link href="/client-portal/servers" className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center">
            Administrar Servidores <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Link>
        </div>

        {/* Quotes Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-icons">receipt_long</span>
            </div>
            <span className="text-3xl font-black text-gray-900">{client._count.quotes}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Cotizaciones</h2>
          <p className="text-sm text-gray-500 mt-1 flex-grow">Revisa el historial de propuestas comerciales y facturación.</p>
          <Link href="/client-portal/quotes" className="mt-6 text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center">
            Ver Historial <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
