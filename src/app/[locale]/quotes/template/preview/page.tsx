import React from 'react';
import QuotePDF from '@/components/QuotePDF';
import { getCompanyProfile } from '@/app/actions/settings';

export default async function QuoteTemplatePreview() {
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated — render template with defaults
  }

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
    <div className="min-h-screen bg-slate-100 flex justify-center py-8">
      <div className="w-[210mm] shadow-2xl bg-white overflow-hidden">
        <QuotePDF quote={mockQuote} isTemplate={true} companyProfile={companyProfile} />
      </div>
    </div>
  );
}
