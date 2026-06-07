import React from 'react';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import CsvDownloadButton from '@/components/CsvDownloadButton';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Products');

  const products = await prisma.product.findMany({
    orderBy: { nombre: 'asc' },
  });

  return (
    <div className="space-y-md font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-xs">
        <div>
          <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
          <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
        </div>
        <div className="flex flex-row gap-xxs w-full sm:w-auto">
          <CsvDownloadButton href="/api/products/export" locale={locale} />
          <button className="bg-primary/50 text-on-primary px-sm h-[48px] text-xs font-bold uppercase tracking-[1.4px] opacity-50 cursor-not-allowed flex items-center">
            <span className="material-icons text-sm mr-xxs">add</span> {t('newProduct')}
          </button>
        </div>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-hairline">
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{locale === 'es' ? 'Código' : 'Code'}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{locale === 'es' ? 'Nombre' : 'Name'}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold">{locale === 'es' ? 'Descripción' : 'Description'}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-right">{locale === 'es' ? 'Precio Neto' : 'Net Price'}</th>
                  <th className="px-sm py-xs text-caption-uppercase text-muted font-semibold text-center">{locale === 'es' ? 'Exento' : 'Exempt'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-canvas/80 transition-colors group">
                    <td className="px-sm py-xs font-mono text-sm text-muted">
                      {product.codigo || '—'}
                    </td>
                    <td className="px-sm py-xs font-medium text-ink text-sm">
                      {product.nombre}
                    </td>
                    <td className="px-sm py-xs text-body text-muted max-w-xs truncate">
                      {product.descripcion || '—'}
                    </td>
                    <td className="px-sm py-xs text-right font-medium text-ink">
                      ${product.precioNeto.toLocaleString(locale)}
                    </td>
                    <td className="px-sm py-xs text-center">
                      {product.esExento ? (
                        <span className="inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border border-semantic-success/30 bg-semantic-success/10 text-semantic-success">
                          {locale === 'es' ? 'Sí' : 'Yes'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-xxs py-[2px] text-caption-uppercase font-semibold border border-hairline bg-canvas-elevated text-muted">
                          {locale === 'es' ? 'No' : 'No'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-xl px-sm">
            <span className="material-icons text-5xl mb-xs opacity-20 text-muted mx-auto block">inventory_2</span>
            <p className="text-body text-muted">{t('inDevelopment')}</p>
            <p className="text-sm text-muted/70 mt-xxs">{t('manualAdd')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
