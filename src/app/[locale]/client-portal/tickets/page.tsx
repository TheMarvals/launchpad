import React from 'react';
import { Link } from '@/i18n/routing';
import { getClientTickets } from '@/app/actions/tickets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function TicketsPage() {
  const tickets = await getClientTickets();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Abierto';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'CLOSED': return 'Cerrado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-gray-500';
      case 'MEDIUM': return 'text-blue-500';
      case 'HIGH': return 'text-orange-500';
      case 'URGENT': return 'text-red-600 font-bold';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Centro de Soporte</h1>
          <p className="text-gray-500 mt-1">Gestiona tus consultas y reportes técnicos</p>
        </div>
        <Link 
          href="/client-portal/tickets/new" 
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center shadow-sm"
        >
          <span className="material-icons text-[20px] mr-2">add</span>
          Nuevo Ticket
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-gray-300 text-4xl">support_agent</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tienes tickets abiertos</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Si tienes algún problema técnico o duda sobre tu servicio, no dudes en contactarnos.</p>
            <Link 
              href="/client-portal/tickets/new" 
              className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
            >
              Abrir mi primer ticket
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asunto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioridad</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Actualización</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link href={`/client-portal/tickets/${ticket.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </Link>
                        <span className="text-xs text-gray-400 font-mono mt-1">#{ticket.id.split('-')[0].toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="material-icons text-[16px] text-gray-400">flag</span>
                        <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(ticket.updatedAt), "d 'de' MMM, HH:mm", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/client-portal/tickets/${ticket.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-icons text-[20px]">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
