import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export default async function ClientQuotesPage() {
  const session = await auth();
  const clientId = (session?.user as any)?.clientId;

  if (!clientId) return null;

  const quotes = await prisma.quote.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Mis Cotizaciones</h1>
        <p className="text-gray-500 mt-1">Historial comercial y propuestas técnicas aprobadas.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {quotes.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b bg-gray-50">
                <th className="px-6 py-4">Nº</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Monto Neto</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotes.map((quote) => (
                <tr key={quote.id} className="text-sm hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-700">COT-{quote.correlativo.toString().padStart(4, '0')}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(quote.fechaEmision).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      quote.estado === 'Aceptada' ? 'bg-green-100 text-green-700' :
                      quote.estado === 'Rechazada' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {quote.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-gray-700">
                    ${quote.montoNeto.toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={`/api/quotes/${quote.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      <span className="material-icons text-[16px] mr-1">picture_as_pdf</span> PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <span className="material-icons text-5xl mb-4 block opacity-30">receipt_long</span>
            No hay cotizaciones registradas aún.
          </div>
        )}
      </div>
    </div>
  );
}
