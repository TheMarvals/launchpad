import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PortalManagerButtons } from '@/components/PortalManager';
import UserAccessToggle from '@/components/UserAccessToggle';
import VpsEditModal from '@/components/VpsEditModal';

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/dashboard/clients" className="text-blue-600 hover:underline text-sm font-bold flex items-center mb-4">
            <span className="material-icons text-sm mr-1">arrow_back</span> Volver a Clientes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{client.razonSocial}</h1>
          <p className="text-gray-500 mt-1">Gestión de Accesos al Portal y Servidores Cloud</p>
        </div>
        <PortalManagerButtons clientId={client.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="material-icons mr-2 text-blue-600">people</span> Usuarios del Portal
            </h2>
          </div>

          {client.users.length > 0 ? (
            <ul className="space-y-3">
              {client.users.map(user => (
                <li key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <UserAccessToggle user={user} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Este cliente no tiene accesos al portal.</p>
            </div>
          )}
        </div>

        {/* Servers Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="material-icons mr-2 text-blue-600">dns</span> Servidores VPS
            </h2>
          </div>

          {client.servers.length > 0 ? (
            <ul className="space-y-3">
              {client.servers.map(server => (
                <li key={server.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <div className="font-bold text-sm text-gray-800 flex items-center">
                      {server.name}
                      <span className={`ml-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${server.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {server.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">IP: {server.ipAddress || 'No asignada'} • ID: {server.providerId}</div>
                    {server.dueDate && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        <span className="font-semibold">Vencimiento:</span> {new Date(server.dueDate).toLocaleDateString('es-CL')}
                      </div>
                    )}
                  </div>
                  <VpsEditModal server={server} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No hay servidores vinculados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
