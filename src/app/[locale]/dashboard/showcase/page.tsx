import React from 'react';
import { getTranslations } from 'next-intl/server';
import ShowcaseManager from './ShowcaseManager';

export default async function ShowcasePage() {
  const t = await getTranslations('Showcase');

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
        </div>
      </div>

      <ShowcaseManager />
    </div>
  );
}
