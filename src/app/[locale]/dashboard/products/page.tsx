import React from 'react';

import { getTranslations } from 'next-intl/server';

export default async function ProductsPage() {
  const t = await getTranslations('Products');
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <button className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold opacity-50 cursor-not-allowed">
          <span className="material-icons text-sm mr-2 align-middle">add</span> {t('newProduct')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-12 text-center text-gray-400">
        <span className="material-icons text-6xl mb-4 opacity-20">inventory_2</span>
        <p>{t('inDevelopment')}</p>
        <p className="text-sm">{t('manualAdd')}</p>
      </div>
    </div>
  );
}
