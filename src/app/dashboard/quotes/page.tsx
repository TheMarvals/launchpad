import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import QuoteActions from '@/components/QuoteActions';

const ITEMS_PER_PAGE = 10;

interface QuotesListPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function QuotesListPage({ searchParams }: QuotesListPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1'));

  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.quote.count(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 mt-1">
            {totalCount} documento{totalCount !== 1 ? 's' : ''} registrado{totalCount !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link 
          href="/dashboard/quotes/new" 
          className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors"
        >
          + Nueva Cotización
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {quotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b bg-gray-50">
                  <th className="px-6 py-4">Nº</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha Emisión</th>
                  <th className="px-6 py-4">Validez</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="text-sm hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-blue-900">
                      {String(quote.correlativo).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{quote.client.razonSocial}</div>
                      <div className="text-xs text-gray-400">{quote.client.rut}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(quote.fechaEmision).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(quote.fechaValidez).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      ${quote.montoTotal.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        quote.estado === 'Aceptada' ? 'bg-green-100 text-green-700' :
                        quote.estado === 'Borrador' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {quote.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <QuoteActions quoteId={quote.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            No hay cotizaciones disponibles.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="text-xs text-gray-400">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
            </div>
            <div className="flex items-center space-x-2">
              {currentPage > 1 ? (
                <Link
                  href={`/dashboard/quotes?page=${currentPage - 1}`}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center"
                >
                  <span className="material-icons text-sm mr-1">chevron_left</span> Anterior
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-white border border-slate-100 rounded-lg cursor-not-allowed flex items-center">
                  <span className="material-icons text-sm mr-1">chevron_left</span> Anterior
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/dashboard/quotes?page=${page}`}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors ${
                    page === currentPage
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </Link>
              ))}

              {currentPage < totalPages ? (
                <Link
                  href={`/dashboard/quotes?page=${currentPage + 1}`}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center"
                >
                  Siguiente <span className="material-icons text-sm ml-1">chevron_right</span>
                </Link>
              ) : (
                <span className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-white border border-slate-100 rounded-lg cursor-not-allowed flex items-center">
                  Siguiente <span className="material-icons text-sm ml-1">chevron_right</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
