import React from 'react';

export default async function EmailsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center text-muted">
      <div className="w-20 h-20 bg-canvas-elevated rounded-full flex items-center justify-center mb-4">
        <span className="material-icons text-4xl opacity-50">mark_email_unread</span>
      </div>
      <h2 className="text-lg font-bold text-ink mb-2">
        {locale === 'es' ? 'Bandeja de entrada' : 'Inbox'}
      </h2>
      <p className="max-w-md w-full text-sm">
        {locale === 'es' 
          ? 'Selecciona un correo de la lista a la izquierda para leer su contenido.' 
          : 'Select an email from the list on the left to read its contents.'}
      </p>
    </div>
  );
}
