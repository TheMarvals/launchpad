import React from 'react';
import QuotePDF from '@/components/QuotePDF';

export default function QuoteTemplatePreview() {
  const mockQuote = {
    correlativo: 0,
    fechaEmision: new Date(),
    fechaValidez: null,
    montoNeto: 0,
    montoIva: 0,
    montoTotal: 0,
    taxName: 'IVA',
    taxPercent: 19,
    extraFeeName: null,
    extraFeeAmount: 0,
    paymentMethod: null,
    notasCondiciones: '',
    propuesta: '',
    client: { razonSocial: '', rut: '', giro: '' },
    items: []
  };

  return (
    <div className="m-0 p-0">
      <QuotePDF quote={mockQuote} isTemplate={true} />
    </div>
  );
}
