import React from 'react';
import Link from 'next/link';
import { getAllTickets } from '@/app/actions/tickets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function AdminTicketsPage() {
  const tickets = await getAllTickets();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800 border-red-200'; // Admin needs to see OPEN as urgent/red
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Pendiente (Nuevo)';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'CLOSED': return 'Resuelto';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandeja de Soporte</h1>
          <p className="text-gray-500">Gestiona los tickets de soporte de todos tus clientes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-icons text-gray-300 text-5xl mb-3">inbox</span>
            <h3 className="text-lg font-medium text-gray-900">Bandeja Vacía</h3>
            <p className="text-gray-500">No hay tickets de soporte registrados.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actualizado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{ticket.client.razonSocial}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {ticket.subject}
                      </Link>
                      <span className="text-xs text-gray-500 mt-1">ID: {ticket.id.split('-')[0]} • Prioridad: {ticket.priority}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(ticket.updatedAt), "d 'de' MMM, HH:mm", { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md">
                      Ver/Responder
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
