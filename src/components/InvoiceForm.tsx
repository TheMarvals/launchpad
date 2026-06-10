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
      setItems(items.filter((_: any, i: number) => i !== index));
    }
  };

  const neto = items.reduce((acc: number, item: any) => acc + (Number(item.cantidad) * Number(item.precioUnitario) || 0), 0);
  const iva = Math.round(neto * ((parseFloat(taxPercent) || 0) / 100));
  const fee = parseFloat(extraFeeAmount) || 0;
  const total = neto + iva + fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return alert(tForm('errors.selectClient'));
    
    setIsSubmitting(true);
    try {
      const itemsWithSubtotals = items.map((item: any) => ({
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
    <form onSubmit={handleSubmit} className="space-y-md max-w-5xl mx-auto pb-xl font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs mb-md">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">
            {isEditing ? t('editInvoice') : t('newInvoice')}
          </h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle', { count: 0 })}</p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-initial bg-transparent border border-hairline text-ink hover:bg-canvas px-sm h-[48px] text-xs font-semibold uppercase tracking-wider flex items-center justify-center transition-colors"
          >
            {tForm('close')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary-hover text-on-primary px-sm h-[48px] text-xs font-semibold uppercase tracking-wider flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {isSubmitting ? tForm('saving') : (isEditing ? tForm('update') : t('newInvoice'))}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
        {/* Client Selection */}
        <div className="md:col-span-2 bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <label className="block text-caption-uppercase text-ink font-semibold">{tForm('clientLabel')}</label>
          <div className="relative">
            <select 
              className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">{tForm('clientPlaceholder')}</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.razonSocial} ({c.rut})</option>
              ))}
            </select>
            <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
          </div>
        </div>

        {/* Date & Status */}
        <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('table.dueDate')}</label>
            <input 
              type="date" 
              className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              required
            />
          </div>
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('table.status')}</label>
            <div className="relative">
              <select 
                className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="Pendiente">{t('status.Pendiente')}</option>
                <option value="Pagada">{t('status.Pagada')}</option>
                <option value="Anulada">{t('status.Anulada')}</option>
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-canvas-elevated border border-hairline p-sm">
        <div className="flex justify-between items-center mb-sm">
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
            <span className="material-icons mr-xxs text-primary">payments</span> {tForm('economicDetail')}
          </h2>
          <button 
            type="button" 
            onClick={addItem}
            className="text-ink font-semibold text-xs uppercase tracking-wider hover:bg-canvas px-sm py-xs transition-colors flex items-center border border-hairline"
          >
            <span className="material-icons mr-xxs text-sm">add</span> {tForm('addItem')}
          </button>
        </div>

        <div className="space-y-sm border-t border-hairline pt-sm mb-md">
          {items.map((item: any, index: number) => (
            <div key={index} className="bg-surface-card p-sm md:p-0 md:bg-transparent md:border-none space-y-sm md:space-y-0 md:flex md:gap-sm md:items-end pb-sm border-b border-hairline/20 mb-sm last:border-b-0 last:mb-0 last:pb-0">
              {/* Description - full width on mobile */}
              <div className="w-full md:w-auto md:flex-1 space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{tForm('itemLabel')}</label>
                <input 
                  type="text" 
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xspy-xs text-sm"
              placeholder={tForm('itemLabel')}
              value={item.descripcion}
              onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
              required
            />
              </div>
              {/* Quantity + Unit Price - side by side on mobile */}
              <div className="grid grid-cols-2 md:flex md:gap-sm gap-2 items-end">
                <div className="md:w-24 space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{tForm('quantity')}</label>
                  <input 
                    type="number" 
                    className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-center font-semibold px-xs py-xs text-sm"
                    placeholder={tForm('quantity')}
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                    required
                  />
                </div>
                <div className="md:w-40 space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{tForm('unitPrice')}</label>
                  <div className="relative">
                    <span className="absolute left-xs top-1/2 -translate-y-1/2 text-muted font-semibold">$</span>
                    <input 
                      type="number" 
                      className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors font-semibold pl-md px-xs py-xs text-sm"
                      placeholder={tForm('unitPrice')}
                      value={item.precioUnitario}
                      onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)}
                      required
                    />
                  </div>
                </div>
                {/* Subtotal - desktop only */}
                <div className="hidden md:block md:w-32 text-right self-center pb-xxs">
                  <div className="text-caption-uppercase text-muted mb-xxs">{tForm('subtotal')}</div>
                  <div className="font-medium text-ink">
                    ${(Number(item.cantidad) * Number(item.precioUnitario) || 0).toLocaleString(locale)}
                  </div>
                </div>
                {/* Delete - desktop only */}
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="hidden md:block pb-xxs p-xxs text-muted hover:text-semantic-warning transition-colors self-end"
                >
                  <span className="material-icons text-sm">delete_outline</span>
                </button>
              </div>
              {/* Mobile: subtotal + delete row */}
              <div className="flex md:hidden justify-between items-center pt-1 border-t border-hairline/10">
                <div className="flex items-center gap-1">
                  <span className="text-caption-uppercase text-muted text-xs">{tForm('subtotal')}</span>
                  <span className="font-semibold text-ink text-sm">
                    ${(Number(item.cantidad) * Number(item.precioUnitario) || 0).toLocaleString(locale)}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="p-xxs text-muted hover:text-semantic-warning transition-colors flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
                >
                  <span className="material-icons text-sm">delete_outline</span>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Financial configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sm pt-sm border-t border-hairline">
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{tForm('taxLabel')}</label>
            <input 
              type="text" 
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xspy-xs text-sm"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="Ej. IVA"
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{tForm('taxPercent')}</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xspy-xs text-sm"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{tForm('extraFeeLabel')}</label>
            <div className="grid grid-cols-12 gap-xxs">
              <input 
                type="text" 
                className="col-span-8 w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                value={extraFeeName}
                onChange={(e) => setExtraFeeName(e.target.value)}
                placeholder="Ej. PayPal Fee"
              />
              <input 
                type="number" 
                className="col-span-4 w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                value={extraFeeAmount}
                onChange={(e) => setExtraFeeAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-md">
          <div className="w-full md:w-80 space-y-xxs p-sm bg-canvas border border-hairline ml-auto">
            <div className="flex justify-between text-caption-uppercase text-muted">
              <span>{tForm('net')}</span>
              <span className="text-ink font-medium">${neto.toLocaleString(locale)}</span>
            </div>
            <div className="flex justify-between text-caption-uppercase text-muted">
              <span>{taxName} ({taxPercent}%)</span>
              <span className="text-ink font-medium">${iva.toLocaleString(locale)}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between text-caption-uppercase text-muted">
                <span>{extraFeeName || tForm('extraFee')}</span>
                <span className="text-ink font-medium">${fee.toLocaleString(locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl pt-xs mt-xs border-t border-hairline">
              <span className="text-caption-uppercase text-muted self-center">{t('total')}</span>
              <span className="text-ink font-medium">${total.toLocaleString(locale)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <label className="text-caption-uppercase text-ink font-semibold flex items-center">
            <span className="material-icons text-sm mr-xxs text-primary">note_alt</span> Notas Internas / Detalles
          </label>
          <textarea 
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm min-h-[150px]"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Escribe notas adicionales para la factura..."
          />
        </div>
        <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <label className="text-caption-uppercase text-ink font-semibold flex items-center">
            <span className="material-icons text-sm mr-xxs text-primary">account_balance_wallet</span> {tForm('paymentMethodLabel')}
          </label>
          <input 
            type="text" 
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder={tForm('paymentMethodPlaceholder')}
          />
          <p className="text-caption text-muted mt-xxs">
            Especifica cómo deseas recibir el pago.
          </p>
        </div>
      </div>
    </form>
  );
}
