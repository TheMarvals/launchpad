import React from 'react';
import RfiPDF from '@/components/RfiPDF';
import { getCompanyProfile } from '@/app/actions/settings';

export default async function RfiTemplatePreview() {
  let companyProfile = null;
  try {
    companyProfile = await getCompanyProfile();
  } catch (e) {
    // Not authenticated — render template with defaults
  }

  const mockRfi = {
    correlativo: 0,
    fechaEmision: new Date(),
    fechaValidez: null,
    notasCondiciones: '',
    propuesta: '',
    client: { razonSocial: '', rut: '', giro: '' },
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-8 overflow-x-auto">
      <div className="w-[210mm] shadow-2xl bg-white">
        <RfiPDF rfi={mockRfi} isTemplate={true} companyProfile={companyProfile} />
      </div>
    </div>
  );
}
