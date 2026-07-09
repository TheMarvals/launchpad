import React from 'react';
import SowPDF from '@/components/SowPDF';
import { getCompanyProfile } from '@/app/actions/settings';

export default async function SowTemplatePreview() {
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated — render template with defaults
  }

  const mockSow = {
    correlativo: 0,
    fechaEmision: new Date(),
    fechaValidez: null,
    notasCondiciones: '',
    propuesta: '',
    client: { razonSocial: '', rut: '', giro: '' },
    items: []
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-8 overflow-x-auto">
      <div className="w-[210mm] shadow-2xl bg-white">
        <SowPDF sow={mockSow} isTemplate={true} companyProfile={companyProfile} />
      </div>
    </div>
  );
}
