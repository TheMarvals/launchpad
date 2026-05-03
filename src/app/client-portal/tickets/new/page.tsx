'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket } from '@/app/actions/tickets';
import Link from 'next/link';

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const priority = formData.get('priority') as string;
    const message = formData.get('message') as string;

    const res = await createTicket({ subject, priority, message });

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push(`/client-portal/tickets/${res.ticketId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/client-portal/tickets" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm">
          <span className="material-icons">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Crear Nuevo Ticket</h1>
          <p className="text-gray-500 text-sm mt-1">Describe tu problema detalladamente para que podamos ayudarte mejor.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start">
              <span className="material-icons mr-2 text-[20px]">error_outline</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">
                  Asunto del Ticket <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  placeholder="Ej: Problemas de conexión con el VPS, Duda sobre facturación..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700">
                  Nivel de Prioridad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    name="priority"
                    required
                    defaultValue="MEDIUM"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option value="LOW">Baja - Consulta general</option>
                    <option value="MEDIUM">Media - Problema no crítico</option>
                    <option value="HIGH">Alta - Servicio degradado</option>
                    <option value="URGENT">Urgente - Servicio totalmente caído</option>
                  </select>
                  <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-6">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                Descripción del Problema <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Por favor, incluye toda la información relevante (errores exactos, pasos para reproducirlo, IPs involucradas).</p>
              <textarea
                id="message"
                name="message"
                required
                rows={8}
                placeholder="Describe tu problema aquí..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none resize-y"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[200px]"
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin mr-2 text-[20px]">sync</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2 text-[20px]">send</span>
                    Crear Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
