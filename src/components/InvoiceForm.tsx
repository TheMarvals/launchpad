'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Client } from '@prisma/client';
import { createInvoice, updateInvoice } from '@/app/actions/invoices';
import InvoicePDF from './InvoicePDF';

interface InvoiceFormProps {
  clients: Client[];
  admins?: any[];
  companyProfile?: any;
  initialData?: any;
}

export default function InvoiceForm({ clients, admins = [], companyProfile, initialData }: InvoiceFormProps) {
  const t = useTranslations('Invoices');
  const tForm = useTranslations('QuoteForm');
  const locale = useLocale();
  const router = useRouter();
  const isEditing = !!initialData;

  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [userId, setUserId] = useState(initialData?.userId || '');
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
  const [totalLabel, setTotalLabel] = useState(initialData?.totalLabel || '');
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
  const [showPreview, setShowPreview] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const targetWidth = 794; 
        const padding = 32;
        const availableWidth = width - padding;
        if (availableWidth < targetWidth) {
          setPreviewScale(availableWidth / targetWidth);
        } else {
          setPreviewScale(1);
        }
      }
    });
    observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, [showPreview, showMobilePreview]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        totalLabel: totalLabel || null,
        userId: userId || null,
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

  const selectedClient = clients.find((c: any) => c.id === clientId);

  const mockInvoice = {
    correlativo: initialData?.correlativo || 0,
    fechaEmision: initialData?.fechaEmision || new Date(),
    fechaVencimiento: new Date(fechaVencimiento),
    montoNeto: neto,
    montoIva: iva,
    montoTotal: total,
    taxName,
    taxPercent: parseFloat(taxPercent),
    extraFeeName,
    extraFeeAmount: fee,
    paymentMethod,
    totalLabel,
    notas,
    estado,
    client: selectedClient || { razonSocial: 'CLIENTE NO SELECCIONADO', rut: '---' },
    items: items.map((it: any) => ({ ...it, subtotal: Number(it.cantidad) * Number(it.precioUnitario) })),
    user: admins.find((a: any) => a.id === userId) || null,
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex flex-col items-center">
        <div className="w-full max-w-5xl h-full flex flex-col p-md">
          <div className="bg-canvas p-sm border-b border-hairline flex justify-between items-center shrink-0">
            <div className="flex items-center">
              <span className="material-icons text-ink mr-xs">description</span>
              <h3 className="font-medium text-ink uppercase tracking-wider text-sm md:text-base">{tForm('preview')}</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowPreview(false)}
              className="px-sm h-[40px] bg-transparent border border-hairline text-muted hover:text-ink hover:border-ink transition-colors flex items-center"
            >
              <span className="material-icons text-sm mr-xxs">close</span> {tForm('close')}
            </button>
          </div>
          <div className="flex-grow bg-canvas overflow-auto p-sm md:p-lg border-x border-b border-hairline">
            <div className="w-full max-w-[210mm] mx-auto flex flex-col items-center gap-md">
              <InvoicePDF invoice={mockInvoice} companyProfile={companyProfile} />
            </div>
            <div className="h-24" /> 
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-md max-w-5xl pb-xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs mb-md">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">
            {isEditing ? t('editInvoice') : t('newInvoice')}
          </h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle', { count: 0 })}</p>
        </div>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            onClick={() => setShowMobilePreview(prev => !prev)}
            className="lg:hidden flex items-center gap-1 px-xs py-xxs text-xs font-semibold uppercase tracking-wider transition-colors border text-muted hover:text-ink border-transparent hover:border-hairline"
            title="Alternar vista previa"
          >
            <span className="material-icons text-sm">visibility</span>
            {showMobilePreview ? 'Ocultar' : 'Preview'}
          </button>
        </div>
      </div>

      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
          <span className="material-icons mr-xxs text-primary">business</span> Datos de la Factura
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-sm">
          <div className="space-y-xxs">
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

          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{tForm('senderLabel') || 'Remitente'}</label>
            <div className="relative">
              <select 
                className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">{tForm('senderPlaceholder') || 'Seleccionar Remitente (Usar Company Profile)'}</option>
                {admins.map((admin: any) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} {admin.cargo ? `(${admin.cargo})` : ''}
                  </option>
                ))}
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-sm lg:h-[calc(100vh-280px)] lg:min-h-[550px]">
        <div className="space-y-md lg:overflow-y-auto lg:pr-sm lg:h-full lg:pb-xl">
          <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
            <div className="flex justify-between items-center">
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

            <div className="space-y-sm border-t border-hairline pt-sm">
              {items.map((item: any, index: number) => (
                <div key={index} className="bg-canvas border border-hairline p-sm space-y-xs relative">
                  {/* Description - 100% width */}
                  <div className="space-y-xxs">
                    <label className="block text-caption-uppercase text-ink font-semibold">{tForm('itemLabel')}</label>
                    <textarea 
                      className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm min-h-[70px] resize-y"
                      placeholder={tForm('itemLabel')}
                      value={item.descripcion}
                      onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                      rows={2}
                      required
                    />
                  </div>
                  
                  {/* Values: Qty, Unit Price, Subtotal, Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-sm pt-xs border-t border-hairline/20">
                    <div className="flex gap-sm">
                      {/* Quantity */}
                      <div className="w-24 space-y-xxs">
                        <label className="block text-caption-uppercase text-ink font-semibold">{tForm('quantity')}</label>
                        <input 
                          type="number" 
                          min="1"
                          className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-center font-semibold px-xs py-xxs text-sm"
                          placeholder={tForm('quantity')}
                          value={item.cantidad}
                          onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                          required
                        />
                      </div>
                      
                      {/* Unit Price */}
                      <div className="w-36 space-y-xxs">
                        <label className="block text-caption-uppercase text-ink font-semibold">{tForm('unitPrice')}</label>
                        <div className="relative">
                          <span className="absolute left-xs top-1/2 -translate-y-1/2 text-muted font-semibold">$</span>
                          <input 
                            type="number" 
                            className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors font-semibold pl-md px-xs py-xxs text-sm"
                            placeholder={tForm('unitPrice')}
                            value={item.precioUnitario}
                            onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="flex items-center gap-md self-end pb-[2px]">
                      <div className="text-right">
                        <div className="text-caption-uppercase text-muted text-[10px] mb-0">{tForm('subtotal')}</div>
                        <div className="font-semibold text-ink text-sm">
                          ${(Number(item.cantidad) * Number(item.precioUnitario) || 0).toLocaleString(locale)}
                        </div>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        className="p-xxs text-muted hover:text-semantic-warning transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-icons text-lg">delete_outline</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-sm pt-sm border-t border-hairline">
              <div className="space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{tForm('taxLabel')}</label>
                <input 
                  type="text" 
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
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
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{tForm('extraFeeLabel')}</label>
                <div className="grid grid-cols-3 gap-xxs">
                  <input 
                    type="text" 
                    className="col-span-2 w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                    value={extraFeeName}
                    onChange={(e) => setExtraFeeName(e.target.value)}
                    placeholder="Ej. PayPal Fee"
                  />
                  <input 
                    type="number" 
                    className="col-span-1 w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                    value={extraFeeAmount}
                    onChange={(e) => setExtraFeeAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">Texto "Total"</label>
                <input 
                  type="text" 
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xxs text-sm"
                  value={totalLabel}
                  onChange={(e) => setTotalLabel(e.target.value)}
                  placeholder={`Ej. ${t('total')}`}
                />
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
                  <span className="text-caption-uppercase text-muted self-center">{totalLabel || t('total')}</span>
                  <span className="text-ink font-medium">${total.toLocaleString(locale)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
              <label className="text-caption-uppercase text-ink font-semibold flex items-center">
                <span className="material-icons text-sm mr-xxs text-primary">note_alt</span> Notas Internas / Detalles
              </label>
              <textarea 
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm min-h-[120px]"
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
        </div>

        <div className={`border border-hairline bg-canvas overflow-hidden flex flex-col min-h-[400px] lg:min-h-0 h-full ${
          showMobilePreview ? 'block' : 'hidden lg:flex'
        }`}>
          <div className="flex items-center justify-between px-sm py-xxs bg-canvas border-b border-hairline/50 shrink-0">
            <div className="flex items-center gap-2 text-caption-uppercase text-muted font-semibold text-xs">
              <span className="material-icons text-sm">visibility</span>
              Vista Previa en Vivo
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink transition-colors flex items-center gap-1"
              title="Vista previa en pantalla completa"
            >
              <span className="material-icons text-sm">fullscreen</span>
              <span className="hidden sm:inline">Pantalla Completa</span>
            </button>
          </div>
          <div ref={previewContainerRef} className="overflow-x-hidden overflow-y-auto flex-1 p-sm md:p-md bg-ink/5">
            <div 
              className="w-full flex flex-col items-center"
              style={{ 
                height: previewScale < 1 ? `calc(100% * ${previewScale})` : 'auto' 
              }}
            >
              <div 
                className="w-[210mm] max-w-none flex flex-col items-center gap-md"
                style={{ 
                  transform: `scale(${previewScale})`, 
                  transformOrigin: 'top center',
                }}
              >
                <InvoicePDF invoice={mockInvoice} companyProfile={companyProfile} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-xs bg-canvas-elevated p-sm border-t border-hairline sticky bottom-0 z-30">
        <div className="flex items-center justify-between sm:justify-start gap-xxs w-full sm:w-auto">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="text-muted font-semibold hover:text-ink transition-colors text-xs uppercase tracking-wider flex items-center"
          >
            <span className="material-icons text-sm mr-xxs">arrow_back</span>
            Volver
          </button>
          <div className="h-xs w-px bg-hairline" />
          <button 
            type="button" 
            onClick={() => setShowPreview(true)}
            className="text-ink font-semibold hover:text-ink/70 transition-all flex items-center text-xs uppercase tracking-wider"
          >
            <span className="material-icons mr-xxs text-sm">visibility</span>
            {tForm('preview')}
          </button>
        </div>
        
        <div className="flex gap-xxs w-full sm:w-auto justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="material-icons animate-spin mr-xxs text-sm">sync</span>
            ) : (
              <span className="material-icons mr-xxs text-sm">save</span>
            )}
            {isSubmitting ? tForm('saving') : isEditing ? tForm('update') : tForm('generate')}
          </button>
        </div>
      </div>
    </form>
  );
}
