'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Client } from '@prisma/client';
import { createInvoice, updateInvoice } from '@/app/actions/invoices';

interface InvoiceFormProps {
  clients: Client[];
  initialData?: any;
}

export default function InvoiceForm({ clients, initialData }: InvoiceFormProps) {
  const t = useTranslations('Invoices');
  const tForm = useTranslations('QuoteForm');
  const locale = useLocale();
  const router = useRouter();
  const isEditing = !!initialData;

  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [fechaVencimiento, setFechaVencimiento] = useState(
    initialData?.fechaVencimiento 
      ? new Date(initialData.fechaVencimiento).toISOString().split('T')[0] 
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  const [taxName, setTaxName] = useState(initialData?.taxName || 'IVA');
  const [taxPercent, setTaxPercent] = useState(initialData?.taxPercent?.toString() || '19');
  const [extraFeeName, setExtraFeeName] = useState(initialData?.extraFeeName || '');
  const [extraFeeAmount, setExtraFeeAmount] = useState(initialData?.extraFeeAmount?.toString() || '0');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [estado, setEstado] = useState(initialData?.estado || 'Pendiente');
  const [notas, setNotas] = useState(initialData?.notas || '');

  const [items, setItems] = useState(
    initialData?.items?.map((it: any) => ({
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
    })) || [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const iva = Math.round(neto * ((parseFloat(taxPercent) || 0) / 100));
  const fee = parseFloat(extraFeeAmount) || 0;
  const total = neto + iva + fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return alert(tForm('errors.selectClient'));
    
    setIsSubmitting(true);
    try {
      const itemsWithSubtotals = items.map(item => ({
        ...item,
        subtotal: Number(item.cantidad) * Number(item.precioUnitario)
      }));

      const payload = {
        clientId,
        fechaVencimiento,
        notas,
        estado,
        taxName,
        taxPercent,
        extraFeeName: extraFeeName || null,
        extraFeeAmount,
        paymentMethod: paymentMethod || null,
        items: itemsWithSubtotals
      };

      if (isEditing) {
        await updateInvoice(initialData.id, payload);
      } else {
        await createInvoice(payload);
      }
      
      router.push('/dashboard/invoices');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(tForm('errors.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            {isEditing ? t('editInvoice') : t('newInvoice')}
          </h1>
          <p className="text-slate-500 text-sm">{t('subtitle', { count: 0 })}</p>
        </div>
        <div className="flex gap-3">
           <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl border-2 border-slate-100 font-bold text-slate-400 hover:bg-slate-50 transition-all text-sm"
          >
            {tForm('close')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl bg-slate-900 text-white font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 text-sm disabled:opacity-50"
          >
            {isSubmitting ? tForm('saving') : (isEditing ? tForm('update') : t('newInvoice'))}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Selection */}
        <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{tForm('clientLabel')}</label>
          <select 
            className="w-full border-2 border-slate-50 rounded-xl p-4 bg-slate-50 focus:bg-white transition-all outline-none font-bold text-slate-700"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">{tForm('clientPlaceholder')}</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.razonSocial} ({c.rut})</option>
            ))}
          </select>
        </div>

        {/* Date & Status */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('table.dueDate')}</label>
            <input 
              type="date" 
              className="w-full border-2 border-slate-50 rounded-xl p-4 bg-slate-50 focus:bg-white transition-all outline-none font-bold text-slate-700"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              required
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('table.status')}</label>
            <select 
              className="w-full border-2 border-slate-50 rounded-xl p-4 bg-slate-50 focus:bg-white transition-all outline-none font-bold text-slate-700"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="Pendiente">{t('status.Pendiente')}</option>
              <option value="Pagada">{t('status.Pagada')}</option>
              <option value="Anulada">{t('status.Anulada')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{tForm('economicDetail')}</h2>
          <button 
            type="button" 
            onClick={addItem}
            className="flex items-center text-blue-600 font-black text-[10px] uppercase tracking-widest hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-lg"
          >
            <span className="material-icons text-sm mr-2">add_circle</span> {tForm('addItem')}
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center group">
              <div className="col-span-6 space-y-2">
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-50 rounded-xl p-3 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                  placeholder={tForm('itemLabel')}
                  value={item.descripcion}
                  onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <input 
                  type="number" 
                  className="w-full border-2 border-slate-50 rounded-xl p-3 bg-slate-50 focus:bg-white transition-all font-bold text-center text-sm"
                  placeholder={tForm('quantity')}
                  value={item.cantidad}
                  onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-3 space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    className="w-full border-2 border-slate-50 rounded-xl p-3 pl-7 bg-slate-50 focus:bg-white transition-all font-bold text-sm"
                    placeholder={tForm('unitPrice')}
                    value={item.precioUnitario}
                    onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-span-1 flex justify-center">
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="text-slate-200 hover:text-red-500 transition-colors p-2"
                >
                  <span className="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Financial configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-50">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tForm('taxLabel')}</label>
            <input 
              type="text" 
              className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="Ej. IVA"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tForm('taxPercent')}</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tForm('extraFeeLabel')}</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-grow border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                value={extraFeeName}
                onChange={(e) => setExtraFeeName(e.target.value)}
                placeholder="Ej. PayPal Fee"
              />
              <input 
                type="number" 
                className="w-24 border-2 border-slate-100 rounded-xl p-3 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                value={extraFeeAmount}
                onChange={(e) => setExtraFeeAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-8">
          <div className="w-80 space-y-3 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 ml-auto shadow-sm">
            <div className="flex justify-between text-[10px] font-black text-slate-400 tracking-widest uppercase">
              <span>{tForm('net')}</span>
              <span className="text-slate-900 font-bold">${neto.toLocaleString(locale)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 tracking-widest uppercase">
              <span>{taxName} ({taxPercent}%)</span>
              <span className="text-slate-900 font-bold">${iva.toLocaleString(locale)}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between text-[10px] font-black text-slate-400 tracking-widest uppercase">
                <span>{extraFeeName || tForm('extraFee')}</span>
                <span className="text-slate-900 font-bold">${fee.toLocaleString(locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl pt-4 border-t border-slate-200 font-black">
              <span className="text-[10px] font-black text-slate-500 self-center tracking-widest uppercase">{tForm('total')}</span>
              <span className="text-slate-900">${total.toLocaleString(locale)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <span className="material-icons text-sm mr-2 text-blue-600">note_alt</span> Notas Internas / Detalles
          </label>
          <textarea 
            className="w-full border-2 border-slate-50 rounded-xl p-4 text-sm bg-slate-50 min-h-[150px] focus:bg-white transition-all outline-none"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Escribe notas adicionales para la factura..."
          />
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <span className="material-icons text-sm mr-2 text-blue-600">account_balance_wallet</span> {tForm('paymentMethodLabel')}
          </label>
          <input 
            type="text" 
            className="w-full border-2 border-slate-50 rounded-xl p-4 text-sm bg-slate-50 focus:bg-white transition-all outline-none"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder={tForm('paymentMethodPlaceholder')}
          />
          <p className="text-[10px] text-slate-400 italic">
            Especifica cómo deseas recibir el pago.
          </p>
        </div>
      </div>
    </form>
  );
}
