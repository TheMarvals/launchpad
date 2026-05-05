import React from 'react';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTicketDetails } from '@/app/actions/tickets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TicketReplyForm from '@/app/[locale]/client-portal/tickets/[id]/TicketReplyForm';
import AdminTicketStatus from './AdminTicketStatus';

export default async function AdminTicketDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const ticket = await getTicketDetails(id);

  if (!ticket) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-sm font-semibold">Pendiente</span>;
      case 'IN_PROGRESS': return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-sm font-semibold">En Progreso</span>;
      case 'CLOSED': return <span className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full text-sm font-semibold">Resuelto</span>;
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
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Link href="/dashboard/tickets" className="text-gray-400 hover:text-gray-900 transition-colors">
                <span className="material-icons text-[24px]">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            </div>
            <div className="ml-9 text-sm text-gray-500">
              <span>Cliente: <strong className="text-gray-900">{ticket.client.razonSocial}</strong></span>
              <span className="mx-2">•</span>
              <span className="font-mono text-xs">ID: {ticket.id}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-9 md:ml-0">
            {getPriorityBadge(ticket.priority)}
            <span className="w-px h-4 bg-gray-200"></span>
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 ml-9 text-sm text-gray-500 border-t border-gray-100 pt-4">
          <div className="flex items-center">
            <span className="material-icons text-[18px] mr-2 text-gray-400">calendar_today</span>
            Creado el {format(new Date(ticket.createdAt), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
          </div>
          <div className="flex items-center">
            <span className="material-icons text-[18px] mr-2 text-gray-400">update</span>
            Última actividad: {format(new Date(ticket.updatedAt), "HH:mm", { locale: es })}
          </div>
          
          <div className="ml-auto">
            <AdminTicketStatus ticketId={ticket.id} currentStatus={ticket.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Historial del Ticket</h2>
            
            <div className="space-y-6">
              {ticket.messages.map((msg, index) => {
                const isAdmin = msg.user.role === 'ADMIN';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-5 ${isAdmin ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                          {msg.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isAdmin ? 'text-blue-900' : 'text-gray-900'}`}>
                            {msg.user.name} {isAdmin && <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">Staff</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(msg.createdAt), "d MMM, yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reply Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="material-icons mr-2 text-gray-400">reply</span>
              Responder al Cliente
            </h3>
            <TicketReplyForm ticketId={ticket.id} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Información del Cliente</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-gray-500 mb-1">Razón Social</span>
                <span className="block text-sm font-medium text-gray-900">{ticket.client.razonSocial}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">RUT</span>
                <span className="block text-sm font-medium text-gray-900">{ticket.client.rut}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Email Principal</span>
                <span className="block text-sm font-medium text-blue-600">{ticket.client.email || 'No registrado'}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <Link href={`/dashboard/clients/${ticket.clientId}`} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center">
                  Ver perfil completo del cliente
                  <span className="material-icons text-[16px] ml-1">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
