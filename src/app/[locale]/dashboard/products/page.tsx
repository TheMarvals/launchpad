import React from 'react';

import { getTranslations } from 'next-intl/server';

export default async function ProductsPage() {
  const t = await getTranslations('Products');
  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
        </div>
        <button className="bg-primary/50 text-on-primary px-sm h-[48px] text-xs font-bold uppercase tracking-[1.4px] opacity-50 cursor-not-allowed flex items-center">
          <span className="material-icons text-sm mr-xxs">add</span> {t('newProduct')}
        </button>
      </div>

      <div className="bg-canvas-elevated border border-hairline p-lg text-center">
        <span className="material-icons text-5xl mb-xs opacity-20 text-muted mx-auto block">inventory_2</span>
        <p className="text-body text-muted">{t('inDevelopment')}</p>
        <p className="text-sm text-muted/70 mt-xxs">{t('manualAdd')}</p>
      </div>
    </div>
  );
}
