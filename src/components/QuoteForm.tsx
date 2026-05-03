'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuote, updateQuote } from '@/app/actions/quotes';
import QuotePDF from './QuotePDF';

interface Client {
  id: string;
  razonSocial: string;
  rut: string;
  giro?: string;
  direccion?: string;
}

interface QuoteFormProps {
  clients: Client[];
  initialData?: {
    id: string;
    correlativo: number;
    clientId: string;
    fechaValidez: Date;
    propuesta: string | null;
    notasCondiciones: string | null;
    estado: string;
    items: { descripcion: string; cantidad: number; precioUnitario: number }[];
    client: Client;
  };
}

export default function QuoteForm({ clients, initialData }: QuoteFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [fechaValidez, setFechaValidez] = useState(
    initialData?.fechaValidez 
      ? new Date(initialData.fechaValidez).toISOString().split('T')[0] 
      : ''
  );
  
  // Multi-page Proposal State
  const [pages, setPages] = useState<string[]>(() => {
    if (initialData?.propuesta) {
      return initialData.propuesta.split('---PAGE_BREAK---');
    }
    return [
      `1. RESUMEN EJECUTIVO\n\nSe presenta una propuesta integral para el desarrollo de soluciones tecnológicas avanzadas...`,
      `2. PROPUESTA TÉCNICA\n\nArquitectura y Plataforma:\n\n• Desarrollo sobre estándares modernos\n• Escalabilidad y mantenibilidad`
    ];
  });

  const [notasCondiciones, setNotasCondiciones] = useState(initialData?.notasCondiciones || 'Pago 50% anticipado, 50% contra entrega. Válido por 15 días.');
  const [items, setItems] = useState(
    initialData?.items?.map(it => ({
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
    })) || [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const addPage = () => {
    setPages([...pages, '']);
  };

  const updatePage = (index: number, content: string) => {
    const newPages = [...pages];
    newPages[index] = content;
    setPages(newPages);
  };

  const removePage = (index: number) => {
    if (pages.length > 1) {
      setPages(pages.filter((_, i) => i !== index));
    }
  };

  const addItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const neto = items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precioUnitario) || 0), 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  const handleSubmit = async (estado: 'Borrador' | 'Enviada' = 'Enviada') => {
    if (!clientId) return alert('Por favor, selecciona un cliente.');
    
    setIsSubmitting(true);
    try {
      const itemsWithSubtotals = items.map(item => ({
        ...item,
        subtotal: Number(item.cantidad) * Number(item.precioUnitario)
      }));

      // Join pages with a unique separator
      const combinedPropuesta = pages.join('---PAGE_BREAK---');

      if (isEditing) {
        await updateQuote(initialData!.id, {
          clientId,
          fechaValidez,
          notasCondiciones,
          propuesta: combinedPropuesta,
          estado,
          items: itemsWithSubtotals
        });
      } else {
        await createQuote({
          clientId,
          fechaValidez,
          notasCondiciones,
          propuesta: combinedPropuesta,
          estado,
          items: itemsWithSubtotals
        });
      }
      
      router.push('/dashboard/quotes');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar la cotización.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  const mockQuote = {
    correlativo: 0,
    fechaEmision: new Date(),
    fechaValidez: fechaValidez ? new Date(fechaValidez) : null,
    montoNeto: neto,
    montoIva: iva,
    montoTotal: total,
    notasCondiciones,
    propuesta: pages.join('---PAGE_BREAK---'),
    client: selectedClient || { razonSocial: 'CLIENTE NO SELECCIONADO', rut: '---' },
    items: items.map(it => ({ ...it, subtotal: Number(it.cantidad) * Number(it.precioUnitario) }))
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center">
        <div className="w-full max-w-5xl h-full flex flex-col p-4 md:p-8">
          <div className="bg-white rounded-t-2xl p-4 border-b flex justify-between items-center shadow-2xl shrink-0">
            <div className="flex items-center">
              <span className="material-icons text-blue-900 mr-2">description</span>
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm md:text-base">Vista Previa del Documento</h3>
            </div>
            <button 
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 md:px-6 md:py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center"
            >
              <span className="material-icons text-sm mr-2">close</span> Cerrar
            </button>
          </div>
          <div className="flex-grow bg-slate-200/50 overflow-auto p-4 md:p-12 rounded-b-2xl shadow-inner border-x border-b border-white/20">
            <div className="min-w-[210mm] flex flex-col items-center gap-8">
              <QuotePDF quote={mockQuote} />
            </div>
            <div className="h-24" /> 
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-10 max-w-5xl pb-20 mx-auto">
      {/* 1. Header Information */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
        <h2 className="text-xl font-black flex items-center text-slate-900 tracking-tight">
          <span className="material-icons mr-3 text-blue-600 bg-blue-50 p-2 rounded-lg">business</span> Datos de la Cotización
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente Seleccionado</label>
            <select 
              className="w-full border-2 border-slate-100 rounded-xl p-3.5 bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Buscar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.razonSocial} ({c.rut})</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Validez</label>
            <input 
              type="date" 
              className="w-full border-2 border-slate-100 rounded-xl p-3.5 bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
              value={fechaValidez}
              onChange={(e) => setFechaValidez(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Multi-page Proposal Editor */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-black flex items-center text-slate-900 tracking-tight">
            <span className="material-icons mr-3 text-blue-600 bg-blue-50 p-2 rounded-lg">edit_note</span> Editor de Propuesta
          </h2>
          <button 
            type="button" 
            onClick={addPage}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center"
          >
            <span className="material-icons mr-2 text-sm">add</span> Nueva Página
          </button>
        </div>

        <div className="space-y-12">
          {pages.map((content, idx) => {
            const MAX_CHARS = 1130;
            const progress = (content.length / MAX_CHARS) * 100;
            const isNearLimit = progress > 85;

            return (
              <div key={idx} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden group">
                <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoja {idx + 1} de {pages.length}</span>
                    <div className="h-1 w-24 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${progress > 100 ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-bold ${progress > 100 ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-slate-400'}`}>
                      {Math.round(progress)}% capacidad
                    </span>
                  </div>
                  {pages.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removePage(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <span className="material-icons text-sm">delete_forever</span>
                    </button>
                  )}
                </div>
                <textarea 
                  className="w-full p-10 text-[15px] bg-white min-h-[400px] focus:outline-none font-sans leading-relaxed text-slate-700 scrollbar-hide"
                  value={content}
                  onChange={(e) => updatePage(idx, e.target.value)}
                  placeholder={`Contenido de la página ${idx + 1}...`}
                  maxLength={MAX_CHARS}
                />
                <div className="px-6 py-2 bg-slate-50 flex justify-between items-center border-t">
                  <div className="text-[10px] text-slate-400 italic">
                    {progress > 90 ? 'Límite de página alcanzado. Considera usar una nueva hoja.' : 'Formato A4 Estándar'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-300">
                    {content.length} / {MAX_CHARS} caracteres
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Items Table */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center text-slate-900 tracking-tight">
            <span className="material-icons mr-3 text-blue-600 bg-blue-50 p-2 rounded-lg">payments</span> Detalle Económico
          </h2>
          <button 
            type="button" 
            onClick={addItem}
            className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition-all flex items-center"
          >
            <span className="material-icons mr-2 text-sm">add_circle</span> Agregar Ítem
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-end border-b border-slate-50 pb-6 last:border-0">
              <div className="flex-grow space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Servicio / Producto</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white transition-all font-medium"
                  value={item.descripcion}
                  onChange={(e) => updateItem(idx, 'descripcion', e.target.value)}
                  required
                />
              </div>
              <div className="w-24 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white text-center font-bold"
                  value={item.cantidad}
                  onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                  required
                />
              </div>
              <div className="w-40 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio Unitario</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full border-2 border-slate-50 rounded-xl p-3 pl-8 text-sm bg-slate-50 focus:bg-white font-bold"
                    value={item.precioUnitario}
                    onChange={(e) => updateItem(idx, 'precioUnitario', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="w-32 text-right self-center pt-6">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Subtotal</div>
                <div className="font-black text-slate-900">
                  ${(Number(item.cantidad) * Number(item.precioUnitario) || 0).toLocaleString('es-CL')}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => removeItem(idx)}
                className="mb-1 p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <span className="material-icons">delete_outline</span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-8">
          <div className="w-64 space-y-3 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 ml-auto">
            <div className="flex justify-between text-xs font-semibold text-slate-500 tracking-widest uppercase">
              <span>Neto</span>
              <span>${neto.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 tracking-widest uppercase">
              <span>IVA (19%)</span>
              <span>${iva.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-xl pt-3 border-t border-slate-200 font-black">
              <span className="text-xs font-semibold text-slate-500 self-center tracking-widest uppercase">Total</span>
              <span className="text-slate-900">${total.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notes & Conditions */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
          <span className="material-icons text-sm mr-2">gavel</span> Notas y Condiciones Comerciales
        </label>
        <textarea 
          className="w-full border-2 border-slate-50 rounded-xl p-4 text-sm bg-slate-50 min-h-[120px] focus:bg-white transition-all outline-none"
          value={notasCondiciones}
          onChange={(e) => setNotasCondiciones(e.target.value)}
        />
      </div>

      {/* 5. Sticky Actions Bar */}
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl shadow-2xl sticky bottom-8 z-30 ring-1 ring-white/10">
        <div className="flex space-x-6 items-center pl-4">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="text-slate-400 font-bold hover:text-white transition-colors text-sm"
          >
            Cancelar
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button 
            type="button" 
            onClick={() => setShowPreview(true)}
            className="text-white font-bold hover:text-blue-400 transition-all flex items-center text-sm"
          >
            <span className="material-icons mr-2 text-base">visibility</span> Vista Previa
          </button>
        </div>
        
        <div className="flex space-x-4">
          <button 
            type="button" 
            onClick={() => handleSubmit('Borrador')}
            disabled={isSubmitting}
            className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50 text-sm border border-white/5"
          >
            Guardar Borrador
          </button>
          <button 
            type="button" 
            onClick={() => handleSubmit('Enviada')}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-base hover:bg-blue-500 shadow-xl shadow-blue-600/40 disabled:opacity-50 transition-all transform active:scale-95 flex items-center"
          >
            {isSubmitting ? (
              <span className="material-icons animate-spin mr-2">sync</span>
            ) : (
              <span className="material-icons mr-2">send</span>
            )}
            {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Cotización' : 'Generar Cotización'}
          </button>
        </div>
      </div>
    </form>
  );
}
