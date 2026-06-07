'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export default function DateRangeFilter({
  desde: initialDesde,
  hasta: initialHasta,
  locale,
}: {
  desde: string;
  hasta: string;
  locale: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildHref = useCallback(
    (desde: string, hasta: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (desde) params.set('desde', desde);
      else params.delete('desde');
      if (hasta) params.set('hasta', hasta);
      else params.delete('hasta');
      // Reset page when changing date filter
      params.delete('page');
      return `?${params.toString()}`;
    },
    [searchParams]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const desde = (formData.get('desde') as string) || '';
    const hasta = (formData.get('hasta') as string) || '';
    router.push(buildHref(desde, hasta));
  };

  const hasFilter = initialDesde || initialHasta;

  const handleClear = () => {
    router.push(buildHref('', ''));
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-xxs flex-wrap">
      <input
        type="date"
        name="desde"
        defaultValue={initialDesde}
        className="h-[36px] px-xxs text-xs text-ink bg-canvas border border-hairline rounded-none focus:outline-none focus:border-ink transition-colors [color-scheme:var(--color-scheme)]"
        title={locale === 'es' ? 'Desde' : 'From'}
      />
      <span className="text-muted text-xs px-[2px]">—</span>
      <input
        type="date"
        name="hasta"
        defaultValue={initialHasta}
        className="h-[36px] px-xxs text-xs text-ink bg-canvas border border-hairline rounded-none focus:outline-none focus:border-ink transition-colors [color-scheme:var(--color-scheme)]"
        title={locale === 'es' ? 'Hasta' : 'To'}
      />
      <button
        type="submit"
        className="h-[36px] px-sm text-xs font-bold uppercase tracking-[1px] bg-ink text-canvas hover:bg-ink/80 transition-colors"
      >
        {locale === 'es' ? 'Filtrar' : 'Filter'}
      </button>
      {hasFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="h-[36px] px-sm text-xs font-bold uppercase tracking-[1px] text-muted hover:text-ink bg-transparent border border-hairline hover:bg-canvas transition-colors flex items-center gap-xxs"
        >
          <span className="material-icons text-sm">close</span>
          {locale === 'es' ? 'Limpiar' : 'Clear'}
        </button>
      )}
    </form>
  );
}
