'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuote, updateQuote } from '@/app/actions/quotes';
import { useTranslations, useLocale } from 'next-intl';
import QuotePDF from './QuotePDF';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean']
  ],
};

const EDITOR_STYLE = `
  .ql-container.ql-snow {
    border: none !important;
    font-family: inherit;
    font-size: 15px;
  }
  .ql-toolbar.ql-snow {
    border: none !important;
    border-bottom: 1px solid #f1f5f9 !important;
    background: #f8fafc;
    padding: 8px 24px !important;
  }
  .ql-editor {
    padding: 24px !important;
    min-height: 300px;
    line-height: 1.6;
    color: #334155;
  }
  @media (min-width: 768px) {
    .ql-editor {
      padding: 40px !important;
      min-height: 400px;
    }
  }
  .ql-editor.ql-blank::before {
    left: 40px !important;
    font-style: italic;
    color: #cbd5e1;
  }
`;

interface Client {
  id: string;
  razonSocial: string;
  rut: string;
  giro?: string;
  direccion?: string;
}

interface QuoteFormProps {
  clients: Client[];
  companyProfile?: any;
  initialData?: {
    id: string;
    correlativo: number;
    clientId: string;
    fechaValidez: Date;
    propuesta: string | null;
    notasCondiciones: string | null;
    estado: string;
    taxName: string;
    taxPercent: number;
    extraFeeName: string | null;
    extraFeeAmount: number;
    paymentMethod: string | null;
    items: { descripcion: string; cantidad: number; precioUnitario: number }[];
    client: Client;
  };
}

export default function QuoteForm({ clients, companyProfile, initialData }: QuoteFormProps) {
  const t = useTranslations('QuoteForm');
  const tCommon = useTranslations('Dashboard.recentQuotes');
  const locale = useLocale();
  const router = useRouter();
  const isEditing = !!initialData;

  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [fechaValidez, setFechaValidez] = useState(
    initialData?.fechaValidez 
      ? new Date(initialData.fechaValidez).toISOString().split('T')[0] 
      : ''
  );
  
  // Custom Taxes & Fees State
  const [taxName, setTaxName] = useState(initialData?.taxName || 'IVA');
  const [taxPercent, setTaxPercent] = useState(initialData?.taxPercent?.toString() || '19');
  const [extraFeeName, setExtraFeeName] = useState(initialData?.extraFeeName || '');
  const [extraFeeAmount, setExtraFeeAmount] = useState(initialData?.extraFeeAmount?.toString() || '0');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');

  // Proposal content — single editor, auto-paginates in QuotePDF
  const [propuesta, setPropuesta] = useState<string>(() => {
    if (initialData?.propuesta) {
      // Migrate old PAGE_BREAK format: join pages into a single string
      return initialData.propuesta.replace(/---PAGE_BREAK---/g, '');
    }
    return t.raw('defaultProposal.page1');
  });

  const [notasCondiciones, setNotasCondiciones] = useState(initialData?.notasCondiciones || t('defaultNotes'));
  const [items, setItems] = useState(
    initialData?.items?.map(it => ({
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
    })) || [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);


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

  const handleSubmit = async (estado: 'Borrador' | 'Enviada' = 'Enviada') => {
    if (!clientId) return alert(t('errors.selectClient'));
    
    setIsSubmitting(true);
    try {
      const itemsWithSubtotals = items.map((item: any) => ({
        ...item,
        subtotal: Number(item.cantidad) * Number(item.precioUnitario)
      }));


      const payload = {
        clientId,
        fechaValidez,
        notasCondiciones,
        propuesta,
        estado,
        taxName,
        taxPercent,
        extraFeeName: extraFeeName || null,
        extraFeeAmount,
        paymentMethod: paymentMethod || null,
        items: itemsWithSubtotals
      };

      if (isEditing) {
        await updateQuote(initialData!.id, payload);
      } else {
        await createQuote(payload);
      }
      
      router.push('/dashboard/quotes');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(t('errors.saveError'));
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
    taxName,
    taxPercent: parseFloat(taxPercent),
    extraFeeName,
    extraFeeAmount: fee,
    paymentMethod,
    notasCondiciones,
    propuesta,
    client: selectedClient || { razonSocial: 'CLIENTE NO SELECCIONADO', rut: '---' },
    items: items.map(it => ({ ...it, subtotal: Number(it.cantidad) * Number(it.precioUnitario) }))
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex flex-col items-center">
        <div className="w-full max-w-5xl h-full flex flex-col p-md">
          <div className="bg-canvas p-sm border-b border-hairline flex justify-between items-center shrink-0">
            <div className="flex items-center">
              <span className="material-icons text-ink mr-xs">description</span>
              <h3 className="font-medium text-ink uppercase tracking-wider text-sm md:text-base">{t('preview')}</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowPreview(false)}
              className="px-sm h-[40px] bg-transparent border border-hairline text-muted hover:text-ink hover:border-ink transition-colors flex items-center"
            >
              <span className="material-icons text-sm mr-xxs">close</span> {t('close')}
            </button>
          </div>
          <div className="flex-grow bg-canvas overflow-auto p-sm md:p-lg border-x border-b border-hairline">
            <div className="w-full max-w-[210mm] mx-auto flex flex-col items-center gap-md">
              <QuotePDF quote={mockQuote} companyProfile={companyProfile} />
            </div>
            <div className="h-24" /> 
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-md max-w-5xl pb-xl mx-auto font-sans">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLE }} />
      {/* 1. Header Information */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
          <span className="material-icons mr-xxs text-primary">business</span> {t('title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('clientLabel')}</label>
            <div className="relative">
              <select 
                className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm appearance-none cursor-pointer pr-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">{t('clientPlaceholder')}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.razonSocial} ({c.rut})</option>
                ))}
              </select>
              <span className="material-icons absolute right-xxs top-1/2 -translate-y-1/2 text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
          <div className="space-y-xxs">
            <label className="block text-caption-uppercase text-ink font-semibold">{t('validityLabel')}</label>
            <input 
              type="date" 
              className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
              value={fechaValidez}
              onChange={(e) => setFechaValidez(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Proposal Editor */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
          <span className="material-icons mr-xxs text-primary">edit_note</span> {t('proposalTitle')}
        </h2>
        <p className="text-body text-muted text-sm">
          Escribe toda la propuesta aquí. Las páginas se generarán automáticamente en la vista previa.
        </p>

        <div className="border border-hairline overflow-hidden">
          <div className="bg-canvas min-h-[500px]">
            <ReactQuill 
              theme="snow"
              value={propuesta}
              onChange={setPropuesta}
              modules={QUILL_MODULES}
              className="h-full border-none"
              placeholder="Escribe la propuesta completa..."
            />
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-title-sm font-medium text-ink uppercase tracking-wider flex items-center">
            <span className="material-icons mr-xxs text-primary">payments</span> {t('economicDetail')}
          </h2>
          <button 
            type="button" 
            onClick={addItem}
            className="text-ink font-semibold text-xs uppercase tracking-wider hover:bg-canvas px-sm py-xs transition-colors flex items-center border border-hairline"
          >
            <span className="material-icons mr-xxs text-sm">add</span> {t('addItem')}
          </button>
        </div>

        <div className="space-y-sm border-t border-hairline pt-sm">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="bg-surface-card p-sm md:p-0 md:bg-transparent md:border-none space-y-sm md:space-y-0 md:flex md:gap-sm md:items-end pb-sm border-b border-hairline/20 mb-sm last:border-b-0 last:mb-0 last:pb-0">
              {/* Description - full width on mobile */}
              <div className="w-full md:w-auto md:flex-1 space-y-xxs">
                <label className="text-caption-uppercase text-ink font-semibold">{t('itemLabel')}</label>
                <input 
                  type="text" 
                  className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
                  value={item.descripcion}
                  onChange={(e) => updateItem(idx, 'descripcion', e.target.value)}
                  required
                />
              </div>
              {/* Quantity + Unit Price - side by side on mobile */}
              <div className="grid grid-cols-2 md:flex md:gap-sm gap-2 items-end">
                <div className="md:w-24 space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('quantity')}</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors text-center font-semibold px-xs py-xs text-sm"
                    value={item.cantidad}
                    onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                    required
                  />
                </div>
                <div className="md:w-40 space-y-xxs">
                  <label className="text-caption-uppercase text-ink font-semibold">{t('unitPrice')}</label>
                  <div className="relative">
                    <span className="absolute left-xs top-1/2 -translate-y-1/2 text-muted font-semibold">$</span>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full border border-hairline bg-canvas text-ink focus:border-primary outline-none transition-colors font-semibold pl-md px-xs py-xs text-sm"
                      value={item.precioUnitario}
                      onChange={(e) => updateItem(idx, 'precioUnitario', e.target.value)}
                      required
                    />
                  </div>
                </div>
                {/* Subtotal - desktop only here */}
                <div className="hidden md:block md:w-32 text-right self-center pb-xxs">
                  <div className="text-caption-uppercase text-muted mb-xxs">{t('subtotal')}</div>
                  <div className="font-medium text-ink">
                    ${(Number(item.cantidad) * Number(item.precioUnitario) || 0).toLocaleString(locale)}
                  </div>
                </div>
                {/* Delete - desktop only here */}
                <button 
                  type="button" 
                  onClick={() => removeItem(idx)}
                  className="hidden md:block pb-xxs p-xxs text-muted hover:text-semantic-warning transition-colors self-end"
                >
                  <span className="material-icons">delete_outline</span>
                </button>
              </div>
              {/* Mobile: subtotal + delete row */}
              <div className="flex md:hidden justify-between items-center pt-1 border-t border-hairline/10">
                <div className="flex items-center gap-1">
                  <span className="text-caption-uppercase text-muted text-xs">{t('subtotal')}</span>
                  <span className="font-semibold text-ink text-sm">
                    ${(Number(item.cantidad) * Number(item.precioUnitario) || 0).toLocaleString(locale)}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeItem(idx)}
                  className="p-xxs text-muted hover:text-semantic-warning transition-colors flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
                >
                  <span className="material-icons text-sm">delete_outline</span>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-sm pt-sm border-t border-hairline">
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('taxLabel')}</label>
            <input 
              type="text" 
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="Ej. IVA"
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('taxPercent')}</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
            />
          </div>
          <div className="space-y-xxs">
            <label className="text-caption-uppercase text-ink font-semibold">{t('extraFeeLabel')}</label>
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
        </div>

        <div className="flex justify-end pt-md">
          <div className="w-full md:w-80 space-y-xxs p-sm bg-canvas border border-hairline ml-auto">
            <div className="flex justify-between text-caption-uppercase text-muted">
              <span>{t('net')}</span>
              <span className="text-ink font-medium">${neto.toLocaleString(locale)}</span>
            </div>
            <div className="flex justify-between text-caption-uppercase text-muted">
              <span>{taxName} ({taxPercent}%)</span>
              <span className="text-ink font-medium">${iva.toLocaleString(locale)}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between text-caption-uppercase text-muted">
                <span>{extraFeeName || t('extraFee')}</span>
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

      {/* 4. Notes & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <label className="text-caption-uppercase text-ink font-semibold flex items-center">
            <span className="material-icons text-sm mr-xxs text-primary">gavel</span> {t('notesTitle')}
          </label>
          <textarea 
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm min-h-[150px]"
            value={notasCondiciones}
            onChange={(e) => setNotasCondiciones(e.target.value)}
          />
        </div>
        <div className="bg-canvas-elevated border border-hairline p-sm space-y-sm">
          <label className="text-caption-uppercase text-ink font-semibold flex items-center">
            <span className="material-icons text-sm mr-xxs text-primary">account_balance_wallet</span> {t('paymentMethodLabel')}
          </label>
          <input 
            type="text" 
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors px-xs py-xs text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder={t('paymentMethodPlaceholder')}
          />
          <p className="text-caption text-muted mt-xxs">
            Especifica cómo deseas recibir el pago (Transferencia, PayPal, etc.)
          </p>
        </div>
      </div>

      {/* 5. Sticky Actions Bar */}
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
            {t('preview')}
          </button>
        </div>
        
        <div className="flex gap-xxs w-full sm:w-auto justify-end">
          <button 
            type="button" 
            onClick={() => handleSubmit('Borrador')}
            disabled={isSubmitting}
            className="bg-transparent border border-hairline text-ink px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-canvas transition-colors disabled:opacity-50"
          >
            {t('saveDraft')}
          </button>
          <button 
            type="button" 
            onClick={() => handleSubmit('Enviada')}
            disabled={isSubmitting}
            className="bg-primary text-on-primary px-sm py-xs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors flex items-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="material-icons animate-spin mr-xxs text-sm">sync</span>
            ) : (
              <span className="material-icons mr-xxs text-sm">send</span>
            )}
            {isSubmitting ? t('saving') : isEditing ? t('update') : t('generate')}
          </button>
        </div>
      </div>
    </form>
  );
}
