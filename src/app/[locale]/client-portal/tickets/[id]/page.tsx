import React from 'react';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTicketDetails } from '@/app/actions/tickets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TicketReplyForm from './TicketReplyForm';
import TicketStatusManager from './TicketStatusManager';

export default async function TicketDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const ticket = await getTicketDetails(id);

  if (!ticket) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-sm font-semibold">Abierto</span>;
      case 'IN_PROGRESS': return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-sm font-semibold">En Progreso</span>;
      case 'CLOSED': return <span className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full text-sm font-semibold">Cerrado</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW': return <span className="text-gray-500 font-medium text-sm flex items-center"><span className="material-icons text-[16px] mr-1">flag</span> Baja</span>;
      case 'MEDIUM': return <span className="text-blue-500 font-medium text-sm flex items-center"><span className="material-icons text-[16px] mr-1">flag</span> Media</span>;
      case 'HIGH': return <span className="text-orange-500 font-medium text-sm flex items-center"><span className="material-icons text-[16px] mr-1">flag</span> Alta</span>;
      case 'URGENT': return <span className="text-red-600 font-bold text-sm flex items-center"><span className="material-icons text-[16px] mr-1">flag</span> Urgente</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Link href="/client-portal/tickets" className="text-gray-400 hover:text-gray-900 transition-colors">
                <span className="material-icons text-[24px]">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            </div>
            <p className="text-gray-500 text-sm font-mono ml-9">Ticket #{ticket.id}</p>
          </div>
          
          <div className="flex items-center space-x-3 ml-9 md:ml-0">
            {getPriorityBadge(ticket.priority)}
            <span className="w-px h-4 bg-gray-200"></span>
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 ml-9 text-sm text-gray-500 border-t border-gray-100 pt-6">
          <div className="flex items-center">
            <span className="material-icons text-[18px] mr-2 text-gray-400">calendar_today</span>
            Creado el {format(new Date(ticket.createdAt), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
          </div>
          <div className="flex items-center">
            <span className="material-icons text-[18px] mr-2 text-gray-400">update</span>
            Última actividad: {format(new Date(ticket.updatedAt), "HH:mm", { locale: es })}
          </div>
          
          {ticket.status !== 'CLOSED' && (
            <div className="ml-auto">
               <TicketStatusManager ticketId={ticket.id} currentStatus={ticket.status} role="CLIENT" />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-6">
        {ticket.messages.map((msg, index) => {
          const isAdmin = msg.user.role === 'ADMIN';
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-6 ${isAdmin ? 'bg-white border border-gray-100 shadow-sm' : 'bg-gray-900 text-white shadow-md'}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-white/10 text-white'}`}>
                    {msg.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isAdmin ? 'text-gray-900' : 'text-white'}`}>
                      {isAdmin ? 'Soporte MARVAL' : 'Tú'}
                    </p>
                    <p className={`text-xs ${isAdmin ? 'text-gray-500' : 'text-gray-400'}`}>
                      {format(new Date(msg.createdAt), "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isAdmin ? 'text-gray-700' : 'text-gray-200'}`}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Form */}
      {ticket.status !== 'CLOSED' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="material-icons mr-2 text-gray-400">reply</span>
            Escribir Respuesta
          </h3>
          <TicketReplyForm ticketId={ticket.id} />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center mt-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-gray-400 text-3xl">lock</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Ticket Cerrado</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">Este ticket ha sido marcado como resuelto. Si el problema persiste o tienes una nueva consulta, por favor responde a este mensaje para reabrirlo.</p>
          <TicketReplyForm ticketId={ticket.id} buttonText="Reabrir Ticket con Respuesta" />
        </div>
      )}
    </div>
  );
}
